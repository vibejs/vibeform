import {
  isRef,
  onScopeDispose,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type ShallowRef,
} from "@usevibejs/ui";
import {
  FormApi,
  type AnyFormApi,
  type FormAsyncValidateOrFn,
  type FormOptions,
  type FormState,
  type FormValidateOrFn,
} from "@tanstack/form-core";
import { formKey, provideIfCurrent, type VibeFormContext } from "./context.ts";
import { assertScope, createFormId } from "./scope.ts";
import { useStore, useStoreSlices } from "./store.ts";

/** The Core form, plus Vibe reads that track only the slice a template touches. */
export type VibeForm<
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
> & {
  useStore<
    TSelected = FormStateOf<
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
      TOnServer
    >,
  >(
    selector?: (
      state: FormStateOf<
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
        TOnServer
      >,
    ) => TSelected,
  ): Readonly<ShallowRef<TSelected>>;
  /** TanStack's name for {@link VibeForm.useStore}. */
  useSelector: VibeForm<
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
  >["useStore"];
  readonly values: TFormData;
  readonly errors: ReadonlyArray<unknown>;
  readonly errorMap: FormStateOf<
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
    TOnServer
  >["errorMap"];
  readonly isSubmitting: boolean;
  readonly isSubmitted: boolean;
  readonly isSubmitSuccessful: boolean;
  readonly isValidating: boolean;
  readonly isValid: boolean;
  readonly isDirty: boolean;
  readonly isPristine: boolean;
  readonly isTouched: boolean;
  readonly isBlurred: boolean;
  readonly canSubmit: boolean;
  readonly submissionAttempts: number;
  readonly isFieldsValid: boolean;
  readonly isFormValid: boolean;
  readonly isDefaultValue: boolean;
  /** Prevents the native submit and ignores a second call while one is in flight. */
  submit(event?: { preventDefault(): void }): Promise<void>;
};

type FormStateOf<
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
> = FormState<
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
  TOnServer
>;

const slices = {
  values: (state: { values: unknown }) => state.values,
  errors: (state: { errors: readonly unknown[] }) => state.errors,
  errorMap: (state: { errorMap: unknown }) => state.errorMap,
  isSubmitting: (state: { isSubmitting: boolean }) => state.isSubmitting,
  isSubmitted: (state: { isSubmitted: boolean }) => state.isSubmitted,
  isSubmitSuccessful: (state: { isSubmitSuccessful: boolean }) => state.isSubmitSuccessful,
  isValidating: (state: { isValidating: boolean }) => state.isValidating,
  isValid: (state: { isValid: boolean }) => state.isValid,
  isDirty: (state: { isDirty: boolean }) => state.isDirty,
  isPristine: (state: { isPristine: boolean }) => state.isPristine,
  isTouched: (state: { isTouched: boolean }) => state.isTouched,
  isBlurred: (state: { isBlurred: boolean }) => state.isBlurred,
  canSubmit: (state: { canSubmit: boolean }) => state.canSubmit,
  submissionAttempts: (state: { submissionAttempts: number }) => state.submissionAttempts,
  isFieldsValid: (state: { isFieldsValid: boolean }) => state.isFieldsValid,
  isFormValid: (state: { isFormValid: boolean }) => state.isFormValid,
  isDefaultValue: (state: { isDefaultValue: boolean }) => state.isDefaultValue,
};

/**
 * Creates one form for the active scope, mounts it, and removes its subscriptions on dispose.
 * Pass a getter or a ref when `defaultValues` or validators should update later.
 * Untouched forms accept new defaults. A dirty form keeps what the user typed.
 */
export function useForm<
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
  TSubmitMeta = never,
>(
  options?: MaybeRefOrGetter<
    FormOptions<
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
    >
  >,
): VibeForm<
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
> {
  assertScope("useForm");
  const formId = readOptions(options).formId ?? createFormId();
  const api = new FormApi(resolveOptions(options, formId));
  const stopMount = api.mount();
  onScopeDispose(() => {
    abortFieldValidations(api);
    stopMount();
  });
  watch(
    () => resolveOptions(options, formId),
    (next) => api.update(next),
    { flush: "sync" },
  );
  const selected = useStoreSlices(api.store, slices);
  const form = api as VibeForm<
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
  const useFormStore: VibeForm<
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
  >["useStore"] = (selector) => useStore(api.store, selector);
  form.useStore = useFormStore;
  form.useSelector = useFormStore;
  form.submit = (event) => {
    event?.preventDefault();
    if (api.state.isSubmitting) return Promise.resolve();
    return api.handleSubmit();
  };
  const reset = api.reset.bind(api);
  form.reset = ((values, opts) => {
    abortFieldValidations(api);
    return reset(values, opts);
  }) as typeof api.reset;
  for (const key of Object.keys(slices) as (keyof typeof slices)[]) {
    Object.defineProperty(form, key, {
      enumerable: false,
      configurable: true,
      get: () => selected[key].value,
    });
  }
  provideIfCurrent(formKey, form as unknown as VibeFormContext);
  return form;
}

function readOptions(options: MaybeRefOrGetter<unknown> | undefined): {
  formId?: string;
  defaultValues?: unknown;
} {
  const resolved = toValue(options);
  if (!resolved || typeof resolved !== "object") return {};
  return resolved as { formId?: string; defaultValues?: unknown };
}

function resolveOptions<TOptions extends { formId?: string; defaultValues?: unknown }>(
  options: MaybeRefOrGetter<TOptions> | undefined,
  formId: string,
): TOptions {
  const resolved = toValue(options);
  const source = (resolved && typeof resolved === "object" ? resolved : {}) as TOptions;
  const defaultValues = isRef(source.defaultValues)
    ? source.defaultValues.value
    : source.defaultValues;
  return { ...source, defaultValues, formId: source.formId ?? formId };
}

/** Aborts Core's in-flight field validations. Reset and disposal use the controllers Core already owns. */
export function abortFieldValidations(form: Pick<AnyFormApi, "fieldInfo">): void {
  for (const info of Object.values(form.fieldInfo)) {
    if (!info) continue;
    for (const meta of Object.values(info.validationMetaMap)) meta?.lastAbortController.abort();
  }
}
