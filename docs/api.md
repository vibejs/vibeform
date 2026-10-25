# API

`useForm(options)` returns the Core `FormApi` plus slice getters (`values`, `isSubmitting`, `isValid`, `canSubmit`, `errors`, and the dirty, touched, blurred and submitted flags) and `useStore(selector)`. `form.submit(event)` is the DOM helper. `form.useSelector` is the same function as `useStore`.

`useField(form, name, options)` returns a stable reactive field. `value` is writable. `error`, `messages`, `invalid`, `isTouched`, `isDirty`, `isBlurred`, `isPristine`, `isValid`, `isValidating`, `meta` and `errorMap` are reads. `handleChange`, `handleBlur` and `setValue` update Core. `api` is the raw `FieldApi` and is not deeply reactive.

`useField({ name })` uses the form from context. Inside `useFieldGroup`, that name is prefixed.

`useFieldArray(form, name)` returns the array field plus Core's array operations.

`useFormGroup(options)` mounts a Core form group. `useStore(store, selector)` subscribes to any Core store for the active scope.

`formOptions` is re-exported from Core for shared option objects. `createFormHook` is not included: Vibe components are imported, and `formOptions` plus `createFormContext()` cover shared configuration without a component registry.

Re-exported Core values include `FormApi`, `FieldApi`, `FormGroupApi`, `FieldGroupApi`, `mergeForm` and `standardSchemaValidators`.
