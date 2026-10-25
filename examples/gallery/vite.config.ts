import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { vibe } from "@usevibejs/compiler/vite";
import { defineConfig } from "vite";

const registry = fileURLToPath(new URL("../../../vibecn/registry", import.meta.url));

export default defineConfig({
  plugins: [vibe(), tailwindcss()],
  resolve: {
    alias: {
      "@vibecn": `${registry}/ui`,
      __VIBECN_UTILS__: `${registry}/lib/utils.ts`,
      __VIBECN_LIB__: `${registry}/lib`,
    },
  },
  build: { target: "es2022" },
});
