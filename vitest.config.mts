import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  // JSX is needed because a couple of suites import components to assert the
  // helpers they export (heading extraction, formatting).
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
});
