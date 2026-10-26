import { fileURLToPath } from "node:url";
import { vibe } from "@usevibejs/compiler/vite";
import { defineConfig } from "vitest/config";

const registry = fileURLToPath(
  new URL("./node_modules/@usevibejs/vibecn/registry", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      "@vibecn": `${registry}/ui`,
      __VIBECN_UTILS__: `${registry}/lib/utils.ts`,
      __VIBECN_LIB__: `${registry}/lib`,
    },
  },
  test: {
    projects: [
      { test: { name: "unit", environment: "node", include: ["src/**/*.test.ts"] } },
      {
        plugins: [vibe()],
        test: { name: "components", environment: "jsdom", include: ["test/*.vibe.test.ts"] },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["test/*.integration.test.ts"],
          testTimeout: 120000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.test-d.ts"],
      thresholds: { 100: true, perFile: true },
    },
  },
});
