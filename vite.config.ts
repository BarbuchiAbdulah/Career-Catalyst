import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work on GitHub Pages and static hosts without extra config.
// defineConfig comes from vitest/config (a superset of vite's) so `test` below is typed.
export default defineConfig({
  plugins: [react()],
  base: "./",
  test: { environment: "node" },
});

