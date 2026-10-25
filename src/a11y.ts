import type { VibeField } from "./field.ts";

export interface ControlIds {
  readonly input: string;
  readonly description: string;
  readonly error: string;
}

/** Stable ids for a label, description and error. `seed` should already be unique. */
export function controlIds(seed: string): ControlIds {
  return { input: `${seed}-input`, description: `${seed}-description`, error: `${seed}-error` };
}

export interface ControlProps {
  readonly id: string;
  readonly name: string;
  readonly "aria-invalid": true | undefined;
  readonly "aria-describedby": string | undefined;
  readonly "aria-required": true | undefined;
}

/**
 * Attributes for a labelled control.
 * Pass `described` when the description node is rendered, and `errored` when the error node is.
 */
export function controlProps(
  field: Pick<VibeField<unknown>, "name" | "invalid">,
  ids: ControlIds,
  options?: { readonly required?: boolean; readonly described?: boolean },
): ControlProps {
  const describedBy = [
    options?.described ? ids.description : undefined,
    field.invalid ? ids.error : undefined,
  ].filter((id): id is string => !!id);
  return {
    id: ids.input,
    name: field.name,
    "aria-invalid": field.invalid ? true : undefined,
    "aria-describedby": describedBy.length > 0 ? describedBy.join(" ") : undefined,
    "aria-required": options?.required ? true : undefined,
  };
}

/** FieldError's `{ message }` list. */
export function fieldErrorItems(messages: readonly string[]): { message: string }[] {
  return messages.map((message) => ({ message }));
}
