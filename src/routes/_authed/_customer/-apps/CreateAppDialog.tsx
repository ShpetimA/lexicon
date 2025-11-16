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
import { Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { useAppForm } from "@/src/hooks/useAppForm";

type CreateAppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: Id<"customers">;
};

const CreateAppSchema = z.object({
  name: z.string().min(1, "App name is required"),
});

export function CreateAppDialog({
  open,
  onOpenChange,
  customerId,
}: CreateAppDialogProps) {
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.apps.create),
    onError: () => {
      toast.error("Failed to create app");
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: CreateAppSchema,
    },
    onSubmit: async (data) => {
      await mutateAsync({
        customerId,
        name: data.value.name.trim(),
      });
      toast.success("App created successfully");
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create App</DialogTitle>
          <DialogDescription>
            Create a new app for this organization. An API key will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>
        <form.Form onSubmit={form.handleSubmit}>
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label="App Name"
                placeholder="Enter App name"
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
