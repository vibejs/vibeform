# Troubleshooting

`useForm() requires an active component or effect scope.` Call the composable from setup or `effectScope().run()`, not from a module scope or an event handler.

`useField() requires a form` means the call passed no form and no ancestor `useForm()`. `provide` is visible to child components, not to the component that called it.

A `v-model` that does not update usually targets a plain string. Bind `field.value`. Native text, checkbox, radio and select models follow Vibe's compiler. A component must `defineModel()` for `v-model` to call its update. Vibecn Input, Textarea, Checkbox, Switch, Radio Group, Select and Slider do.

Blur validators stay quiet until `handleBlur`. Number inputs need `v-model.number` or the value remains a string. File inputs cannot use `v-model`.

Stale async errors are dropped when Core aborts that attempt. `reset` aborts controllers that are already on the field. A validator that ignores its `signal` can still resolve. Check `signal.aborted` before returning an error.

If TypeScript rejects a field path, the path is not a key of `defaultValues`. Dynamic names can be passed through `useField({ form, name })` when the name is a string that changes at runtime.
