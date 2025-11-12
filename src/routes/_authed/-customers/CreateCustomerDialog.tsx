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
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { z } from "zod";
import { useAppForm } from "@/src/hooks/useAppForm";

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
  const createCustomer = useMutation(api.customers.create);

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: customerSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createCustomer({ name: value.name });
        toast.success("Customer created successfully");
        onOpenChange(false);
        form.reset();
      } catch {
        toast.error("Failed to create customer");
      }
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
