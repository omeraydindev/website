import { jsxRenderer } from "hono/jsx-renderer";
import { Style } from "hono/css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Main } from "./components/Main";

export const renderer = jsxRenderer(({ children, title, description }) => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
        />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link href="/static/reset.css" rel="stylesheet" />
        <link href="/static/style.css" rel="stylesheet" />
        <Style />
        <title>{title} - Ömer Aydın</title>
        {description && <meta name="description" content={description} />}
      </head>
      <body>
        <Header />
        <Main>{children}</Main>
        <Footer />
      </body>
    </html>
  );
});
