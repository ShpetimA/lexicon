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

const localeSchema = z.object({
  code: z.string().min(1, "Locale code is required"),
  isDefault: z.boolean(),
});

type CreateLocaleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateLocaleDialog({ open, onOpenChange }: CreateLocaleDialogProps) {
  const { selectedApp } = useTenant();
  const createLocale = useMutation(api.locales.create);

  const form = useAppForm({
    defaultValues: {
      code: "",
      isDefault: false,
    },
    validators: {
      onChange: localeSchema,
    },
    onSubmit: async ({ value }) => {
      if (!selectedApp) {
        toast.error("No app selected");
        return;
      }
      try {
        await createLocale({
          appId: selectedApp._id,
          code: value.code,
          isDefault: value.isDefault,
        });
        toast.success("Locale created successfully");
        onOpenChange(false);
        form.reset();
      } catch {
        toast.error("Failed to add locale");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Locale</DialogTitle>
          <DialogDescription>
            Add a new locale for your app. Use BCP 47 format (e.g., "en",
            "fr", "en-US").
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.AppField name="code">
            {(field) => (
              <field.TextField
                label="Locale Code"
                placeholder="e.g., en, fr, en-US"
                required
              />
            )}
          </form.AppField>

          <form.AppField name="isDefault">
            {(field) => (
              <field.CheckboxField label="Set as default locale" />
            )}
          </form.AppField>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Adding...">Add Locale</form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

