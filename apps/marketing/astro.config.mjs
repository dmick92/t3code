import { defineConfig } from "astro/config";

export default defineConfig({
  vite: {
    cacheDir: ".astro/vite",
  },
  server: {
    port: Number(process.env.PORT ?? 4173),
  },
});
