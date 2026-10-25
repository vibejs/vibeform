import { onScopeDispose, shallowRef, type ShallowRef } from "@usevibejs/ui";
import type { ReadonlyStore } from "@tanstack/store";
import { assertScope } from "./scope.ts";

/** The store surface VibeForm subscribes to. TanStack stores satisfy it. */
export type ReadableStore<T> = Pick<ReadonlyStore<T>, "state" | "subscribe">;

/**
 * Subscribes to one selected value for the active scope.
 * The ref changes only when `Object.is` says the selection changed, so unrelated store
 * notifications do not invalidate readers.
 */
export function useStore<TState, TSelected = TState>(
  store: ReadableStore<TState>,
  selector?: (state: TState) => TSelected,
): Readonly<ShallowRef<TSelected>> {
  assertScope("useStore");
  const select = selector ?? ((state: TState) => state as unknown as TSelected);
  const selected = shallowRef(select(store.state));
  const subscription = store.subscribe(() => {
    const next = select(store.state);
    if (!Object.is(next, selected.value)) selected.value = next;
  });
  onScopeDispose(() => subscription.unsubscribe());
  return selected;
}

/**
 * One store subscription that feeds several selectors.
 * Each slice stays independent: a reader of one ref is not invalidated by another slice.
 */
export function useStoreSlices<
  TState,
  const TSlices extends Record<string, (state: TState) => unknown>,
>(
  store: ReadableStore<TState>,
  slices: TSlices,
): { [K in keyof TSlices]: ShallowRef<ReturnType<TSlices[K]>> } {
  assertScope("useStore");
  const keys = Object.keys(slices) as (keyof TSlices)[];
  const refs = {} as { [K in keyof TSlices]: ShallowRef<ReturnType<TSlices[K]>> };
  const current = store.state;
  for (const key of keys) {
    refs[key] = shallowRef(slices[key](current) as ReturnType<TSlices[typeof key]>);
  }
  const subscription = store.subscribe(() => {
    const next = store.state;
    for (const key of keys) {
      const value = slices[key](next) as ReturnType<TSlices[typeof key]>;
      if (!Object.is(value, refs[key].value)) refs[key].value = value;
    }
  });
  onScopeDispose(() => subscription.unsubscribe());
  return refs;
}
