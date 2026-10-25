# Performance

Each field uses one store subscription. A template that reads `email.value` does not recompute because `password.value` changed. `form.values` is the whole value object, so a reader of `form.values` updates on every edit. Prefer field slices in large forms.

`useFieldArray` subscribes to Core's array version. Structural edits (`push`, `remove`, `move`, `swap`, `replace`) refresh the array. A nested keystroke does not.

`pnpm bench` mounts 10, 100 and 500 fields, updates one field, pushes array items and repeats conditional mount/unmount. The command prints the measurements for that run. Those numbers are not checked in. Subscriptions stop with the effect scope, including when a conditional child unmounts.

Validation cost is Core's. Debounce async validators with `onChangeAsyncDebounceMs` instead of adding a second timer.
