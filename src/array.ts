import type {
  DeepKeys,
  DeepValue,
  FormApi,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/form-core";
import { useField, type VibeField } from "./field.ts";

export interface VibeFieldArray<TItem> {
  readonly field: VibeField<readonly TItem[]>;
  readonly items: readonly TItem[];
  push(item: TItem): unknown;
  remove(index: number): unknown;
  insert(index: number, item: TItem): unknown;
  move(from: number, to: number): unknown;
  swap(left: number, right: number): unknown;
  replace(index: number, item: TItem): unknown;
}

type ArrayName<TFormData> = {
  [TName in DeepKeys<TFormData>]: DeepValue<TFormData, TName> extends readonly unknown[]
    ? TName
    : never;
}[DeepKeys<TFormData>];

/** Core array helpers with a field subscription that tracks structural edits, not every nested keystroke. */
export function useFieldArray<
  TFormData,
  TName extends ArrayName<TFormData>,
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
  name: TName,
): VibeFieldArray<ExtractItem<DeepValue<TFormData, TName>>> {
  const field = useField({
    form,
    name: name as never,
    mode: "array",
  }) as unknown as VibeField<readonly ExtractItem<DeepValue<TFormData, TName>>[]>;
  const path = name as never;
  return {
    field,
    get items() {
      return field.value;
    },
    push: (item) => form.pushFieldValue(path, item as never),
    remove: (index) => form.removeFieldValue(path, index),
    insert: (index, item) => form.insertFieldValue(path, index, item as never),
    move: (from, to) => form.moveFieldValues(path, from, to),
    swap: (left, right) => form.swapFieldValues(path, left, right),
    replace: (index, item) => form.replaceFieldValue(path, index, item as never),
  };
}

type ExtractItem<T> = T extends readonly (infer TItem)[] ? TItem : never;
