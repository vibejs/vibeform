# Integrations

## Vibecn

Vibecn keeps the visual field primitives. VibeForm does not depend on them. In an app that has copied the registry:

```bash
pnpm dlx @usevibejs/vibecn@latest add form
```

That copies `FormField`, `FormErrorSummary` and `lib/form.ts`, and reuses Field, Label and the input components you already have. Bind `v-model` to `field.value`. The installed helper returns ids and error items for those components.

`@usevibejs/form` is an npm dependency of that registry item. The installer does not edit `package.json`.

## VibeQuery

`@usevibejs/form/query` has no dependency on VibeQuery. `syncFormValues(form, query.data)` calls `reset` only when the form is pristine. A dirty form keeps the user's edits when a query refetches. After a successful mutation, invalidate the query yourself and then `form.reset(saved)` if the response should become the new baseline.

## Contract

`@usevibejs/form/contract` accepts the structural shape of an `@usevibejs/contract` `ApiResult`. It does not import that package. `applyApiResult` writes field pointers and a form message, then returns the same result. It does not throw. Unknown error codes still produce a form message from `detail` or `title` when they carry no issues.
