# Guides

Call `useForm()` and `useField()` during component setup or inside an `effectScope()`. Each call subscribes for that scope and unsubscribes when the scope stops.

## Values

`field.value` reads and writes the Core value. A template `v-model="field.value"` assigns through Vibe's model, which calls `handleChange`. Call `field.handleBlur()` from `@blur` so touched state and blur validators run.

```vibe
<script setup lang="ts">
import { useField, useForm } from '@usevibejs/form';

const form = useForm({
  defaultValues: { email: '' },
  onSubmit: ({ value }) => value,
});
const email = useField(form, 'email');
</script>

<template>
  <form @submit="form.submit">
    <input name="email" v-model="email.value" @blur="email.handleBlur" />
  </form>
</template>
```

Checkbox and radio models stay booleans, strings, arrays or sets, matching Vibe's native `v-model`. Number inputs use `v-model.number`. Date inputs stay strings unless a component's model is a date.

## Nested paths and arrays

`useField(form, 'address.city')` addresses a nested property. `useFieldArray(form, 'lines')` exposes `push`, `remove`, `insert`, `move`, `swap` and `replace`. Those are Core operations, so item meta moves with the item. Read `lines.items` in the template. Child inputs should use `useField(form, 'lines[0].sku')` when each row is its own component. The array field itself subscribes to Core's array version, so a keystroke in one row does not rebuild the array subscription.

`useFieldGroup(form, 'address')` lets a child call `useField({ name: 'city' })` and register `address.city`. Pass `form` explicitly on a child field to keep an absolute path. `useFormGroup` adds Core's group validators on top of that prefix.

## Context

`useForm()` provides the form to descendants. `useFormContext()` reads it. `useField()` provides the field. `useFieldContext()` reads it. `createFormContext()` is a separate pair when a screen has more than one form.

A conditional field that unmounts keeps its value. Core retains the value and the touched flag. Mounting the field again shows what the user typed.

## Submission

`form.submit(event)` calls `preventDefault()` and returns immediately when `form.isSubmitting` is already true. `form.handleSubmit()` is Core's method and counts another attempt. Reset with `form.reset()`. Pass new values to make them the defaults. `reset(values, { keepDefaultValues: true })` restores values without changing the baseline.

Pass fresh defaults through a getter. The form adopts them only while it is pristine, so a background refresh does not wipe unsaved edits:

```ts
import { ref, watch } from "@usevibejs/ui";
import { useForm } from "@usevibejs/form";
import { syncFormValues } from "@usevibejs/form/query";

const record = ref<{ name: string } | undefined>(undefined);
const form = useForm({ defaultValues: { name: "" } });
watch(record, (value) => syncFormValues(form, value));
```

`syncFormValues` returns false when `data` is missing or the form is dirty. `syncFormValues(form, value, 'always')` resets anyway.
