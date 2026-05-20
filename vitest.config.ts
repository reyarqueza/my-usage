import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "."),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["lib/**/*.ts", "app/actions/**/*.ts", "proxy.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.config.*",
        "**/types/**",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
