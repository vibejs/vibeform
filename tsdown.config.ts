import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/contract.ts", "src/query.ts"],
  format: "esm",
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  platform: "browser",
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: { neverBundle: ["@usevibejs/ui", "@tanstack/form-core", "@tanstack/store"] },
});
