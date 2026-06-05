use crossterm::event::KeyCode;

#[derive(Clone, Copy, PartialEq)]
pub enum Page {
    Home,
    BlogDetail(usize),
    Contact,
}

pub struct BlogPost {
    pub title: &'static str,
    pub date: &'static str,
    pub slug: &'static str,
    pub body: &'static str,
}

pub struct App {
    pub page: Page,
    pub selected: usize,
    pub blog_scroll: usize,
    pub should_quit: bool,
    pub blog_posts: &'static [BlogPost],
}

impl Default for App {
    fn default() -> Self {
        Self {
            page: Page::Home,
            selected: 0,
            should_quit: false,
            blog_scroll: 0,
            blog_posts: crate::generated::BLOG_POSTS,
        }
    }
}

impl App {
    pub fn handle_key(&mut self, key: KeyCode) {
        match key {
            KeyCode::Char('h') | KeyCode::Char('H') => self.page = Page::Home,
            KeyCode::Char('c') | KeyCode::Char('C') => self.page = Page::Contact,
            _ => match self.page {
                Page::Home => match key {
                    KeyCode::Char('q') => self.should_quit = true,
                    KeyCode::Char('j') | KeyCode::Down => {
                        self.selected = self.selected.saturating_add(1).min(self.blog_posts.len().saturating_sub(1));
                    }
                    KeyCode::Char('k') | KeyCode::Up => {
                        self.selected = self.selected.saturating_sub(1);
                    }
                    KeyCode::Enter => {
                        self.page = Page::BlogDetail(self.selected);
                        self.blog_scroll = 0;
                    }
                    _ => {}
                },
                Page::BlogDetail(_) => match key {
                    KeyCode::Char('b') | KeyCode::Esc | KeyCode::Char('q') => {
                        self.page = Page::Home;
                        self.blog_scroll = 0;
                    }
                    KeyCode::Char('j') | KeyCode::Down => {
                        self.blog_scroll = self.blog_scroll.saturating_add(1);
                    }
                    KeyCode::Char('k') | KeyCode::Up => {
                        self.blog_scroll = self.blog_scroll.saturating_sub(1);
                    }
                    KeyCode::PageDown => {
                        self.blog_scroll = self.blog_scroll.saturating_add(15);
                    }
                    KeyCode::PageUp => {
                        self.blog_scroll = self.blog_scroll.saturating_sub(15);
                    }
                    _ => {}
                },
                Page::Contact => {
                    if let KeyCode::Char('q') = key {
                        self.should_quit = true
                    }
                }
            },
        }
    }
}
