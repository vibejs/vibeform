import {
  computed,
  markRaw,
  onScopeDispose,
  reactive,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "@usevibejs/ui";
import {
  FieldGroupApi,
  FormGroupApi,
  type AnyFieldGroupApi,
  type AnyFormApi,
  type AnyFormGroupApi,
  type DeepKeys,
  type DeepValue,
  type FormApi,
  type FormAsyncValidateOrFn,
  type FormValidateOrFn,
} from "@tanstack/form-core";
import {
  formKey,
  groupKey,
  injectIfCurrent,
  provideIfCurrent,
  type VibeFormContext,
} from "./context.ts";
import { VibeFormError } from "./errors.ts";
import { errorMessages } from "./messages.ts";
import { assertScope } from "./scope.ts";
import { useStoreSlices } from "./store.ts";

export interface VibeFieldGroup<TData = unknown> {
  readonly api: AnyFieldGroupApi;
  readonly values: TData;
}

/**
 * Prefixes descendant `useField({ name })` calls with a nested path.
 * `useFieldGroup(form, 'address')` makes a child field named `city` register as `address.city`.
 * A child that passes its own `form` keeps that absolute path.
 */
export function useFieldGroup<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta,
>(
  form: FormApi<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  >,
  fields: TName,
): VibeFieldGroup<DeepValue<TFormData, TName>>;
export function useFieldGroup(form: AnyFormApi, fields: string): VibeFieldGroup {
  assertScope("useFieldGroup");
  const parent = injectIfCurrent(groupKey);
  const resolvedForm = form;
  const group = new FieldGroupApi({
    form: (parent ?? resolvedForm) as never,
    fields: fields as never,
  });
  provideIfCurrent(groupKey, group as unknown as AnyFieldGroupApi);
  const selected = useStoreSlices(group.store, {
    values: (state: { values: unknown }) => state.values,
  });
  return {
    api: markRaw(group) as unknown as AnyFieldGroupApi,
    get values() {
      return selected.values.value;
    },
  };
}

export interface VibeFormGroup<TData> {
  readonly api: AnyFormGroupApi;
  value: TData;
  readonly errors: readonly unknown[];
  readonly messages: readonly string[];
  readonly error: string | undefined;
  readonly invalid: boolean;
  readonly isTouched: boolean;
  readonly isDirty: boolean;
  readonly isValidating: boolean;
  handleChange(value: TData): void;
  handleBlur(): void;
}

/**
 * Mounts a Core form group and prefixes descendant fields with its name.
 * Validators, async work and error distribution stay in Core.
 */
export function useFormGroup<TFormData, TName extends DeepKeys<TFormData>>(
  options: MaybeRefOrGetter<{
    form?: AnyFormApi;
    name: TName;
    defaultValue?: DeepValue<TFormData, TName>;
    validators?: object;
    listeners?: object;
  }>,
): VibeFormGroup<DeepValue<TFormData, TName>> {
  assertScope("useFormGroup");
  const parent = injectIfCurrent(groupKey);
  const contextForm = injectIfCurrent(formKey);
  const read = () => {
    const resolved = toValue(options);
    const form = resolved.form ?? parent?.form ?? contextForm;
    if (!form)
      throw new VibeFormError("useFormGroup() requires a form from its options or from useForm().");
    const name =
      parent && !resolved.form
        ? parent.getFormFieldName(resolved.name as never)
        : String(resolved.name);
    return { ...resolved, form, name };
  };
  const initial = read();
  const group = new FormGroupApi({ ...initial } as never);
  let stop = group.mount();
  onScopeDispose(() => stop());
  watch(
    read,
    (next) => {
      const previous = String(group.name);
      if (next.name !== previous) {
        stop();
        group.update(next as never);
        stop = group.mount();
      } else group.update(next as never);
    },
    { flush: "sync" },
  );
  const prefix = new FieldGroupApi({
    form: (parent ?? initial.form) as never,
    fields: String(toValue(options).name) as never,
  });
  provideIfCurrent(groupKey, prefix as unknown as AnyFieldGroupApi);
  const selected = useStoreSlices(group.store, {
    value: (state: { value: unknown }) => state.value,
    errors: (state: { meta: { errors: readonly unknown[] } }) => state.meta.errors,
    isTouched: (state: { meta: { isTouched: boolean } }) => state.meta.isTouched,
    isDirty: (state: { meta: { isDirty: boolean } }) => state.meta.isDirty,
    isValidating: (state: { meta: { isValidating: boolean } }) => state.meta.isValidating,
  });
  const value = computed({
    get: () => selected.value.value,
    set(next) {
      group.setValue(next as never);
    },
  });
  return reactive({
    api: markRaw(group),
    value,
    errors: selected.errors,
    isTouched: selected.isTouched,
    isDirty: selected.isDirty,
    isValidating: selected.isValidating,
    get messages() {
      return errorMessages(selected.errors.value);
    },
    get error() {
      return this.messages[0];
    },
    get invalid() {
      return selected.errors.value.length > 0;
    },
    handleChange(next: unknown) {
      group.setValue(next as never);
    },
    handleBlur() {
      const previous = group.getMeta();
      group.setMeta(() => ({ ...previous, isTouched: true, isBlurred: true }));
      void group.validate("blur");
    },
  }) as unknown as VibeFormGroup<DeepValue<TFormData, TName>>;
}

export type { VibeFormContext };
