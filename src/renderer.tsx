import { jsxRenderer } from "hono/jsx-renderer";
import { Style } from "hono/css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Main } from "./components/Main";

const versionFile = (() => {
  const date = new Date().getTime();
  return (file: string) => file + (import.meta.env.PROD ? `?v=${date}` : "");
})();

export const renderer = jsxRenderer(({ children, title, description }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/static/favicons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/static/favicons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/static/favicons/favicon-16x16.png"
        />
        <link rel="manifest" href="/static/favicons/site.webmanifest" />
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
        <link href={versionFile("/static/style.css")} rel="stylesheet" />
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
