import { effectScope, nextTick, ref, shallowRef } from "@usevibejs/ui";
import { describe, expect, it } from "vitest";
import { VibeFormError } from "./errors.ts";
import { abortFieldValidations, useForm } from "./form.ts";
import { useField, type VibeField } from "./field.ts";
import { useFieldArray } from "./array.ts";
import { useFieldGroup, useFormGroup } from "./group.ts";
import { createFormContext, useFieldContext, useFormContext } from "./context.ts";
import { errorMessages, formErrorMessages } from "./messages.ts";
import { focusField, focusFirstInvalid } from "./focus.ts";
import { controlIds, controlProps, fieldErrorItems } from "./a11y.ts";
import { useStore } from "./store.ts";
import { createFormId, assertScope } from "./scope.ts";
import {
  applyApiResult,
  applyServerErrors,
  clearServerErrors,
  mapContractProblem,
  pointerToField,
} from "./contract.ts";
import { syncFormValues } from "./query.ts";
import { formOptions } from "./index.ts";

function run<T>(fn: () => T): { value: T; stop(): void } {
  const scope = effectScope();
  const value = scope.run(fn);
  if (value === undefined) throw new Error("scope produced no value");
  return { value, stop: () => scope.stop() };
}

describe("scope and store", () => {
  it("requires an active scope and mints ids", () => {
    expect(() => assertScope("useForm")).toThrow(VibeFormError);
    expect(() => useStore({ state: 1, subscribe: () => ({ unsubscribe() {} }) })).toThrow(
      VibeFormError,
    );
    expect(createFormId()).not.toBe(createFormId());
  });

  it("keeps selector subscriptions narrow and drops them on dispose", () => {
    const scope = effectScope();
    let current = { value: 1, other: "a" };
    const listeners = new Set<() => void>();
    const store = {
      get state() {
        return current;
      },
      subscribe(listener: () => void) {
        listeners.add(listener);
        return { unsubscribe: () => listeners.delete(listener) };
      },
    };
    const selected = scope.run(() => useStore(store, (state) => state.value))!;
    const whole = scope.run(() => useStore(store))!;
    expect(whole.value.value).toBe(1);
    expect(selected.value).toBe(1);
    current = { value: 1, other: "b" };
    for (const listener of listeners) listener();
    expect(selected.value).toBe(1);
    current = { value: 2, other: "b" };
    for (const listener of listeners) listener();
    expect(selected.value).toBe(2);
    scope.stop();
    current = { value: 3, other: "c" };
    for (const listener of listeners) listener();
    expect(selected.value).toBe(2);
    expect(listeners.size).toBe(0);
  });
});

describe("useForm", () => {
  it("tracks values, submission and reset without a full-form reader", async () => {
    let release = (): void => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const calls: string[] = [];
    const defaults = ref({ name: "Ada" });
    const session = run(() => {
      const form = useForm(() => ({
        defaultValues: defaults.value,
        onSubmit: ({ value }) => {
          calls.push(value.name);
          return pending;
        },
      }));
      const name = useField(form, "name");
      const attempts = form.useStore((state) => state.submissionAttempts);
      return { form, name, attempts };
    });
    const { form, name, attempts } = session.value;
    expect(form.values).toEqual({ name: "Ada" });
    expect(name.value).toBe("Ada");
    expect(name.meta.isPristine).toBe(true);
    name.value = "Grace";
    expect(form.getFieldValue("name")).toBe("Grace");
    expect(name.isDirty).toBe(true);
    name.handleBlur();
    expect(name.isTouched).toBe(true);
    expect(name.isBlurred).toBe(true);
    defaults.value = { name: "Ignored" };
    await nextTick();
    expect(form.getFieldValue("name")).toBe("Grace");
    const event = { preventDefault: () => calls.push("prevent") };
    const first = form.submit(event);
    expect(calls).toContain("prevent");
    expect(form.isSubmitting).toBe(true);
    expect(form.submissionAttempts).toBe(1);
    await form.submit();
    expect(form.submissionAttempts).toBe(1);
    expect(attempts.value).toBe(1);
    release();
    await first;
    expect(form.isSubmitSuccessful).toBe(true);
    expect(form.isSubmitted).toBe(true);
    form.reset();
    expect(form.getFieldValue("name")).toBe("Ignored");
    expect(name.isDirty).toBe(false);
    session.stop();
    name.value = "After";
    expect(name.value).toBe("Ignored");
  });

  it("adopts defaults while pristine and keeps a supplied id", async () => {
    const defaults = shallowRef({ count: 1 });
    const session = run(() =>
      useForm({ formId: "profile", defaultValues: defaults as unknown as { count: number } }),
    );
    expect(session.value.options.formId).toBe("profile");
    defaults.value = { count: 2 };
    await nextTick();
    expect(session.value.getFieldValue("count")).toBe(2);
    session.value.setFieldValue("count", 3);
    session.value.reset({ count: 9 }, { keepDefaultValues: true });
    expect(session.value.options.defaultValues).toEqual({ count: 2 });
    expect(session.value.getFieldValue("count")).toBe(9);
    session.stop();
  });

  it("aborts controllers Core has already created", () => {
    const controller = new AbortController();
    const session = run(() => {
      const form = useForm({ defaultValues: { name: "" } });
      useField(form, "name");
      return form;
    });
    session.value.fieldInfo.name!.validationMetaMap.onChange = { lastAbortController: controller };
    session.value.reset();
    expect(controller.signal.aborted).toBe(true);
    abortFieldValidations({ fieldInfo: { gone: undefined } });
    session.stop();
  });

  it("creates an empty form and ignores a non-object options source", () => {
    const session = run(() => {
      const form = useForm();
      const valid = form.useSelector((state) => state.isValid);
      return { form, valid };
    });
    expect(session.value.form.state.canSubmit).toBe(true);
    expect(session.value.valid.value).toBe(true);
    void session.value.form.submit();
    session.stop();
    const odd = run(() => useForm(1 as never));
    expect(odd.value.state.isValid).toBe(true);
    odd.stop();
  });
});

describe("fields, arrays and groups", () => {
  it("validates, renames and preserves conditional values", async () => {
    const label = ref("title");
    const session = run(() => {
      const form = useForm({
        defaultValues: { title: "", subtitle: "kept", items: [{ sku: "a" }] },
        validators: {
          onChange: ({ value }) => (value.title === "bad" ? "Title is reserved" : undefined),
        },
      });
      const title = useField(() => ({
        form,
        name: label.value as "title",
        validators: {
          onChange: ({ value }: { value: string }) => (value.length < 2 ? "Too short" : undefined),
        },
      })) as VibeField<string>;
      const items = useFieldArray(form, "items");
      return { form, title, items };
    });
    session.value.title.value = "a";
    expect(session.value.title.invalid).toBe(true);
    expect(session.value.title.error).toBe("Too short");
    expect(session.value.title.messages).toEqual(["Too short"]);
    session.value.title.value = "bad";
    expect(session.value.form.isValid).toBe(false);
    session.value.title.setValue("Name");
    expect(session.value.title.isPristine).toBe(false);
    session.value.title.handleChange("Name");
    expect(session.value.title.isValid).toBe(true);
    label.value = "subtitle";
    await nextTick();
    expect(session.value.title.value).toBe("kept");
    expect(session.value.form.getFieldValue("title")).toBe("Name");
    await session.value.items.push({ sku: "b" });
    expect(session.value.items.items).toEqual([{ sku: "a" }, { sku: "b" }]);
    await session.value.items.swap(0, 1);
    await session.value.items.move(1, 0);
    await session.value.items.insert(1, { sku: "c" });
    await session.value.items.replace(1, { sku: "d" });
    await session.value.items.remove(1);
    expect(session.value.items.field.value.map((item) => item.sku)).toEqual(["a", "b"]);
    session.stop();
    expect(session.value.form.getFieldValue("subtitle")).toBe("kept");
  });

  it("prefixes nested fields and validates a form group", async () => {
    const name = ref("address");
    const session = run(() => {
      const form = useForm({
        defaultValues: { address: { city: "" }, note: "" },
      });
      const nested = useFieldGroup(form, "address");
      const group = useFormGroup(() => ({
        form,
        name: name.value as "address",
        validators: {
          onChange: ({ value }: { value: { city: string } }) =>
            value.city === "" ? "City is required" : undefined,
        },
      }));
      const city = useField({ form, name: "address.city" });
      return { form, nested, group, city };
    });
    expect(session.value.nested.values).toEqual({ city: "" });
    session.value.group.value = { city: "Lyon" };
    expect(session.value.group.value).toEqual({ city: "Lyon" });
    session.value.group.handleChange({ city: "" });
    expect(session.value.group.invalid).toBe(true);
    expect(session.value.group.error).toBe("City is required");
    session.value.city.value = "Paris";
    session.value.group.handleBlur();
    expect(session.value.group.isTouched).toBe(true);
    name.value = "note";
    await nextTick();
    session.value.form.setFieldValue("address.city", "Lyon");
    expect(session.value.nested.values).toEqual({ city: "Lyon" });
    session.stop();
  });

  it("refreshes validators without remounting when the field name stays the same", async () => {
    const limit = ref(4);
    const strict = ref(true);
    const fallback = ref("kept");
    const session = run(() => {
      const form = useForm({ defaultValues: { name: "", address: { city: "Paris" } } });
      const name = useField(() => {
        void limit.value;
        return {
          form,
          name: "name" as const,
          defaultValue: fallback,
          validators: {
            onChange: ({ value }: { value: string }) =>
              value.length < limit.value ? "short" : undefined,
          },
        };
      }) as VibeField<string>;
      const group = useFormGroup(() => {
        void strict.value;
        return {
          form,
          name: "address" as const,
          validators: { onChange: () => (strict.value ? "no" : undefined) },
        };
      });
      return { name, group };
    });
    limit.value = 1;
    strict.value = false;
    await nextTick();
    session.value.name.value = "ab";
    expect(session.value.name.error).toBeUndefined();
    session.value.group.handleChange({ city: "Paris" });
    expect(session.value.group.invalid).toBe(false);
    session.stop();
  });

  it("requires a form for loose field and group calls", () => {
    const session = run(() => ({
      field: () => useField({ name: "name" }),
      group: () => useFormGroup({ name: "name" }),
    }));
    expect(session.value.field).toThrow(VibeFormError);
    expect(session.value.group).toThrow(VibeFormError);
    session.stop();
  });
});

describe("context helpers", () => {
  it("throws outside a provider and returns a provided form from its own pair", () => {
    expect(() => useFormContext()).toThrow(VibeFormError);
    expect(() => useFieldContext()).toThrow(VibeFormError);
    const context = createFormContext<{ id: number }>();
    expect(() => context.use()).toThrow(VibeFormError);
    const session = run(() => {
      const form = useForm(formOptions({ defaultValues: { id: 1 } }));
      context.provide({ id: form.getFieldValue("id") });
      return form.getFieldValue("id");
    });
    expect(session.value).toBe(1);
    session.stop();
  });
});

describe("messages, focus and controls", () => {
  it("normalizes errors", () => {
    expect(errorMessages("")).toEqual([]);
    expect(errorMessages("Need a name")).toEqual(["Need a name"]);
    expect(errorMessages(["A", { message: "B" }, ["A", { message: "" }], 1])).toEqual(["A", "B"]);
    expect(errorMessages({ form: { "": "Root" } })).toEqual([]);
    expect(
      formErrorMessages([{ form: { "": "Root", email: [{ message: "Bad" }] } }, "Also"]),
    ).toEqual(["Root", "Also"]);
    expect(formErrorMessages([{ form: [] }, { message: "Plain" }])).toEqual(["Plain"]);
    expect(formErrorMessages([{ form: {} }])).toEqual([]);
  });

  it("focuses invalid and named controls when it can", () => {
    expect(focusFirstInvalid()).toBe(false);
    expect(focusField("name")).toBe(false);
    const plain = { querySelector: () => null };
    expect(focusFirstInvalid(plain as unknown as ParentNode)).toBe(false);
    expect(focusField('a"b', plain as unknown as ParentNode)).toBe(false);
    expect(focusField("name", plain as unknown as ParentNode)).toBe(false);
    const lifeless = { focus: undefined };
    const holder = { querySelector: () => lifeless };
    expect(focusFirstInvalid(holder as unknown as ParentNode)).toBe(false);
    let focused = 0;
    const live = { focus: () => focused++ };
    const found = { querySelector: () => live };
    expect(focusFirstInvalid(found as unknown as ParentNode)).toBe(true);
    expect(focusField("email", found as unknown as ParentNode)).toBe(true);
    expect(focused).toBe(2);
  });

  it("builds described, invalid and required control props", () => {
    const ids = controlIds("email");
    expect(ids.input).toBe("email-input");
    expect(controlProps({ name: "email", invalid: false }, ids)).toEqual({
      id: "email-input",
      name: "email",
      "aria-invalid": undefined,
      "aria-describedby": undefined,
      "aria-required": undefined,
    });
    expect(
      controlProps({ name: "email", invalid: true }, ids, { required: true, described: true }),
    ).toEqual({
      id: "email-input",
      name: "email",
      "aria-invalid": true,
      "aria-describedby": "email-description email-error",
      "aria-required": true,
    });
    expect(fieldErrorItems(["Too short"])).toEqual([{ message: "Too short" }]);
  });
});

describe("server and query integration", () => {
  it("maps contract problems and writes them onto the form", () => {
    expect(pointerToField("email")).toBeUndefined();
    expect(pointerToField("/")).toBeUndefined();
    expect(pointerToField("/items/0/sku")).toBe("items[0].sku");
    expect(pointerToField("/a~1b/~0c")).toBe("a/b.~c");
    const form = {
      errorMap: {} as Record<string, unknown>,
      fields: {} as Record<string, unknown>,
      setErrorMap(map: { onServer?: string }) {
        this.errorMap = map;
      },
      setFieldMeta(
        field: string,
        updater: (previous: { errorMap?: Record<string, unknown> } | undefined) => {
          errorMap?: Record<string, unknown>;
        },
      ) {
        this.fields[field] = updater(
          this.fields[field] as { errorMap?: Record<string, unknown> } | undefined,
        );
      },
      state: { fieldMeta: { email: {}, note: {} } },
    };
    const empty = mapContractProblem({ code: "NOT_FOUND", title: "Missing", status: 404 });
    expect(empty.form).toBe("Missing");
    expect(mapContractProblem({ code: "X", title: "T", status: 400, detail: "D" }).form).toBe("D");
    const onlyField = mapContractProblem({
      code: "VALIDATION_FAILED",
      title: "Invalid",
      status: 400,
      errors: [{ in: "body", pointer: "/note", message: "Required" }],
    });
    expect(onlyField.form).toBeUndefined();
    applyServerErrors(form, onlyField);
    applyServerErrors(form, onlyField);
    const mapped = mapContractProblem(
      {
        code: "VALIDATION_FAILED",
        title: "Invalid",
        status: 400,
        detail: "Fix the form",
        errors: [
          { in: "body", pointer: "/email", message: "Taken" },
          { in: "body", pointer: "/email", message: "Taken again" },
          { in: "query", pointer: "/q", message: "Bad query" },
          { in: "headers", pointer: "/auth", message: "" },
          { in: "body", pointer: "/", message: "Empty" },
        ],
      },
      { include: ["body", "query"] },
    );
    const ignored = mapContractProblem({
      code: "VALIDATION_FAILED",
      title: "Invalid",
      status: 400,
      errors: [{ in: "query", pointer: "/q", message: "" }],
    });
    expect(ignored.fields).toEqual({});
    expect(ignored.form).toBe("Invalid");
    applyServerErrors(form, mapped);
    expect(form.errorMap.onServer).toContain("Empty");
    expect(form.fields.q).toMatchObject({ errorMap: { onServer: "Bad query" } });
    expect(form.fields.email).toMatchObject({ errorMap: { onServer: ["Taken", "Taken again"] } });
    const result = applyApiResult(form, {
      ok: false as const,
      error: { code: "BAD_REQUEST", title: "No", status: 400, detail: "Stopped" },
    });
    expect(result.ok).toBe(false);
    const success = applyApiResult(form, { ok: true as const, data: { id: 1 } });
    expect(success.ok && success.data.id).toBe(1);
    clearServerErrors(form, ["email"]);
    expect(form.errorMap.onServer).toBeUndefined();
    clearServerErrors(form);
    expect(form.fields.note).toMatchObject({ errorMap: { onServer: undefined } });
  });

  it("preserves dirty values during a pristine sync", () => {
    const state = { isDirty: false, values: { name: "old" } };
    const form = {
      state,
      reset(values?: { name: string }) {
        state.values = values ?? { name: "" };
        state.isDirty = false;
      },
    };
    expect(syncFormValues(form, undefined)).toBe(false);
    expect(syncFormValues(form, { name: "Ada" })).toBe(true);
    expect(form.state.values.name).toBe("Ada");
    form.state.isDirty = true;
    expect(syncFormValues(form, { name: "Grace" })).toBe(false);
    expect(form.state.values.name).toBe("Ada");
    expect(syncFormValues(form, { name: "Grace" }, "always")).toBe(true);
    expect(form.state.values.name).toBe("Grace");
  });
});
