/** Focuses the first invalid control inside `root`, or the document when `root` is omitted. */
export function focusFirstInvalid(root?: ParentNode): boolean {
  return focusElement(resolveRoot(root)?.querySelector<HTMLElement>('[aria-invalid="true"]'));
}

/**
 * Focuses the control whose `name` attribute equals `name`.
 * Names containing a double quote are ignored so the selector cannot break out.
 */
export function focusField(name: string, root?: ParentNode): boolean {
  const scope = resolveRoot(root);
  if (!scope || name.includes('"')) return false;
  return focusElement(scope.querySelector<HTMLElement>(`[name="${name}"]`));
}

function resolveRoot(root?: ParentNode): ParentNode | undefined {
  if (root) return root;
  return typeof document === "undefined" ? undefined : document;
}

function focusElement(target: HTMLElement | null | undefined): boolean {
  if (!target || typeof target.focus !== "function") return false;
  target.focus();
  if (typeof document === "undefined") return true;
  return document.activeElement === target;
}
