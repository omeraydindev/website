import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite";
import ssg from "@hono/vite-ssg";

export default defineConfig({
  plugins: [
    devServer({
      entry: "src/index.tsx",
    }),
    ssg(),
  ],
  assetsInclude: "**/*.md",
});
