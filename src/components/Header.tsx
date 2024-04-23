import { css } from "hono/css";

export function Header() {
  return (
    <header class={sHeader}>
      <span>omeraydin.dev</span>
      <nav class={sNav}>
        <a class={sNavItem} href="/">
          home
        </a>
        <a class={sNavItem} href="/contact">
          contact
        </a>
      </nav>
    </header>
  );
}

const sHeader = css`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  padding: 1.9rem 0;
  margin: auto;
  width: clamp(300px, calc(85vw + 5px), 750px);
  gap: 8px;
`;

const sNav = css`
  margin: 0;
  padding: 0;
  display: flex;
  gap: 1.5rem;
`;

const sNavItem = css`
  color: var(--accent-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
