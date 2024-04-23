import { css } from "hono/css";

export function NotFound() {
  return (
    <div class={sCenteredContainer}>
      <h1>404</h1>
      <p>We couldn't find the page you were looking for :(</p>
      <img
        class={sGif}
        src="https://i.giphy.com/11Tsyjflf2xq2A.webp"
        alt="a gif of Rick being Rick"
      />
    </div>
  );
}

export const NotFoundMeta = { title: "Page Not Found" };

const sCenteredContainer = css`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const sGif = css`
  margin-top: 1.2em;
`;
