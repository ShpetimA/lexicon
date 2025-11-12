import { useFormContext } from "@/src/hooks/form-context";
import { Button } from "@/components/ui/button";
import { ComponentProps } from "react";

type FormSubmitButtonProps = {
  children?: React.ReactNode;
  loadingText?: string;
} & Omit<ComponentProps<typeof Button>, "type" | "disabled">;

export function FormSubmitButton({
  children = "Submit",
  loadingText = "Submitting...",
  ...props
}: FormSubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => ({
        isSubmitting: state.isSubmitting,
        canSubmit: state.canSubmit,
      })}
    >
      {(state) => (
        <Button
          type="submit"
          disabled={!state.canSubmit || state.isSubmitting}
          {...props}
        >
          {state.isSubmitting ? loadingText : children}
        </Button>
      )}
    </form.Subscribe>
  );
}
