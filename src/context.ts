import { hasInjectionContext, inject, provide, type InjectionKey } from "@usevibejs/ui";
import type { AnyFieldGroupApi, AnyFormApi } from "@tanstack/form-core";
import { VibeFormError } from "./errors.ts";

export interface VibeFormContext extends AnyFormApi {
  readonly values: unknown;
  readonly errors: readonly unknown[];
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
  submit(event?: { preventDefault(): void }): Promise<void>;
}

/** A mounted field view. Declared here so context does not import the field module. */
export interface VibeFieldContext {
  readonly name: string;
  value: unknown;
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
  handleBlur(): void;
  handleChange(value: unknown): void;
}

export const formKey: InjectionKey<VibeFormContext> = Symbol("vibeform.form");
export const fieldKey: InjectionKey<VibeFieldContext> = Symbol("vibeform.field");
export const groupKey: InjectionKey<AnyFieldGroupApi> = Symbol("vibeform.group");

const missing: unique symbol = Symbol("vibeform.missing");

/** Provides only inside component setup. Effect scopes keep the form local. */
export function provideIfCurrent<T>(key: InjectionKey<T>, value: T): void {
  if (hasInjectionContext()) provide(key, value);
}

/** Reads a provided value without warning when the key or the component is absent. */
export function injectIfCurrent<T>(key: InjectionKey<T>): T | undefined {
  if (!hasInjectionContext()) return undefined;
  const value = inject(key, missing as unknown as T);
  return value === (missing as unknown as T) ? undefined : value;
}

/** The form provided by the nearest `useForm()`. */
export function useFormContext(): VibeFormContext {
  const form = injectIfCurrent(formKey);
  if (!form)
    throw new VibeFormError("useFormContext() requires useForm() in an ancestor component.");
  return form;
}

/** The field provided by the nearest `useField()`. */
export function useFieldContext(): VibeFieldContext {
  const field = injectIfCurrent(fieldKey);
  if (!field)
    throw new VibeFormError("useFieldContext() requires useField() in an ancestor component.");
  return field;
}

/**
 * A separate provide/inject pair for one form type.
 * `useForm()` also provides the default context used by `useFormContext()`.
 */
export function createFormContext<TForm>() {
  const key: InjectionKey<TForm> = Symbol("vibeform.context");
  return {
    provide(form: TForm): void {
      provideIfCurrent(key, form);
    },
    use(): TForm {
      const form = injectIfCurrent(key);
      if (form === undefined) {
        throw new VibeFormError("createFormContext().use() requires its provide() in an ancestor.");
      }
      return form;
    },
  };
}
