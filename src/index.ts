export { VibeFormError } from "./errors.ts";
export { useForm, type VibeForm } from "./form.ts";
export { useField, type FieldBindings, type VibeField } from "./field.ts";
export { useFieldArray, type VibeFieldArray } from "./array.ts";
export { useFieldGroup, useFormGroup, type VibeFieldGroup, type VibeFormGroup } from "./group.ts";
export {
  createFormContext,
  useFieldContext,
  useFormContext,
  type VibeFieldContext,
  type VibeFormContext,
} from "./context.ts";
export { errorMessages, formErrorMessages } from "./messages.ts";
export { focusField, focusFirstInvalid } from "./focus.ts";
export {
  controlIds,
  controlProps,
  fieldErrorItems,
  type ControlIds,
  type ControlProps,
} from "./a11y.ts";
export { useStore, type ReadableStore } from "./store.ts";

export {
  FieldApi,
  FieldGroupApi,
  FormApi,
  FormGroupApi,
  formOptions,
  mergeForm,
  standardSchemaValidators,
} from "@tanstack/form-core";

export type {
  AnyFieldApi,
  AnyFieldGroupApi,
  AnyFormApi,
  AnyFormGroupApi,
  DeepKeys,
  DeepKeysOfType,
  DeepValue,
  FieldApiOptions,
  FormAsyncValidateOrFn,
  FormOptions,
  FormState,
  FormValidateOrFn,
  StandardSchemaV1,
  StandardSchemaV1Issue,
  ValidationCause,
  ValidationError,
} from "@tanstack/form-core";
