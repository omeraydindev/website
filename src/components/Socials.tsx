import { css } from "hono/css";

export function Socials() {
  const socials = [
    {
      title: "Twitter",
      url: "https://twitter.com/omeraydindev",
      avatarUrl: "/static/images/twitter.png",
    },
    {
      title: "GitHub",
      url: "https://github.com/omeraydindev",
      avatarUrl: "/static/images/github-light.png",
      avatarUrlDark: "/static/images/github-dark.png",
    },
    {
      title: "LinkedIn",
      url: "https://www.linkedin.com/in/%C3%B6merayd%C4%B1n/",
      avatarUrl: "/static/images/linkedin.png",
    },
  ];

  return (
    <p>
      You can find me on{" "}
      {socials.map((social, i) => (
        <>
          <Social
            title={social.title}
            url={social.url}
            avatarUrl={social.avatarUrl}
            avatarUrlDark={"avatarUrlDark" in social ? social.avatarUrlDark : undefined}
          />
          {i < socials.length - 1 ? ", " : "."}
        </>
      ))}
    </p>
  );
}

function Social({
  title,
  url,
  avatarUrl,
  avatarUrlDark,
}: {
  title: string;
  url: string;
  avatarUrl?: string;
  avatarUrlDark?: string;
}) {
  const darkStyle = avatarUrlDark ? `--url-dark: url(${avatarUrlDark});` : "";
  return (
    <a
      href={url}
      target="_blank"
      class={avatarUrlDark ? sSocialLinkDark : sSocialLink}
      style={`--url: url(${avatarUrl}); ${darkStyle}`}
    >
      {title}
    </a>
  );
}

const sSocialLink = css`
  &:after {
    content: "";
    display: inline-block;
    vertical-align: middle;
    width: 1.1rem;
    height: 1.1rem;
    margin-left: 0.35em;
    margin-bottom: 3px;
    border-radius: 3px;
    background-size: contain;
    background-image: var(--url);
  }
`;

const sSocialLinkDark = css`
  &:after {
    content: "";
    display: inline-block;
    vertical-align: middle;
    width: 1.1rem;
    height: 1.1rem;
    margin-left: 0.35em;
    margin-bottom: 3px;
    border-radius: 3px;
    background-size: contain;
    background-image: var(--url);
  }

  @media (prefers-color-scheme: dark) {
    &:after {
      background-image: var(--url-dark);
    }
  }
`;
