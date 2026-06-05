use ratatui::{
    Frame,
    layout::{Alignment, Constraint, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span, Text},
    widgets::{Block, BorderType, Borders, Paragraph, Wrap},
};
use crate::app::{App, BlogPost, Page};

const ACCENT: Color = Color::Rgb(33, 135, 171);
const HEADING: Color = Color::White;
const MUTED: Color = Color::DarkGray;

pub fn render(frame: &mut Frame, app: &App) {
    let outer = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::new().fg(ACCENT));

    let inner = outer.inner(frame.area());
    frame.render_widget(outer, frame.area());

    let [header, content, footer] = Layout::vertical([
        Constraint::Length(1),
        Constraint::Min(1),
        Constraint::Length(1),
    ])
    .areas(inner);

    render_header(frame, header, app);
    render_page(frame, content, app);
    render_footer(frame, footer, app);
}

fn render_page(frame: &mut Frame, area: ratatui::layout::Rect, app: &App) {
    match app.page {
        Page::Home => render_home(frame, area, app),
        Page::BlogDetail(i) => {
            let [_, col, _] = Layout::horizontal([
                Constraint::Fill(1),
                Constraint::Fill(5),
                Constraint::Fill(1),
            ])
            .areas(area);
            let post = &app.blog_posts[i];
            let text = render_markdown(post);
            frame.render_widget(
                Paragraph::new(text)
                    .scroll((app.blog_scroll as u16, 0))
                    .wrap(Wrap { trim: false }),
                col,
            );
        }
        Page::Contact => {
            frame.render_widget(contact_content(), area);
        }
    }
}

fn render_header(frame: &mut Frame, area: ratatui::layout::Rect, app: &App) {
    let brand = Paragraph::new(Line::from(vec![
        Span::styled(" omeraydin.dev ", Style::new().fg(ACCENT).add_modifier(Modifier::BOLD)),
    ]));
    frame.render_widget(brand, area);

    let on_home = app.page == Page::Home || matches!(app.page, Page::BlogDetail(_));
    let home_style = if on_home {
        Style::new().fg(ACCENT).add_modifier(Modifier::BOLD)
    } else {
        Style::new().fg(MUTED)
    };
    let contact_style = if app.page == Page::Contact {
        Style::new().fg(ACCENT).add_modifier(Modifier::BOLD)
    } else {
        Style::new().fg(MUTED)
    };

    let nav = Paragraph::new(Line::from(vec![
        Span::styled("[H]ome", home_style),
        Span::styled("  ", MUTED),
        Span::styled("[C]ontact", contact_style),
    ]))
    .right_aligned();
    frame.render_widget(nav, area);
}

fn render_home(frame: &mut Frame, area: ratatui::layout::Rect, app: &App) {
    let [hero_area, _gap, blog_area] = Layout::vertical([
        Constraint::Length(9),
        Constraint::Length(1),
        Constraint::Min(1),
    ])
    .areas(area);

    let hero = Text::from(vec![
        Line::from(""),
        Line::from(""),
        Line::from(""),
        Line::from(vec![Span::styled(
            "Hi! I'm \u{d6}mer",
            Style::new().fg(HEADING).add_modifier(Modifier::BOLD),
        )])
        .alignment(Alignment::Center),
        Line::from(""),
        Line::from("I am a \u{1f1f9}\u{1f1f7} software engineer based in \u{1f1e9}\u{1f1ea}.")
            .alignment(Alignment::Center),
        Line::from("I build, reverse-engineer, and occasionally break stuff.")
            .alignment(Alignment::Center),
        Line::from(""),
        Line::from(""),
    ]);
    frame.render_widget(Paragraph::new(hero), hero_area);

    let [_, col, _] = Layout::horizontal([
        Constraint::Fill(1),
        Constraint::Fill(5),
        Constraint::Fill(1),
    ])
    .areas(blog_area);

    let [blog_head, blog_list] = Layout::vertical([
        Constraint::Length(1),
        Constraint::Min(1),
    ])
    .areas(col);

    let blog_header = Paragraph::new(Line::from(vec![
        Span::styled("Blog", Style::new().fg(HEADING).add_modifier(Modifier::BOLD)),
    ]));
    frame.render_widget(blog_header, blog_head);

    let mut blog_lines: Vec<Line> = vec![Line::from("")];

    for post in app.blog_posts {
        let selected = app.blog_posts.iter().position(|p| p.slug == post.slug).unwrap() == app.selected;
        let indicator = if selected { "\u{25b8} " } else { "  " };
        let title_style = if selected {
            Style::new().fg(ACCENT).add_modifier(Modifier::BOLD)
        } else {
            Style::new().fg(ACCENT)
        };
        blog_lines.push(Line::from(vec![
            Span::styled(indicator, Style::new().fg(ACCENT).add_modifier(Modifier::BOLD)),
            Span::styled(post.title, title_style),
        ]));
        blog_lines.push(Line::from(vec![
            Span::raw("    "),
            Span::styled(post.date, Style::new().fg(MUTED)),
        ]));
        blog_lines.push(Line::from(""));
    }

    frame.render_widget(
        Paragraph::new(Text::from(blog_lines)).wrap(Wrap { trim: false }),
        blog_list,
    );
}

fn render_markdown(post: &BlogPost) -> Text<'static> {
    let body = post.body;
    let mut lines = vec![
        Line::from(""),
        Line::from(""),
        Line::from(vec![Span::styled(
            post.title,
            Style::new().fg(HEADING).add_modifier(Modifier::BOLD),
        )])
        .alignment(Alignment::Center),
        Line::from(vec![Span::styled(post.date, MUTED)]).alignment(Alignment::Center),
        Line::from(""),
    ];

    let mut in_code_block = false;
    let mut code_lines: Vec<String> = Vec::new();

    for line in body.lines() {
        if line.starts_with("```") {
            if in_code_block {
                flush_code_block(&mut lines, &mut code_lines);
                in_code_block = false;
            } else {
                in_code_block = true;
            }
            continue;
        }
        if in_code_block {
            code_lines.push(line.to_string());
            continue;
        }

        let trimmed = line.trim();
        if trimmed.is_empty() {
            lines.push(Line::from(""));
            continue;
        }
        if trimmed.starts_with("![") {
            if let Some(end_bracket) = trimmed.find(']') {
                let alt = &trimmed[2..end_bracket];
                let rest = &trimmed[end_bracket + 1..];
                if let Some(url) = rest.strip_prefix('(').and_then(|r| r.strip_suffix(')')) {
                    let full_url = if url.starts_with('/') {
                        format!("https://omeraydin.dev{}", url)
                    } else {
                        url.to_string()
                    };
                    lines.push(Line::from(vec![Span::styled(
                        if alt.is_empty() {
                            format!("[Image]({})", full_url)
                        } else {
                            format!("[Image: {}]({})", alt, full_url)
                        },
                        MUTED,
                    )]));
                    continue;
                }
            }
            continue;
        }
        if trimmed.starts_with('<') {
            continue;
        }

        if trimmed == "---" || trimmed == "* * *" {
            lines.push(Line::from(""));
            continue;
        }

        if let Some(text) = trimmed.strip_prefix("## ") {
            lines.push(Line::from(vec![Span::styled(
                parse_inline_plain(text),
                Style::new().fg(HEADING).add_modifier(Modifier::BOLD),
            )]));
            continue;
        }

        if let Some(text) = trimmed.strip_prefix("> ") {
            lines.push(Line::from(""));
            let mut spans = vec![Span::styled("\u{2502} ", MUTED)];
            spans.extend(parse_inline(text));
            lines.push(Line::from(spans));
            continue;
        }

        if let Some(text) = trimmed.strip_prefix("- ") {
            lines.push(Line::from(vec![
                Span::raw("  \u{2022} "),
                Span::raw(parse_inline_plain(text)),
            ]));
            continue;
        }

        if let Some(text) = trimmed.strip_prefix("1. ") {
            lines.push(Line::from(vec![
                Span::raw("  \u{2022} "),
                Span::raw(parse_inline_plain(text)),
            ]));
            continue;
        }

        lines.push(Line::from(parse_inline(trimmed.trim_matches('_'))));
    }

    if in_code_block {
        flush_code_block(&mut lines, &mut code_lines);
    }

    Text::from(lines)
}

fn flush_code_block(lines: &mut Vec<Line<'static>>, code_lines: &mut Vec<String>) {
    lines.push(Line::from(""));
    for cl in code_lines.drain(..) {
        lines.push(Line::from(vec![
            Span::raw("  "),
            Span::styled(cl, Style::new().fg(Color::Rgb(198, 120, 221))),
        ]));
    }
    lines.push(Line::from(""));
}

fn parse_inline(s: &str) -> Vec<Span<'static>> {
    let mut spans = Vec::new();
    let chars: Vec<char> = s.chars().collect();
    let len = chars.len();
    let mut i = 0;
    let mut buf = String::new();

    while i < len {
        if i + 1 < len && chars[i] == '!' && chars[i + 1] == '[' {
            flush_buf(&mut buf, &mut spans);
            i += 2;
            let mut alt = String::new();
            while i < len && chars[i] != ']' {
                alt.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            let mut url = String::new();
            if i < len && chars[i] == '(' {
                i += 1;
                while i < len && chars[i] != ')' {
                    url.push(chars[i]);
                    i += 1;
                }
                if i < len { i += 1; }
            }
            let full_url = if url.starts_with('/') {
                format!("https://omeraydin.dev{}", url)
            } else {
                url
            };
            spans.push(Span::styled(
                if alt.is_empty() {
                    format!("[Image]({})", full_url)
                } else {
                    format!("[Image: {}]({})", alt, full_url)
                },
                MUTED,
            ));
            continue;
        }

        if chars[i] == '[' {
            flush_buf(&mut buf, &mut spans);
            i += 1;
            let mut link_text = String::new();
            while i < len && chars[i] != ']' {
                link_text.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            let mut url = String::new();
            if i < len && chars[i] == '(' {
                i += 1;
                while i < len && chars[i] != ')' {
                    url.push(chars[i]);
                    i += 1;
                }
                if i < len { i += 1; }
            }
            if url.is_empty() {
                spans.push(Span::styled(link_text, Style::new().fg(ACCENT)));
            } else {
                spans.push(Span::styled(
                    format!("{} ({})", link_text, url),
                    Style::new().fg(ACCENT),
                ));
            }
            continue;
        }

        if chars[i] == '`' {
            flush_buf(&mut buf, &mut spans);
            i += 1;
            let mut code = String::new();
            while i < len && chars[i] != '`' {
                code.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            spans.push(Span::styled(
                code,
                Style::new().fg(Color::Rgb(198, 120, 221)),
            ));
            continue;
        }

        if i + 1 < len && chars[i] == '*' && chars[i + 1] == '*' {
            flush_buf(&mut buf, &mut spans);
            i += 2;
            let mut bold = String::new();
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '*') {
                bold.push(chars[i]);
                i += 1;
            }
            if i + 1 < len { i += 2; }
            spans.push(Span::styled(
                bold,
                Style::new().add_modifier(Modifier::BOLD),
            ));
            continue;
        }

        if chars[i] == '*' {
            flush_buf(&mut buf, &mut spans);
            i += 1;
            let mut italic = String::new();
            while i < len && chars[i] != '*' {
                italic.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            spans.push(Span::styled(
                italic,
                Style::new().add_modifier(Modifier::ITALIC),
            ));
            continue;
        }

        buf.push(chars[i]);
        i += 1;
    }

    flush_buf(&mut buf, &mut spans);
    spans
}

fn parse_inline_plain(s: &str) -> String {
    let mut out = String::new();
    let chars: Vec<char> = s.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        if i + 1 < len && chars[i] == '!' && chars[i + 1] == '[' {
            i += 2;
            let mut alt = String::new();
            while i < len && chars[i] != ']' {
                alt.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            let mut url = String::new();
            if i < len && chars[i] == '(' {
                i += 1;
                while i < len && chars[i] != ')' {
                    url.push(chars[i]);
                    i += 1;
                }
                if i < len { i += 1; }
            }
            let full_url = if url.starts_with('/') {
                format!("https://omeraydin.dev{}", url)
            } else {
                url
            };
            out.push_str(&if alt.is_empty() {
                format!("[Image]({})", full_url)
            } else {
                format!("[Image: {}]({})", alt, full_url)
            });
            continue;
        }
        if chars[i] == '[' {
            i += 1;
            let mut link_text = String::new();
            while i < len && chars[i] != ']' {
                link_text.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            let mut url = String::new();
            if i < len && chars[i] == '(' {
                i += 1;
                while i < len && chars[i] != ')' {
                    url.push(chars[i]);
                    i += 1;
                }
                if i < len { i += 1; }
            }
            if url.is_empty() {
                out.push_str(&link_text);
            } else {
                out.push_str(&format!("{} ({})", link_text, url));
            }
            continue;
        }
        if chars[i] == '`' {
            i += 1;
            while i < len && chars[i] != '`' {
                out.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            continue;
        }
        if i + 1 < len && chars[i] == '*' && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '*') {
                out.push(chars[i]);
                i += 1;
            }
            if i + 1 < len { i += 2; }
            continue;
        }
        if chars[i] == '*' {
            i += 1;
            while i < len && chars[i] != '*' {
                out.push(chars[i]);
                i += 1;
            }
            if i < len { i += 1; }
            continue;
        }
        out.push(chars[i]);
        i += 1;
    }

    out
}

fn flush_buf(buf: &mut String, spans: &mut Vec<Span<'static>>) {
    if !buf.is_empty() {
        spans.push(Span::raw(std::mem::take(buf)));
    }
}

fn contact_content() -> Paragraph<'static> {
    let text = Text::from(vec![
        Line::from(""),
        Line::from(""),
        Line::from(vec![Span::styled(
            "Contact",
            Style::new().fg(HEADING).add_modifier(Modifier::BOLD),
        )])
        .alignment(Alignment::Center),
        Line::from(""),
        Line::from(vec![Span::styled("Email", MUTED)])
            .alignment(Alignment::Center),
        Line::from(vec![Span::styled("hi@omeraydin.dev", Style::new().fg(ACCENT).add_modifier(Modifier::BOLD))])
            .alignment(Alignment::Center),
        Line::from(""),
        Line::from(vec![Span::styled("Twitter", MUTED)])
            .alignment(Alignment::Center),
        Line::from(vec![Span::styled("https://twitter.com/omeraydindev", Style::new().fg(ACCENT).add_modifier(Modifier::BOLD))])
            .alignment(Alignment::Center),
        Line::from(""),
        Line::from(vec![Span::styled("GitHub", MUTED)])
            .alignment(Alignment::Center),
        Line::from(vec![Span::styled("https://github.com/omeraydindev", Style::new().fg(ACCENT).add_modifier(Modifier::BOLD))])
            .alignment(Alignment::Center),
        Line::from(""),
        Line::from(vec![Span::styled("LinkedIn", MUTED)])
            .alignment(Alignment::Center),
        Line::from(vec![Span::styled("https://linkedin.com/in/\u{f6}merayd\u{131}n", Style::new().fg(ACCENT).add_modifier(Modifier::BOLD))])
            .alignment(Alignment::Center),
        Line::from(""),
        Line::from(vec![Span::styled("CV", MUTED)])
            .alignment(Alignment::Center),
        Line::from(vec![Span::styled("https://omeraydin.dev/cv", Style::new().fg(ACCENT).add_modifier(Modifier::BOLD))])
            .alignment(Alignment::Center),
    ]);

    Paragraph::new(text)
}

fn render_footer(frame: &mut Frame, area: ratatui::layout::Rect, app: &App) {
    let hint = match app.page {
        Page::BlogDetail(_) => "q to go back",
        _ => "q to exit",
    };
    let footer = Paragraph::new(Line::from(vec![
        Span::styled("\u{a9} 2026 \u{d6}mer Ayd\u{131}n", Style::new().fg(MUTED)),
        Span::styled(" \u{b7} ", MUTED),
        Span::styled(hint, Style::new().fg(MUTED)),
    ]))
    .alignment(Alignment::Center);
    frame.render_widget(footer, area);
}
