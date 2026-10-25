/** Turns a Core validation error into the messages a control should announce. */
export function errorMessages(error: unknown): string[] {
  if (typeof error === "string") return error ? [error] : [];
  if (Array.isArray(error)) return dedupe(error.flatMap((item) => errorMessages(item)));
  if (isIssue(error)) return error.message ? [error.message] : [];
  return [];
}

/** Form-level errors, including a Standard Schema `{ form, fields }` payload's root messages. */
export function formErrorMessages(errors: readonly unknown[]): string[] {
  return dedupe(
    errors.flatMap((error) => {
      if (isFormSchemaError(error)) {
        const root = error.form[""] ?? error.form.root;
        return errorMessages(root);
      }
      return errorMessages(error);
    }),
  );
}

function dedupe(messages: readonly string[]): string[] {
  return [...new Set(messages)];
}

function isIssue(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    !("form" in error)
  );
}

function isFormSchemaError(error: unknown): error is { form: Record<string, unknown> } {
  return typeof error === "object" && error !== null && "form" in error && isRecord(error.form);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
