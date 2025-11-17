import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "@/src/hooks/form-context";
import { FormTextField } from "@/components/form/FormTextField";
import { FormTextareaField } from "@/components/form/FormTextareaField";
import { FormCheckboxField } from "@/components/form/FormCheckboxField";
import { FormSubmitButton } from "@/components/form/FormSubmitButton";
import Form from "@/components/form/Form";

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField: FormTextField,
    TextareaField: FormTextareaField,
    CheckboxField: FormCheckboxField,
  },
  formComponents: {
    Form: Form,
    SubmitButton: FormSubmitButton,
  },
});
