import { getCurrentScope } from "@usevibejs/ui";
import { VibeFormError } from "./errors.ts";

let sequence = 0;

/** A stable id for devtools and generated controls. Component `useId()` warns outside setup. */
export function createFormId(): string {
  sequence += 1;
  return `vibeform-${sequence}`;
}

/** Composables register subscriptions on the active component or effect scope. */
export function assertScope(hook: string): void {
  if (!getCurrentScope()?.active) {
    throw new VibeFormError(`${hook}() requires an active component or effect scope.`);
  }
}
