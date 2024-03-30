import { raw } from "hono/html";
import { css } from "hono/css";
import { PostWithContent } from "../../data.types";

export async function BlogPost({ post }: { post: PostWithContent }) {
  const publishDate = new Date(post.date).toLocaleDateString("en", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <>
      <strong class={sPublished}>{publishDate}</strong>
      <h1 class={sTitle}>{post.title}</h1>
      <article class={sArticle}>{raw(post.content)}</article>
      <div class={sCategories}>
        In{" "}
        {post.categories.map((category, index) => (
          <>
            <div class={sCategory}>
              <a href={`/category/${category.id}`}>{category.title}</a>
            </div>
            {index < post.categories.length - 1 && (
              <div class={sCategorySeparator}>,</div>
            )}
          </>
        ))}
      </div>
    </>
  );
}

export const BlogPostMeta = (post: PostWithContent) => ({
  title: post.title,
  description: post.contentRaw.slice(0, 160),
});

const sPublished = css`
  color: #666;
`;

const sTitle = css`
  margin-top: 0.2em;
  letter-spacing: -0.02em;
`;

const sCategories = css`
  color: #666;
  margin-top: 3em;
`;

const sCategory = css`
  color: #666;
  display: inline-block;

  a {
    color: inherit;
  }
`;

const sCategorySeparator = css`
  display: inline-block;
  white-space: pre-wrap;
  margin-right: 0.4em;
`;

const sArticle = css`
  margin-top: 1.5em;
  line-height: 1.6;

  a {
    color: var(--link-color);
  }

  h2 {
    margin-top: 1em;
    margin-bottom: 0.5em;
  }

  p {
    margin-top: 0;
    margin-bottom: 1.5em;
  }

  h2 + p {
    margin-top: 1em;
  }

  p:has(> img) {
    margin-top: 2em;
    margin-bottom: 2.5em;
  }

  blockquote {
    border-left-color: #e2e2e2;
    border-left-width: 1px;
    border-left-style: solid;
    padding-left: 1.5em;
    box-sizing: border-box;
    overflow-wrap: break-word;
    margin-top: 2.5em;
    margin-bottom: 2.5em;
  }

  figure {
    p {
      margin-bottom: 1em;
    }
    figcaption {
      font-size: 0.8em;
      color: #666;
      margin-bottom: 2.5em;

      em {
        font-style: italic;
      }
    }
  }

  hr {
    border: none;
    border-top: 1px solid #e2e2e2;
    margin-top: 2.5em;
    margin-bottom: 2.5em;
  }

  pre {
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
  }
`;
