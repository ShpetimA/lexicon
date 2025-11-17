import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/src/contexts/TenantContext";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { useAppForm } from "@/src/hooks/useAppForm";
import { useConvexMutation } from "@convex-dev/react-query";

const keySchema = z.object({
  name: z.string().min(1, "Key ID is required"),
  description: z.string(),
});

type AddKeyFormProps = {
  onCreated: () => void;
  onCancel: () => void;
};

export function AddKeyForm({ onCreated, onCancel }: AddKeyFormProps) {
  const { selectedApp } = useTenant();
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.keys.create),
    onError: () => {
      toast.error("Failed to add key");
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onChange: keySchema,
    },
    onSubmit: async ({ value }) => {
      if (!selectedApp) {
        toast.error("No app selected");
        return;
      }
      await mutateAsync({
        appId: selectedApp._id,
        name: value.name.trim(),
        description: value.description?.trim() || undefined,
      });
      toast.success("Key added successfully");
      form.reset();
      onCreated();
    },
  });

  return (
    <div className="p-4 border rounded-md bg-muted/50 space-y-4">
      <h3 className="text-lg font-semibold">Add New Key</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.AppField name="name">
            {(field) => (
              <field.TextField label="Key ID" placeholder="Key ID" required />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextareaField
                label="Description (optional)"
                placeholder="Description (optional)"
                rows={1}
                className="min-h-2"
              />
            )}
          </form.AppField>
        </div>

        <div className="flex space-x-2">
          <form.AppForm>
            <form.SubmitButton loadingText="Adding...">
              Add Key
            </form.SubmitButton>
          </form.AppForm>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
