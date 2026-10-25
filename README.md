# VibeForm

Powerful, type-safe forms for Vibe.js.

VibeForm connects [TanStack Form Core](https://tanstack.com/form) 1.33 to Vibe's fine-grained reactivity. Core owns form state, validation, arrays and submission. VibeForm owns field registration, `v-model` and cleanup. It does not depend on React, Vue or Solid.

The package name is `@usevibejs/form`.

## Install

```bash
pnpm add @usevibejs/form
```

`@usevibejs/ui` is the required peer. Install one Standard Schema library, such as Zod or Valibot, only if you want schema validators.

## Quick start

```vibe
<script setup lang="ts">
import { useField, useForm } from '@usevibejs/form';

const form = useForm({
  defaultValues: { email: '', password: '' },
  onSubmit: ({ value }) => value,
});
const email = useField(form, 'email', {
  validators: {
    onBlur: ({ value }) => (value.includes('@') ? undefined : 'Enter an email'),
  },
});
</script>

<template>
  <form @submit="form.submit">
    <input v-model="email.value" @blur="email.handleBlur" :aria-invalid="email.invalid || undefined" />
    <p role="alert">{{ email.error }}</p>
    <button type="submit" :disabled="form.isSubmitting">Sign in</button>
  </form>
</template>
```

`form.submit` prevents the browser submit and ignores a second call while one is in flight. `email.value` is the `v-model` target. Read `email.error`, `email.invalid` and `form.isSubmitting` directly. They track only that slice.

Submitted values are the form values Core stores. A Standard Schema does not replace them with its parsed output. Transform in `onSubmit` when you need the parsed value.

## Further reading

- [Guides](docs/guide.md)
- [Validation](docs/validation.md)
- [Accessibility](docs/accessibility.md)
- [Vibecn and VibeQuery](docs/integrations.md)
- [API](docs/api.md)
- [Migration from TanStack Form](docs/migration.md)
