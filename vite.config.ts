import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work on GitHub Pages and static hosts without extra config.
export default defineConfig({
  plugins: [react()],
  base: "./",
});

