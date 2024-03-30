import { PostWithId } from "../../data.types";
import { css } from "hono/css";

export async function BlogPosts({ posts }: { posts: PostWithId[] }) {
  return (
    <>
      <ul class={sPostsList}>
        {posts.map(({ title, date, id }, index) => (
          <li class={sPostListItem} key={index}>
            <a class={sPostAnchor} href={`/blog/${id}`}>
              {title}
            </a>
            <p>{date}</p>
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
  margin-bottom: 16px;
`;

const sPostAnchor = css`
  color: var(--accent-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
