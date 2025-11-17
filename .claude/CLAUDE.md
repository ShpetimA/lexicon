# IMPORTANT

In planning and commit messages. Be extremly concise.
Sacrifice grammar for the sake of cohesion.

# IMPORTANT: After each response is completed, run

open "raycast://extensions/raycast/raycast/confetti"

# TYPESCRIPT RULES

Never use `any` or `unknown` in your code only use them when you are 100% sure that the type is not known.
Never typecast.
And no @ts-ignore.

# FORM HANDLING WITH TANSTACK FORM

## Official TanStack Pattern - Context-Based Forms

Use `useAppForm` hook which provides context-aware field components that eliminate prop drilling:

### Setup Pattern

```tsx
import { useAppForm } from "@/src/hooks/useAppForm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const form = useAppForm({
  defaultValues: {
    name: "",
    description: "",
  },
  validators: {
    onChange: schema, // Real-time validation
  },
  onSubmit: async ({ value }) => {
    await mutation(value);
  },
});
```

### Field Rendering - No Prop Drilling

Fields automatically access form context via `useFieldContext()`:

```tsx
<form
  onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit();
  }}
>
  <form.AppField name="name">
    {(field) => (
      <field.TextField label="Name" placeholder="Enter name" required />
    )}
  </form.AppField>

  <form.AppField name="description">
    {(field) => (
      <field.TextareaField
        label="Description"
        placeholder="Optional description"
      />
    )}
  </form.AppField>

  <form.AppField name="active">
    {(field) => <field.CheckboxField label="Active" />}
  </form.AppField>

  {/* IMPORTANT: SubmitButton must be inside form.AppForm wrapper to access context */}
  <form.AppForm>
    <form.SubmitButton>Submit</form.SubmitButton>
  </form.AppForm>
</form>
```

**CRITICAL:** Always wrap `form.SubmitButton` in `<form.AppForm>` to provide form context. Without it, the button cannot access `form.state.isSubmitting`.

### Available Field Components

All field components auto-handle validation, errors, and state via context:

- **TextField** - Text/email/password inputs with Field wrapper
- **TextareaField** - Textarea with Field wrapper
- **CheckboxField** - Checkbox with Field wrapper
- **SubmitButton** - Auto-disables during submission with loading state (requires `form.AppForm` wrapper)

All components:

- Handle their own error display
- Access validation state from context
- No `form` prop needed
- Support all standard HTML input props

### Submit Button Usage

```tsx
{
  /* CORRECT - Wrapped in form.AppForm */
}
<form.AppForm>
  <form.SubmitButton loadingText="Saving...">Save</form.SubmitButton>
</form.AppForm>;

{
  /* INCORRECT - Will fail without form.AppForm wrapper */
}
<form.SubmitButton>Save</form.SubmitButton>;
```

### Required Imports

```tsx
import { useAppForm } from "@/src/hooks/useAppForm";
import { z } from "zod";
```

### Architecture

1. `src/hooks/form-context.ts` - Exports `createFormHookContexts` for context providers
2. `src/hooks/useAppForm.ts` - Creates app-specific hook with all field components
3. `components/form/*Field.tsx` - Field components using `useFieldContext()`
4. Forms use `form.AppField` render prop pattern

This eliminates prop drilling and follows TanStack's official best practices.

### Example: Complete Form

```tsx
import { useAppForm } from "@/src/hooks/useAppForm";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  bio: z.string().optional(),
  active: z.boolean(),
});

export function UserForm() {
  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      active: true,
    },
    validators: {
      onChange: userSchema,
    },
    onSubmit: async ({ value }) => {
      await saveUser(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" required />}
      </form.AppField>

      <form.AppField name="email">
        {(field) => <field.TextField label="Email" type="email" required />}
      </form.AppField>

      <form.AppField name="bio">
        {(field) => <field.TextareaField label="Bio" rows={4} />}
      </form.AppField>

      <form.AppField name="active">
        {(field) => <field.CheckboxField label="Active User" />}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton loadingText="Saving...">Save User</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
```
