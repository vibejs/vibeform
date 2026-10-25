import {
  computed,
  isRef,
  markRaw,
  onScopeDispose,
  reactive,
  shallowRef,
  toValue,
  watch,
  type MaybeRef,
  type MaybeRefOrGetter,
} from "@usevibejs/ui";
import {
  FieldApi,
  type AnyFieldApi,
  type AnyFieldGroupApi,
  type AnyFormApi,
  type DeepKeys,
  type DeepValue,
  type FieldAsyncValidateOrFn,
  type FieldValidateOrFn,
  type FormApi,
  type FormAsyncValidateOrFn,
  type FormValidateOrFn,
} from "@tanstack/form-core";
import {
  fieldKey,
  formKey,
  groupKey,
  injectIfCurrent,
  provideIfCurrent,
  type VibeFieldContext,
} from "./context.ts";
import { VibeFormError } from "./errors.ts";
import { errorMessages } from "./messages.ts";
import { assertScope } from "./scope.ts";
import { useStoreSlices } from "./store.ts";

export interface VibeField<TData, TApi extends AnyFieldApi = AnyFieldApi> extends VibeFieldContext {
  readonly api: TApi;
  readonly name: string;
  value: TData;
  readonly errors: readonly unknown[];
  readonly messages: readonly string[];
  readonly error: string | undefined;
  readonly invalid: boolean;
  readonly isTouched: boolean;
  readonly isDirty: boolean;
  readonly isBlurred: boolean;
  readonly isPristine: boolean;
  readonly isValid: boolean;
  readonly isValidating: boolean;
  readonly errorMap: unknown;
  readonly meta: {
    readonly isTouched: boolean;
    readonly isDirty: boolean;
    readonly isBlurred: boolean;
    readonly isPristine: boolean;
    readonly isValid: boolean;
    readonly isValidating: boolean;
    readonly errors: readonly unknown[];
    readonly errorMap: unknown;
  };
  handleBlur(): void;
  handleChange(value: TData): void;
  setValue(updater: TData | ((previous: TData) => TData)): void;
}

interface FieldSource {
  form?: AnyFormApi;
  name: string;
  mode?: "value" | "array";
  defaultValue?: unknown;
  validators?: object;
  listeners?: object;
}

export interface FieldBindings<TData> {
  mode?: "value" | "array";
  defaultValue?: MaybeRef<TData>;
  validators?: {
    onMount?: FieldValidateOrFn<unknown, string, TData>;
    onChange?: FieldValidateOrFn<unknown, string, TData>;
    onChangeAsync?: FieldAsyncValidateOrFn<unknown, string, TData>;
    onChangeAsyncDebounceMs?: number;
    onBlur?: FieldValidateOrFn<unknown, string, TData>;
    onBlurAsync?: FieldAsyncValidateOrFn<unknown, string, TData>;
    onBlurAsyncDebounceMs?: number;
    onSubmit?: FieldValidateOrFn<unknown, string, TData>;
    onSubmitAsync?: FieldAsyncValidateOrFn<unknown, string, TData>;
    onChangeListenTo?: readonly string[];
    onBlurListenTo?: readonly string[];
  };
  listeners?: {
    onChange?: (props: { value: TData }) => void;
    onBlur?: (props: { value: TData }) => void;
    onMount?: (props: { value: TData }) => void;
  };
}

type FormOf<
  TFormData,
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
> = FormApi<
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
>;

export function useField<
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
  form: FormOf<
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
  name: TName,
  options?: FieldBindings<DeepValue<TFormData, TName>>,
): VibeField<DeepValue<TFormData, TName>>;
export function useField<
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
  options: MaybeRefOrGetter<
    {
      form?: FormOf<
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
      >;
      name: TName;
    } & FieldBindings<DeepValue<TFormData, TName>>
  >,
): VibeField<DeepValue<TFormData, TName>>;
export function useField(
  options: MaybeRefOrGetter<{ name: string; form?: object }>,
): VibeField<unknown>;
/** Mounts one field. Bind `v-model` to `field.value` and `@blur` to `field.handleBlur`. */
// Field values are invariant, so the implementation return cannot name every overload's value type.
// oxlint-disable-next-line typescript/no-explicit-any
export function useField(formOrOptions: object, name?: string, extra?: object): any {
  assertScope("useField");
  const group = injectIfCurrent(groupKey);
  const contextForm = injectIfCurrent(formKey);
  const source: MaybeRefOrGetter<FieldSource> =
    typeof name === "string"
      ? { ...(extra as FieldSource | undefined), form: formOrOptions as AnyFormApi, name }
      : (formOrOptions as MaybeRefOrGetter<FieldSource>);
  const read = (): FieldSource & { form: AnyFormApi; name: string } => {
    const options = toValue(source);
    const form = options.form ?? group?.form ?? contextForm;
    if (!form)
      throw new VibeFormError("useField() requires a form from its argument or from useForm().");
    const fieldName =
      options.form || !group ? String(options.name) : prefixed(group, String(options.name));
    return { ...options, form, name: fieldName };
  };
  const initial = read();
  const mode = initial.mode ?? "value";
  const fieldApi = new FieldApi(coreOptions(initial));
  let stop = fieldApi.mount();
  onScopeDispose(() => stop());
  const nameRef = shallowRef(initial.name);
  watch(
    read,
    (next) => {
      const previous = fieldApi.name;
      if (next.name !== previous) {
        stop();
        fieldApi.update(coreOptions(next));
        stop = fieldApi.mount();
      } else {
        fieldApi.update(coreOptions(next));
      }
      nameRef.value = next.name;
    },
    { flush: "sync" },
  );
  const selected = useStoreSlices(fieldApi.store, fieldSlices);
  const value = computed<unknown>({
    get() {
      if (mode === "array") {
        void selected.arrayVersion.value;
        return fieldApi.state.value;
      }
      return selected.value.value;
    },
    set(next) {
      fieldApi.handleChange(next as never);
    },
  });
  const field = reactive({
    api: markRaw(fieldApi),
    name: nameRef,
    value,
    errors: selected.errors,
    errorMap: selected.errorMap,
    isTouched: selected.isTouched,
    isDirty: selected.isDirty,
    isBlurred: selected.isBlurred,
    isValid: selected.isValid,
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
    get isPristine() {
      return !selected.isDirty.value;
    },
    get meta() {
      return {
        isTouched: selected.isTouched.value,
        isDirty: selected.isDirty.value,
        isBlurred: selected.isBlurred.value,
        isPristine: !selected.isDirty.value,
        isValid: selected.isValid.value,
        isValidating: selected.isValidating.value,
        errors: selected.errors.value,
        errorMap: selected.errorMap.value,
      };
    },
    handleBlur() {
      fieldApi.handleBlur();
    },
    handleChange(next: unknown) {
      fieldApi.handleChange(next as never);
    },
    setValue(updater: unknown) {
      fieldApi.setValue(updater as never);
    },
  });
  provideIfCurrent(fieldKey, field);
  return field as unknown as VibeField<unknown>;
}

const fieldSlices = {
  value: (state: { value: unknown }) => state.value,
  errors: (state: { meta: { errors: readonly unknown[] } }) => state.meta.errors,
  errorMap: (state: { meta: { errorMap: unknown } }) => state.meta.errorMap,
  isTouched: (state: { meta: { isTouched: boolean } }) => state.meta.isTouched,
  isDirty: (state: { meta: { isDirty: boolean } }) => state.meta.isDirty,
  isBlurred: (state: { meta: { isBlurred: boolean } }) => state.meta.isBlurred,
  isValid: (state: { meta: { isValid: boolean } }) => state.meta.isValid,
  isValidating: (state: { meta: { isValidating: boolean } }) => state.meta.isValidating,
  // Core bumps this counter on push, remove, move, swap and replace.
  arrayVersion: (state: { meta: object }) => Reflect.get(state.meta, `_${"arrayVersion"}`),
};

function coreOptions(options: FieldSource & { form: AnyFormApi; name: string }) {
  const { mode: _mode, ...rest } = options;
  return {
    ...rest,
    defaultValue: isRef(rest.defaultValue) ? rest.defaultValue.value : rest.defaultValue,
  } as never;
}

function prefixed(group: AnyFieldGroupApi, name: string): string {
  return group.getFormFieldName(name as never);
}
