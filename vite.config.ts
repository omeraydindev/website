import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite";
import ssg from "@hono/vite-ssg";
import Sitemap from "vite-plugin-sitemap";

export default defineConfig({
  plugins: [
    devServer({
      entry: "src/index.tsx",
    }),
    ssg(),
    Sitemap({
      hostname: "https://omeraydin.dev/",
      exclude: ["/404"],
    }),
  ],
  assetsInclude: "**/*.md",
});
