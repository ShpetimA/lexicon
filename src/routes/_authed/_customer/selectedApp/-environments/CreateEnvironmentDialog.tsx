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
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useAppForm } from "@/src/hooks/useAppForm";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";

const environmentSchema = z.object({
  name: z
    .string()
    .min(1, "Environment name is required")
    .max(50, "Environment name must be less than 50 characters"),
});

type CreateEnvironmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateEnvironmentDialog({
  open,
  onOpenChange,
}: CreateEnvironmentDialogProps) {
  const { selectedApp } = useApp();
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.environments.create),
    onError: () => {
      toast.error("Failed to create environment");
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: environmentSchema,
    },
    onSubmit: async ({ value }) => {
      await mutateAsync({
        name: value.name,
        appId: selectedApp._id,
      });
      toast.success("Environment created successfully");
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Environment</DialogTitle>
          <DialogDescription>
            Add a new deployment environment for your app (e.g., "dev",
            "staging", "prod").
          </DialogDescription>
        </DialogHeader>
        <form.Form onSubmit={form.handleSubmit} className="space-y-4">
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label="Environment Name"
                placeholder="e.g., dev, staging, prod"
              />
            )}
          </form.AppField>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Creating...">
                Add Environment
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form.Form>
      </DialogContent>
    </Dialog>
  );
}
