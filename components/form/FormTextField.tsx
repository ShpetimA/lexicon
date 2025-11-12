import { useFieldContext } from '@/src/hooks/form-context'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import type { ComponentProps } from 'react'

type FormTextFieldProps = {
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  description?: string
  className?: string
  inputClassName?: string
} & Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'name' | 'id'>

export function FormTextField({ 
  label,
  description,
  className,
  inputClassName,
  type = 'text',
  ...inputProps 
}: FormTextFieldProps) {
  const field = useFieldContext<string>()
  
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  
  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        className={inputClassName}
        {...inputProps}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
