# VibeForm

**Type-safe forms for vibe.js, powered by TanStack Form.**

VibeForm connects [TanStack Form Core](https://tanstack.com/form) 1.33 to the fine-grained reactivity of [vibe.js](https://vibejs.org). Core owns form state, validation, arrays and submission. VibeForm owns field registration, `v-model` and cleanup. It does not depend on React, Vue or Solid.

The package name is `@usevibejs/form`.

## Install

```bash
pnpm add @usevibejs/form @usevibejs/ui
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

## Documentation

- [Guides](docs/guide.md)
- [Validation](docs/validation.md)
- [Accessibility](docs/accessibility.md)
- [Vibecn and VibeQuery](docs/integrations.md)
- [API](docs/api.md)
- [Migration from TanStack Form](docs/migration.md)
- [Performance](docs/performance.md)
- [Troubleshooting](docs/troubleshooting.md)

## Local development

```bash
pnpm install
pnpm build
pnpm check
pnpm dev
```

`pnpm check` runs formatting, lint, type checks, tests with coverage and the packed-package integration test. `pnpm dev` starts the example gallery.

## Releases

Releases use changesets. Add a changeset with `pnpm changeset` for every user-visible change. A maintainer runs the Release workflow from main, which opens a release PR and publishes to npm through trusted publishing.

## The vibe.js family

| Package                                                   | Description                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| [vibe.js](https://github.com/vibejs/vibejs)               | The framework: .vibe components, server and typed contracts |
| [@usevibejs/auth](https://github.com/vibejs/vibeauth)     | Authentication with Better Auth                             |
| [@usevibejs/form](https://github.com/vibejs/vibeform)     | Type-safe forms with TanStack Form                          |
| [@usevibejs/motion](https://github.com/vibejs/vibemotion) | Animations, gestures and layout with Motion                 |
| [@usevibejs/query](https://github.com/vibejs/vibequery)   | Async state and data fetching with TanStack Query           |
| [@usevibejs/table](https://github.com/vibejs/vibetable)   | Headless tables with TanStack Table                         |
| [@usevibejs/use](https://github.com/vibejs/vibeuse)       | Essential composables                                       |
| [vibecn](https://github.com/vibejs/vibecn)                | shadcn/ui components as .vibe source                        |

## License

MIT. See [LICENSE](LICENSE) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
