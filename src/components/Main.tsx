import { Child } from "hono/jsx";
import { css } from "hono/css";

export function Main({ children }: { children?: Child | undefined }) {
  return <main class={sMain}>{children}</main>;
}

const sMain = css`
  padding: 1rem;
  margin: 2em auto;
  width: clamp(300px, calc(85vw + 5px), 750px);
`;
