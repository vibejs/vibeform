/** A form that can adopt a server record without importing VibeQuery. */
export interface SyncableForm<T> {
  readonly state: { readonly isDirty: boolean };
  reset(values?: T, options?: { keepDefaultValues?: boolean }): void;
}

/**
 * Copies `data` into the form.
 * `pristine` (the default) does nothing while the user has unsaved edits, so a background
 * refetch cannot wipe them. `always` replaces the current values and, through Core's `reset`,
 * the defaults. `undefined` data never resets the form.
 * `reset` makes the incoming record the new baseline, so a later pristine check treats it as saved.
 */
export function syncFormValues<T>(
  form: SyncableForm<T>,
  data: T | undefined,
  strategy: "pristine" | "always" = "pristine",
): boolean {
  if (data === undefined) return false;
  if (strategy === "pristine" && form.state.isDirty) return false;
  form.reset(data);
  return true;
}
