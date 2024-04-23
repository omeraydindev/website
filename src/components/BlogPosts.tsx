import { PostWithId } from "../../data.types";
import { css } from "hono/css";
import { formatBlogDate } from "../utils/date";

export async function BlogPosts({ posts }: { posts: PostWithId[] }) {
  return (
    <>
      <ul class={sPostsList}>
        {posts.map(({ title, date, id }, index) => (
          <li class={sPostListItem} key={index}>
            <a class={sPostAnchor} href={`/blog/${id}`}>
              {title}
            </a>
            <p class={sPostDate}>{formatBlogDate(date)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

const sPostsList = css`
  list-style-type: none;
  padding: 0;
`;

const sPostListItem = css`
  margin-bottom: 1em;
`;

const sPostAnchor = css`
  color: var(--accent-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const sPostDate = css`
  color: var(--misc-text-color);
  margin-top: 0.2em;
  font-size: 0.95em;
`;
