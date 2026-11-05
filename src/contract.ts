/** One issue from an `@usevibejs/contract` problem body. The package is not imported. */
export interface ContractIssue {
  readonly in: string;
  readonly pointer: string;
  readonly message: string;
}

/** The fields VibeForm reads from a contract problem. Other problem fields are ignored. */
export interface ContractProblem {
  readonly code: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly errors?: readonly ContractIssue[];
}

export interface ServerFieldErrors {
  readonly form?: string;
  readonly fields: Readonly<Record<string, readonly string[]>>;
}

export interface ServerForm {
  setErrorMap(errorMap: { onServer?: string }): void;
  /** `never` keeps Core's invariant field-path method assignable. */
  setFieldMeta(field: never, updater: (previous: never) => unknown): void;
  state: { fieldMeta: object; values?: unknown };
}

/** Converts an RFC 6901 pointer into a TanStack field path. `/items/0/sku` becomes `items[0].sku`. */
export function pointerToField(pointer: string): string | undefined {
  if (!pointer.startsWith("/")) return undefined;
  const parts = pointer
    .split("/")
    .slice(1)
    .filter((part) => part.length > 0);
  if (parts.length === 0) return undefined;
  let path = "";
  for (const part of parts) {
    const decoded = decodeURIComponent(part).replaceAll("~1", "/").replaceAll("~0", "~");
    if (/^(0|[1-9]\d*)$/.test(decoded)) path += `[${decoded}]`;
    else path = path ? `${path}.${decoded}` : decoded;
  }
  return path;
}

function asServerForm(form: unknown): ServerForm {
  return form as ServerForm;
}

/**
 * Maps a contract problem onto form and field messages.
 * Body issues with a pointer become field errors. Every other issue, and a problem with no
 * issues, becomes one form message. Pass `include` to read another request part.
 */
export function mapContractProblem(
  problem: ContractProblem,
  options?: { readonly include?: readonly string[] },
): ServerFieldErrors {
  const include = options?.include ?? ["body"];
  const fields: Record<string, string[]> = {};
  const formMessages: string[] = [];
  for (const issue of problem.errors ?? []) {
    const field = include.includes(issue.in) ? pointerToField(issue.pointer) : undefined;
    if (field) (fields[field] ??= []).push(issue.message);
    else if (issue.message) formMessages.push(issue.message);
  }
  if (formMessages.length === 0 && Object.keys(fields).length === 0) {
    formMessages.push(problem.detail ?? problem.title);
  }
  return { form: formMessages.length > 0 ? formMessages.join("\n") : undefined, fields };
}

function isContractProblem(value: ServerFieldErrors | ContractProblem): value is ContractProblem {
  return "code" in value && "title" in value && "status" in value && !("fields" in value);
}

/** A field the form already owns, either because it is mounted or because `values` has that path. */
function fieldKnown(api: ServerForm, field: string): boolean {
  if (Object.hasOwn(api.state.fieldMeta, field)) return true;
  return pathExists(api.state.values, field);
}

function pathExists(values: unknown, field: string): boolean {
  if (typeof values !== "object" || values === null) return false;
  const parts = field.split(/\.|\[|\]/).filter((part) => part.length > 0);
  if (parts.length === 0) return false;
  let current: unknown = values;
  for (const part of parts) {
    if (typeof current !== "object" || current === null || !Object.hasOwn(current, part))
      return false;
    current = (current as Record<string, unknown>)[part];
  }
  return true;
}

/**
 * Writes server errors onto the form.
 * Pass a contract `problem+json` body or a prepared field map. Pointers that name a mounted
 * field, or a path present on `values`, use that field's `onServer` channel. Every other
 * field message is appended to the form message.
 */
export function applyServerErrors<TForm>(
  form: TForm,
  input: ServerFieldErrors | ContractProblem,
): void {
  const api = asServerForm(form);
  const errors = isContractProblem(input) ? mapContractProblem(input) : input;
  const unknown: string[] = [];
  for (const [field, messages] of Object.entries(errors.fields)) {
    if (!fieldKnown(api, field)) {
      for (const message of messages) if (message) unknown.push(message);
      continue;
    }
    const value = messages.length === 1 ? messages[0] : messages;
    api.setFieldMeta(
      field as never,
      ((previous: { errorMap?: Record<string, unknown> } | undefined) => ({
        ...previous,
        errorMap: { ...previous?.errorMap, onServer: value },
      })) as never,
    );
  }
  const lines = [errors.form, ...unknown].filter((line): line is string => !!line);
  if (lines.length > 0) api.setErrorMap({ onServer: lines.join("\n") });
}

/** Clears `onServer` from the form and from the listed fields, or from every known field. */
export function clearServerErrors<TForm>(form: TForm, fields?: readonly string[]): void {
  const api = asServerForm(form);
  api.setErrorMap({ onServer: undefined });
  const names = fields ?? Object.keys(api.state.fieldMeta);
  for (const field of names) {
    api.setFieldMeta(
      field as never,
      ((previous: { errorMap?: Record<string, unknown> } | undefined) => ({
        ...previous,
        errorMap: { ...previous?.errorMap, onServer: undefined },
      })) as never,
    );
  }
}

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

export interface ApiFailure<E extends ContractProblem = ContractProblem> {
  readonly ok: false;
  readonly error: E;
}

/**
 * Applies a failed contract result to the form and returns the same result.
 * Successful results are not modified. The helper does not throw.
 */
export function applyApiResult<TForm, T, E extends ContractProblem>(
  form: TForm,
  result: ApiSuccess<T> | ApiFailure<E>,
  options?: { readonly include?: readonly string[] },
): ApiSuccess<T> | ApiFailure<E> {
  if (!result.ok) applyServerErrors(form, mapContractProblem(result.error, options));
  return result;
}
