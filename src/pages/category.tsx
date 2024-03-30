import { BlogPosts } from "../components/BlogPosts";
import { $getBlogPosts } from "../../data";
import { Category as CategoryType } from "../../data.types";

export async function Category({ category }: { category: CategoryType }) {
  const posts = await $getBlogPosts(category.id);
  return (
    <>
      <h1>Category: {category.title}</h1>
      <BlogPosts posts={posts} />
    </>
  );
}

export const CategoryMeta = (category: CategoryType) => ({
  title: `Category: ${category.title}`,
  description: `Posts in the category ${category.title}`,
});
