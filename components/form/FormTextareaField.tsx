import { useFieldContext } from '@/src/hooks/form-context'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import type { ComponentProps } from 'react'

type FormTextareaFieldProps = {
  label: string
  placeholder?: string
  description?: string
  rows?: number
  className?: string
} & Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange' | 'name' | 'id'>

export function FormTextareaField({ 
  label,
  description,
  rows = 3,
  className,
  ...textareaProps 
}: FormTextareaFieldProps) {
  const field = useFieldContext<string>()
  
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  
  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        rows={rows}
        {...textareaProps}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
