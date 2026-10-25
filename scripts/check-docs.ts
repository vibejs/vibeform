import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve("test/.tmp/docs");
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
const documents = [
  "README.md",
  ...readdirSync("docs")
    .filter((file) => file.endsWith(".md"))
    .map((file) => join("docs", file)),
];
let count = 0;
for (const document of documents) {
  for (const match of readFileSync(document, "utf8").matchAll(
    /```(ts|typescript|vibe)\n([\s\S]*?)```/g,
  )) {
    const extension = match[1] === "vibe" ? "vibe" : "ts";
    writeFileSync(join(root, `Example${++count}.${extension}`), match[2] ?? "");
  }
}
writeFileSync(
  join(root, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      target: "es2022",
      module: "preserve",
      lib: ["es2024", "dom"],
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      paths: {
        "@usevibejs/form": ["../../../dist/index.d.ts"],
        "@usevibejs/form/contract": ["../../../dist/contract.d.ts"],
        "@usevibejs/form/query": ["../../../dist/query.d.ts"],
      },
    },
    contentMappers: [{ package: "@usevibejs/language-tools", extensions: [".vibe"] }],
    include: ["*.ts", "*.vibe"],
  }),
);
if (count === 0) throw new Error("Documentation has no type-checked examples.");
execFileSync(
  "pnpm",
  [
    "--dir",
    "examples/gallery",
    "exec",
    "tsc",
    "-b",
    join(root, "tsconfig.json"),
    "--runExternalCode",
  ],
  { stdio: "inherit" },
);
process.stdout.write(`Type-checked ${count} documentation examples.\n`);
