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
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAppForm } from "@/src/hooks/useAppForm";

const environmentSchema = z.object({
  name: z.string().min(1, "Environment name is required").max(50, "Environment name must be less than 50 characters"),
});

type Environment = {
  _id: Id<"environments">;
  name: string;
  appId: Id<"apps">;
  createdAt: number;
};

type UpdateEnvironmentDialogProps = {
  open: boolean;
  environment: Environment | null;
  onOpenChange: (open: boolean) => void;
};

export function UpdateEnvironmentDialog({ open, environment, onOpenChange }: UpdateEnvironmentDialogProps) {
  const updateEnvironment = useMutation(api.environments.update);

  const form = useAppForm({
    defaultValues: {
      name: environment?.name ?? "",
    },
    validators: {
      onChange: environmentSchema,
    },
    onSubmit: async ({ value }) => {
      if (!environment) return;
      try {
        await updateEnvironment({
          id: environment._id,
          name: value.name,
        });
        toast.success("Environment updated successfully");
        onOpenChange(false);
        form.reset();
      } catch {
        toast.error("Failed to update environment");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Environment</DialogTitle>
          <DialogDescription>Update the environment settings.</DialogDescription>
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
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Updating...">Update</form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

