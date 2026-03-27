import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@gaialynk/shared": path.resolve(__dirname, "packages/shared/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: [
      "packages/server/tests/**/*.test.ts",
      "packages/connector/tests/**/*.test.ts",
    ],
  },
});
