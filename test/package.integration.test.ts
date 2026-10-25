import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, onTestFinished } from "vitest";

it("packs and runs in an independent consumer", () => {
  const root = mkdtempSync(join(tmpdir(), "vibeform-pack-"));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const packed = execFileSync("pnpm", ["pack", "--pack-destination", root], {
    encoding: "utf8",
  }).trim();
  const archive = packed.split("\n").at(-1)!;
  expect(existsSync(archive)).toBe(true);
  const manifest = JSON.parse(
    execFileSync("tar", ["-xOf", archive, "package/package.json"], { encoding: "utf8" }),
  ) as {
    name: string;
    dependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    sideEffects: boolean;
  };
  expect(manifest.name).toBe("@usevibejs/form");
  expect(manifest.dependencies["@tanstack/form-core"]).toBe("1.33.5");
  expect(manifest.peerDependencies["@usevibejs/ui"]).toBe("^0.1.0");
  expect(manifest.sideEffects).toBe(false);
  expect(JSON.stringify(manifest)).not.toMatch(/catalog:|workspace:|link:|file:|\/Users\//);
  const files = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" });
  expect(files).toContain("package/dist/index.d.ts");
  expect(files).toContain("package/dist/contract.js");
  expect(files).toContain("package/dist/query.js");
  expect(files).not.toContain("examples/");
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: { "@usevibejs/form": `file:${archive}`, "@usevibejs/ui": "0.1.0" },
    }),
  );
  execFileSync("pnpm", ["install", "--ignore-scripts", "--config.minimumReleaseAge=0"], {
    cwd: root,
    stdio: "pipe",
    timeout: 60000,
  });
  writeFileSync(
    join(root, "run.mjs"),
    `import { effectScope } from '@usevibejs/ui';
import { useField, useForm } from '@usevibejs/form';
const scope = effectScope();
const value = scope.run(() => {
  const form = useForm({ defaultValues: { email: '' } });
  const email = useField(form, 'email');
  email.value = 'ada@example.com';
  return form.getFieldValue('email');
});
if (value !== 'ada@example.com') process.exit(1);
`,
  );
  execFileSync("node", ["run.mjs"], { cwd: root, stdio: "pipe" });
});
