import { expectTypeOf } from "vitest";
import { useField, useFieldArray, useForm } from "./index.ts";

const form = useForm({
  defaultValues: {
    email: "",
    age: 1,
    address: { city: "" },
    items: [] as { sku: string }[],
  },
});
const email = useField(form, "email");
const age = useField(form, "age");
const city = useField(form, "address.city");
const items = useFieldArray(form, "items");

expectTypeOf(email.value).toEqualTypeOf<string>();
expectTypeOf(age.value).toEqualTypeOf<number>();
expectTypeOf(city.value).toEqualTypeOf<string>();
expectTypeOf(items.items).toEqualTypeOf<readonly { sku: string }[]>();
expectTypeOf(form.values.email).toEqualTypeOf<string>();

// @ts-expect-error Unknown field paths are rejected.
useField(form, "missing");
// @ts-expect-error A string field is not an array field.
useFieldArray(form, "email");
