import { effectScope } from "@usevibejs/ui";
import { type } from "arktype";
import { describe, expect, it } from "vitest";
import * as v from "valibot";
import * as z from "zod";
import { useField } from "./field.ts";
import { useForm } from "./form.ts";

function run<T>(fn: () => T): { value: T; stop(): void } {
  const scope = effectScope();
  const value = scope.run(fn);
  if (value === undefined) throw new Error("scope produced no value");
  return { value, stop: () => scope.stop() };
}

const zodUser = z.object({
  email: z.email(),
  age: z.number().min(18),
});
const valibotUser = v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.minValue(18)),
});
const arkUser = type({ email: "string.email", age: "number>=18" });

describe("standard schema and async validation", () => {
  it.each([
    ["zod", zodUser],
    ["valibot", valibotUser],
    ["arktype", arkUser],
  ] as const)("maps %s issues onto fields and keeps raw values", async (library, schema) => {
    const session = run(() => {
      const form = useForm({
        defaultValues: { email: "", age: 17 },
        validators: { onChange: schema as never },
      });
      const email = useField(form, "email");
      const age = useField(form, "age");
      return { form, email, age };
    });
    session.value.email.value = "not-an-email";
    session.value.age.value = 17;
    await session.value.form.validate("change");
    expect(session.value.email.invalid || session.value.form.isValid === false).toBe(true);
    expect(session.value.form.state.values).toEqual({ email: "not-an-email", age: 17 });
    session.value.email.value = "ada@example.com";
    session.value.age.value = 21;
    await session.value.form.validate("change");
    expect(session.value.form.isValid).toBe(true);
    expect(library).toBeTruthy();
    session.stop();
  });

  it("checks a sibling field and drops a stale async result", async () => {
    const pending: ((value: string | undefined) => void)[] = [];
    const session = run(() => {
      const form = useForm({
        defaultValues: { password: "secret", confirm: "" },
      });
      const confirm = useField(form, "confirm", {
        validators: {
          onChange: (({
            value,
            fieldApi,
          }: {
            value: string;
            fieldApi: { form: { getFieldValue(name: "password"): string } };
          }) =>
            value === fieldApi.form.getFieldValue("password")
              ? undefined
              : "Passwords must match") as never,
          onChangeAsyncDebounceMs: 20,
          onChangeAsync: ({ value, signal }: { value: string; signal: AbortSignal }) =>
            new Promise((resolve) => {
              pending.push((result) => {
                if (signal.aborted) resolve(undefined);
                else resolve(result ?? (value === "secret" ? undefined : `stale ${value}`));
              });
            }),
        },
      });
      return { form, confirm };
    });
    session.value.confirm.value = "nope";
    expect(session.value.confirm.error).toBe("Passwords must match");
    session.value.confirm.value = "secret";
    expect(session.value.confirm.invalid).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(pending.length).toBeGreaterThan(0);
    const first = pending[0]!;
    const last = pending.at(-1)!;
    session.value.form.reset();
    first("stale nope");
    last(undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(session.value.confirm.error).not.toBe("stale nope");
    session.stop();
  });
});
