import { css } from "hono/css";
import { BlogPosts } from "../components/BlogPosts";
import { $getBlogPosts } from "../../data";
import { Socials } from "../components/Socials";

export async function Home() {
  const posts = await $getBlogPosts();
  return (
    <>
      <div class={sTitleContainer}>
        <h1 class={sTitle}>Hi! I'm Ömer</h1>
        <p>
          I am a software engineer based in 🇹🇷. I build, reverse-engineer, and occasionally break stuff.
        </p>
        <br></br>
        <Socials />
      </div>
      <div class={sBlogContainer}>
        <h2>Blog</h2>
        <BlogPosts posts={posts} />
      </div>
    </>
  );
}

export const HomeMeta = {
  title: "Home",
  description: "Ömer Aydın's Homepage",
};

const sTitle = css`
  letter-spacing: -0.02em;
`;

const sTitleContainer = css`
  margin-top: 4em;
  margin-bottom: 4em;
`;

const sBlogContainer = css`
  margin-top: 2em;
`;
