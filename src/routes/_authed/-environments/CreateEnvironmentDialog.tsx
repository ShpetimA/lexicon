import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenant } from "../../../contexts/TenantContext";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAppForm } from "@/src/hooks/useAppForm";

const environmentSchema = z.object({
  name: z.string().min(1, "Environment name is required").max(50, "Environment name must be less than 50 characters"),
});

type CreateEnvironmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateEnvironmentDialog({ open, onOpenChange }: CreateEnvironmentDialogProps) {
  const { selectedApp } = useTenant();
  const createEnvironment = useMutation(api.environments.create);

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: environmentSchema,
    },
    onSubmit: async ({ value }) => {
      if (!selectedApp) {
        toast.error("No app selected");
        return;
      }
      try {
        await createEnvironment({
          name: value.name,
          appId: selectedApp._id,
        });
        toast.success("Environment created successfully");
        onOpenChange(false);
        form.reset();
      } catch {
        toast.error("Failed to create environment");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Environment</DialogTitle>
          <DialogDescription>
            Add a new deployment environment for your app (e.g., "dev", "staging", "prod").
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
                label="Environment Name"
                placeholder="e.g., dev, staging, prod"
                required
              />
            )}
          </form.AppField>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Creating...">Add Environment</form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

