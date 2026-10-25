import { performance } from "node:perf_hooks";
import { effectScope } from "@usevibejs/ui";
import { useField, useFieldArray, useForm } from "../dist/index.js";

function fields(count) {
  return Object.fromEntries(Array.from({ length: count }, (_, index) => [`field${index}`, ""]));
}

async function measure(label, run) {
  const started = performance.now();
  const value = await run();
  const elapsed = performance.now() - started;
  process.stdout.write(`${label}: ${elapsed.toFixed(2)}ms\n`);
  return value;
}

function mount(count) {
  const scope = effectScope();
  const form = scope.run(() => {
    const created = useForm({ defaultValues: fields(count) });
    for (let index = 0; index < count; index += 1) useField(created, `field${index}`);
    return created;
  });
  return { scope, form };
}

for (const count of [10, 100, 500]) {
  const mounted = await measure(`mount ${count} fields`, () => mount(count));
  await measure(`update one of ${count}`, () => {
    mounted.form.setFieldValue("field0", "next");
  });
  mounted.scope.stop();
}

const arrayScope = effectScope();
const arrayForm = arrayScope.run(() => {
  const form = useForm({
    defaultValues: { lines: Array.from({ length: 200 }, (_, index) => ({ sku: `s${index}` })) },
  });
  useFieldArray(form, "lines");
  return form;
});
await measure("push 200 array items", async () => {
  for (let index = 0; index < 200; index += 1)
    await arrayForm.pushFieldValue("lines", { sku: `n${index}` });
});
arrayScope.stop();

let conditional = 0;
const cycle = effectScope();
cycle.run(() => {
  const form = useForm({ defaultValues: { note: "" } });
  for (let index = 0; index < 100; index += 1) {
    const child = effectScope();
    child.run(() => useField(form, "note"));
    child.stop();
    conditional += 1;
  }
});
cycle.stop();
process.stdout.write(`conditional mount cycles: ${conditional}\n`);
