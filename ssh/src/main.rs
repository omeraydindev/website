mod app;
mod generated {
    include!(concat!(env!("OUT_DIR"), "/generated.rs"));
}
mod ui;

use std::collections::HashMap;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::backend::CrosstermBackend;
use ratatui::layout::Rect;
use ratatui::{Terminal, TerminalOptions, Viewport};
use russh::server::*;
use russh::ChannelId;
use tokio::sync::Mutex;
use tokio::sync::mpsc;

type SshTerminal = Terminal<CrosstermBackend<TerminalHandle>>;

struct SessionState {
    terminal: SshTerminal,
    app: app::App,
}

struct TerminalHandle {
    sender: mpsc::UnboundedSender<Vec<u8>>,
    sink: Vec<u8>,
}

impl TerminalHandle {
    fn new(handle: Handle, channel_id: ChannelId) -> Self {
        let (sender, mut receiver) = mpsc::unbounded_channel::<Vec<u8>>();
        tokio::spawn(async move {
            while let Some(data) = receiver.recv().await {
                if handle.data(channel_id, data).await.is_err() {
                    break;
                }
            }
        });
        Self {
            sender,
            sink: Vec::new(),
        }
    }
}

impl std::io::Write for TerminalHandle {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.sink.extend_from_slice(buf);
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        if !self.sink.is_empty() {
            let data = std::mem::take(&mut self.sink);
            self.sender.send(data).map_err(|_| {
                std::io::Error::new(std::io::ErrorKind::BrokenPipe, "channel closed")
            })?;
        }
        Ok(())
    }
}

#[derive(Clone)]
struct AppServer {
    sessions: Arc<Mutex<HashMap<usize, SessionState>>>,
    next_id: Arc<AtomicUsize>,
}

impl AppServer {
    fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            next_id: Arc::new(AtomicUsize::new(0)),
        }
    }
}

impl Server for AppServer {
    type Handler = AppHandler;
    fn new_client(&mut self, _: Option<std::net::SocketAddr>) -> AppHandler {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);

        AppHandler {
            id,
            sessions: self.sessions.clone(),
        }
    }
}

struct AppHandler {
    id: usize,
    sessions: Arc<Mutex<HashMap<usize, SessionState>>>,
}

impl Handler for AppHandler {
    type Error = anyhow::Error;

    async fn channel_open_session(
        &mut self,
        channel: russh::Channel<Msg>,
        session: &mut Session,
    ) -> Result<bool, Self::Error> {

        let th = TerminalHandle::new(session.handle(), channel.id());
        let backend = CrosstermBackend::new(th);
        let terminal = Terminal::with_options(
            backend,
            TerminalOptions {
                viewport: Viewport::Fixed(Rect { x: 0, y: 0, width: 80, height: 24 }),
            },
        )?;
        let app = app::App::default();

        self.sessions
            .lock()
            .await
            .insert(self.id, SessionState { terminal, app });

        Ok(true)
    }

    async fn auth_publickey(
        &mut self,
        _: &str,
        _: &russh::keys::ssh_key::PublicKey,
    ) -> Result<Auth, Self::Error> {
        Ok(Auth::Accept)
    }

    async fn auth_password(&mut self, _: &str, _: &str) -> Result<Auth, Self::Error> {
        Ok(Auth::Accept)
    }

    async fn auth_none(&mut self, _: &str) -> Result<Auth, Self::Error> {
        Ok(Auth::Accept)
    }

    async fn data(
        &mut self,
        channel: ChannelId,
        data: &[u8],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        let mut sessions = self.sessions.lock().await;
        let Some(state) = sessions.get_mut(&self.id) else {
            return Ok(());
        };

        for event in parse_keys(data) {
            if event.code == KeyCode::Char('c') && event.modifiers == KeyModifiers::CONTROL {
                state.app.should_quit = true;
                break;
            }
            state.app.handle_key(event.code);
        }

        if state.app.should_quit {
            sessions.remove(&self.id);
            session.close(channel)?;
            return Ok(());
        }

        state.terminal.draw(|f| ui::render(f, &state.app))?;

        Ok(())
    }

    async fn window_change_request(
        &mut self,
        _: ChannelId,
        col_width: u32,
        row_height: u32,
        _: u32,
        _: u32,
        _: &mut Session,
    ) -> Result<(), Self::Error> {
        let mut sessions = self.sessions.lock().await;
        if let Some(state) = sessions.get_mut(&self.id) {
            state.terminal.resize(Rect {
                x: 0,
                y: 0,
                width: col_width as u16,
                height: row_height as u16,
            })?;
        }
        Ok(())
    }

    async fn pty_request(
        &mut self,
        channel: ChannelId,
        _: &str,
        col_width: u32,
        row_height: u32,
        _: u32,
        _: u32,
        _: &[(russh::Pty, u32)],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        let mut sessions = self.sessions.lock().await;
        if let Some(state) = sessions.get_mut(&self.id) {
            state.terminal.resize(Rect {
                x: 0,
                y: 0,
                width: col_width as u16,
                height: row_height as u16,
            })?;
        }
        session.channel_success(channel)?;
        Ok(())
    }

    async fn env_request(
        &mut self,
        channel: ChannelId,
        _: &str,
        _: &str,
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        session.channel_success(channel)?;
        Ok(())
    }

    async fn shell_request(
        &mut self,
        channel: ChannelId,
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        let mut sessions = self.sessions.lock().await;
        if let Some(state) = sessions.get_mut(&self.id) {
            state.terminal.draw(|f| ui::render(f, &state.app))?;
        }
        session.channel_success(channel)?;
        Ok(())
    }
}

fn parse_keys(data: &[u8]) -> Vec<KeyEvent> {
    let mut events = Vec::new();
    let mut i = 0;
    while i < data.len() {
        match data[i] {
            b'\r' => events.push(KeyCode::Enter.into()),
            b'\x7f' | b'\x08' => events.push(KeyCode::Backspace.into()),
            b'\t' => events.push(KeyCode::Tab.into()),
            b'\x03' => events.push(KeyEvent::new(KeyCode::Char('c'), KeyModifiers::CONTROL)),
            b'\x1b' => {
                if i + 2 < data.len() && data[i + 1] == b'[' {
                    match data[i + 2] {
                        b'A' => events.push(KeyCode::Up.into()),
                        b'B' => events.push(KeyCode::Down.into()),
                        b'C' => events.push(KeyCode::Right.into()),
                        b'D' => events.push(KeyCode::Left.into()),
                        b'H' => events.push(KeyCode::Home.into()),
                        b'F' => events.push(KeyCode::End.into()),
                        b'5' if i + 3 < data.len() && data[i + 3] == b'~' => {
                            events.push(KeyCode::PageUp.into());
                        }
                        b'6' if i + 3 < data.len() && data[i + 3] == b'~' => {
                            events.push(KeyCode::PageDown.into());
                        }
                        _ => events.push(KeyCode::Esc.into()),
                    }
                    i += if matches!(data[i + 2], b'5' | b'6') { 3 } else { 2 };
                } else {
                    events.push(KeyCode::Esc.into());
                }
            }
            c if c.is_ascii_graphic() || c == b' ' => {
                events.push(KeyCode::Char(c as char).into());
            }
            _ => {}
        }
        i += 1;
    }
    events
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let mut server = AppServer::new();

    let config = Arc::new(Config {
        inactivity_timeout: Some(std::time::Duration::from_secs(3600)),
        auth_rejection_time: std::time::Duration::from_secs(3),
        auth_rejection_time_initial: Some(std::time::Duration::from_secs(0)),
        keys: vec![
            russh::keys::PrivateKey::random(
                &mut rand::rng(),
                russh::keys::ssh_key::Algorithm::Ed25519,
            )
            .unwrap(),
        ],
        nodelay: true,
        ..Default::default()
    });

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(22);

    eprintln!("Listening on port {port}...");
    server.run_on_address(config, ("0.0.0.0", port)).await?;
    Ok(())
}
