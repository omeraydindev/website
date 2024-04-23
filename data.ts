import { marked } from "marked";
import { getHighlighter } from "shiki";
import fm from "front-matter";
import z from "zod";
import { PostWithContent, PostWithId } from "./data.types";
import categories from "./content/_categories.json";

const categoriesParsed = z
  .array(
    z.object({
      id: z.string(),
      title: z.string(),
    }),
  )
  .parse(categories);

const frontMatterSchema = z
  .object({
    title: z.string(),
    date: z.string(),
    categories: z.array(z.string()),
  })
  .transform((data) => ({
    ...data,
    categories: data.categories.map(
      (category) =>
        categoriesParsed.find((c) => c.id === category) || {
          id: category,
          title: category,
        },
    ),
  }));

export async function $getBlogPostPaths() {
  const posts = import.meta.glob("/content/*.md");
  return Object.keys(posts).map((path) => ({
    id: path.replace("/content/", "").replace(".md", ""),
  }));
}

export async function $getBlogPosts(
  categoryId?: string,
): Promise<PostWithId[]> {
  const postFiles = import.meta.glob("/content/*.md", { query: "?raw" });
  const postPromises = Object.keys(postFiles).map(async (path) => {
    const markdownString = ((await postFiles[path]()) as any).default;
    const id = path.replace("/content/", "").replace(".md", "");

    const { attributes } = fm(markdownString);
    const metadata = frontMatterSchema.parse(attributes);

    return {
      id,
      ...metadata,
    };
  });

  const posts = await Promise.all(postPromises).then((posts) => {
    if (categoryId) {
      return posts.filter((post) =>
        post.categories.some((category) => category.id === categoryId),
      );
    }
    return posts;
  });
  posts.sort((a, b) => (a.date > b.date ? -1 : 1));
  return posts;
}

export async function $getBlogPost(
  id: string,
): Promise<PostWithContent | null> {
  try {
    const page = await import(/* @vite-ignore */ `/content/${id}.md?raw`);
    const markdownString = page.default;

    const { body: contentRaw, attributes } = fm(markdownString);
    const metadata = frontMatterSchema.parse(attributes);

    const content = await highlightCode(parseMarkdown(contentRaw));
    return { content, contentRaw, ...metadata };
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function $getCategoryPaths() {
  return categoriesParsed.map((category) => ({
    id: category.id,
  }));
}

export function $getCategory(id: string) {
  return categoriesParsed.find((category) => category.id === id) || null;
}

function parseMarkdown(markdown: string) {
  const renderer = new marked.Renderer();
  renderer.code = (code, language) =>
    `<pre><code class="language-${language}">${code}</code></pre>`;
  marked.use({ renderer });
  const tokens = marked.lexer(markdown);
  for (const token of tokens) {
    if (token.type === "code") {
      token.escaped = true;
    }
  }
  return marked.parser(tokens);
}

async function highlightCode(html: string) {
  const highlighter = await getHighlighter({
    themes: ["github-dark"],
    langs: ["javascript", "typescript", "html", "shell", "php"],
  });
  const codeBlockRegex =
    /<pre><code class="language-(.*?)">([\s\S]*?)<\/code><\/pre>/g;
  return html.replace(codeBlockRegex, (_, language, code) =>
    highlighter.codeToHtml(code, {
      lang: language,
      theme: "github-dark",
    }),
  );
}
