import { css } from "hono/css";

export function Header() {
  return (
    <header class={sHeader}>
      <span>omeraydin.dev</span>
      <nav class={sNav}>
        <a class={sNavItem} href="/">
          home
        </a>
        <a
          class={sNavItem}
          href="https://twitter.com/messages/compose?recipient_id=3397524639"
        >
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
  padding: clamp(12px, 3vw, 30px) 1rem;
  margin: auto;
  width: clamp(380px, calc(85vw + 5px), 750px);
  gap: 8px;
`;

const sNav = css`
  margin: 0;
  padding: 0;
  display: flex;
  gap: clamp(0.5rem, 2vw, 30px);
`;

const sNavItem = css`
  color: var(--accent-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
