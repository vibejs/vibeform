# Validation

Validators are Core validators. VibeForm does not schedule them again.

```ts
import { useField, useForm } from "@usevibejs/form";

const form = useForm({
  defaultValues: { password: "", confirm: "" },
  validators: {
    onChange: ({ value }) =>
      value.password === value.confirm ? undefined : "Passwords must match",
  },
});
const confirm = useField(form, "confirm", {
  validators: {
    onChangeListenTo: ["password"],
    onChangeAsyncDebounceMs: 300,
    onChangeAsync: async ({ value, signal }) => {
      await Promise.resolve();
      if (signal.aborted) return undefined;
      return value ? undefined : "Required";
    },
  },
});
void confirm;
```

`onChange`, `onBlur`, `onSubmit` and `onMount` run at those causes. Async twins accept `onChangeAsyncDebounceMs`. Core aborts the previous async attempt for that cause when a new one starts, and when the field unmounts. `form.reset()` aborts controllers Core has already stored on `fieldInfo`.

Standard Schema validators are passed where Core accepts them. Zod, Valibot and ArkType all expose that interface. The library does not depend on any of them.

```ts
import * as z from "zod";
import { useForm } from "@usevibejs/form";

const form = useForm({
  defaultValues: { email: "" },
  validators: { onChange: z.object({ email: z.email() }) },
});
void form;
```

A failed schema does not replace `form.values` with the parsed output. `onSubmit` receives the raw form value. Parse again there if the submit handler needs the schema output.

`email.messages` is the list of strings taken from string errors and Standard Schema issues. `email.error` is the first message. `form.errors` holds form-level errors. `formErrorMessages` reads a root Standard Schema message from `{ form: { '': ... } }`.

Server errors use the `onServer` channel. Map them explicitly. A problem with no field list becomes one form message.

```ts
import { useForm } from "@usevibejs/form";
import { applyApiResult } from "@usevibejs/form/contract";

const form = useForm({ defaultValues: { email: "" } });
applyApiResult(form, {
  ok: false,
  error: {
    code: "VALIDATION_FAILED",
    title: "Invalid",
    status: 400,
    errors: [{ in: "body", pointer: "/email", message: "Taken" }],
  },
});
```

`pointerToField('/items/0/sku')` is `items[0].sku`. Issues outside the included request parts (`body` by default) stay on the form.
