import { css } from "hono/css";

export function Socials() {
  const socials = [
    {
      title: "Twitter",
      url: "https://twitter.com/omeraydindev",
      avatarUrl: "https://abs.twimg.com/favicons/twitter.2.ico",
    },
    {
      title: "GitHub",
      url: "https://github.com/MikeAndrson",
    },
    {
      title: "LinkedIn",
      url: "https://www.linkedin.com/in/%C3%B6merayd%C4%B1n/",
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
}: {
  title: string;
  url: string;
  avatarUrl?: string;
}) {
  avatarUrl ??= getAvatarUrl(url);

  return (
    <a
      href={url}
      target="_blank"
      class={sSocialLink}
      style={`--url: url(${avatarUrl})`}
    >
      {title}
    </a>
  );
}

function getAvatarUrl(urlString: string) {
  const url = new URL(urlString);
  url.pathname = "";
  url.search = "";
  return `https://v1.indieweb-avatar.11ty.dev/${encodeURIComponent(url.toString())}`;
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
