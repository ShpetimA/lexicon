import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { api } from "../../../../convex/_generated/api";
import { z } from "zod";
import { useAppForm } from "@/src/hooks/useAppForm";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

type CreateCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const customerSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
});

export function CreateCustomerDialog({
  open,
  onOpenChange,
}: CreateCustomerDialogProps) {
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.customers.create),
    onError: () => {
      toast.error("Failed to create customer");
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: customerSchema,
    },
    onSubmit: async ({ value }) => {
      await mutateAsync({ name: value.name });
      toast.success("Customer created successfully");
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to organize your apps and translations.
          </DialogDescription>
        </DialogHeader>
        <form.Form onSubmit={form.handleSubmit}>
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label="Organization Name"
                placeholder="Enter organization name"
                required
              />
            )}
          </form.AppField>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Creating...">
                Create
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form.Form>
      </DialogContent>
    </Dialog>
  );
}
