# Migration from TanStack Form

VibeForm uses `@tanstack/form-core` 1.33, the same major version as the React and Vue adapters. It is not affiliated with TanStack.

| TanStack adapter                 | VibeForm                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `useForm`                        | `useForm`                                                                       |
| `form.Field` render prop         | `useField(form, name)` and `v-model="field.value"`                              |
| `useStore(form.store, selector)` | `form.useStore(selector)`                                                       |
| `form.Subscribe`                 | Read `form.isSubmitting` or another slice                                       |
| `validators` and Standard Schema | The same Core options                                                           |
| `form.handleSubmit()`            | `form.submit(event)` in a template, or `handleSubmit` when you need submit meta |

There is no React hook order and no Vue `Field` component in this package. Register fields in setup. Unmounting the component unregisters the field and keeps the value, which matches Core's retention.

`createFormHook` field component maps are unnecessary. Import a `.vibe` field component and call `useField` or `useFieldContext` inside it.
