# Accessibility

Use a real `<form>` and `form.submit` so Enter submits and the native navigation is prevented. Associate each control with a `<label for>` or wrap it in the label. `controlIds` and `controlProps` build stable ids and the `aria-invalid`, `aria-describedby` and `aria-required` attributes.

```ts
import { controlIds, controlProps, focusFirstInvalid } from "@usevibejs/form";

const ids = controlIds("email");
const props = controlProps({ name: "email", invalid: true }, ids, {
  required: true,
  described: true,
});
void props;
void focusFirstInvalid;
```

Pass `described: true` only when the description element is rendered. Point `aria-describedby` at the error id while the field is invalid. Give the error `role="alert"` or render Vibecn `FieldError`, which already uses that role. Do not add ARIA that repeats a native `<label>`, `<form>` or `<button>`.

After a failed submit, call `focusFirstInvalid(formElement)` or `focusField(name, formElement)`. Both return false when there is nothing to focus. Disabled controls use the native `disabled` attribute. `form.isSubmitting` is the flag for the submit button.
