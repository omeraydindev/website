import { ContextRenderer, Hono } from "hono";
import { renderer } from "./renderer";
import { NotFound, NotFoundMeta } from "./pages/404";
import { Home, HomeMeta } from "./pages/home";
import { onlySSG, ssgParams } from "hono/ssg";
import {
  $getBlogPost,
  $getBlogPostPaths,
  $getCategory,
  $getCategoryPaths,
} from "../data";
import { BlogPost, BlogPostMeta } from "./pages/blogPost";
import { Blog, BlogMeta } from "./pages/blog";
import { Category, CategoryMeta } from "./pages/category";
import { Contact, ContactMeta } from "./pages/contact";

const app = new Hono();

app.use(renderer);

app.get("/", ({ render }) => render(<Home />, HomeMeta));

app.get("/contact", ({ render }) => render(<Contact />, ContactMeta));

app.get("/blog", ({ render }) => render(<Blog />, BlogMeta));

app.get(
  "/blog/:id",
  ssgParams(async () => await $getBlogPostPaths()),
  async ({ req, render, notFound }) => {
    const id = req.param("id");
    const post = await $getBlogPost(id);
    if (!post) return notFound();
    return render(<BlogPost post={post} />, BlogPostMeta(post));
  },
);

app.get(
  "/category/:id",
  ssgParams(async () => $getCategoryPaths()),
  ({ req, render, notFound }) => {
    const id = req.param("id");
    const category = $getCategory(id);
    if (!category) return notFound();
    return render(<Category category={category} />, CategoryMeta(category));
  },
);

const notFoundRenderer = ({ render }: { render: ContextRenderer }) =>
  render(<NotFound />, NotFoundMeta);

app.get("/404", onlySSG(), notFoundRenderer);
app.notFound(notFoundRenderer);

export default app;
