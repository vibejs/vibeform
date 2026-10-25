/** Thrown when a VibeForm composable is used outside its required scope or context. */
export class VibeFormError extends Error {
  override readonly name = "VibeFormError";
}
