import { BlogPosts } from "../components/BlogPosts";
import { $getBlogPosts } from "../../data";

export async function Blog() {
  const posts = await $getBlogPosts();
  return (
    <>
      <h1>Blog</h1>
      <BlogPosts posts={posts} />
    </>
  );
}

export const BlogMeta = {
  title: "Blog",
  description: "Ömer Aydın's Blog",
};
