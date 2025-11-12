import { useFieldContext } from '@/src/hooks/form-context'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'

type FormCheckboxFieldProps = {
  label: string
  disabled?: boolean
  className?: string
}

export function FormCheckboxField({ label, disabled, className }: FormCheckboxFieldProps) {
  const field = useFieldContext<boolean>()
  
  return (
    <Field className={className}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(!!checked)}
          disabled={disabled}
        />
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      </div>
    </Field>
  )
}
