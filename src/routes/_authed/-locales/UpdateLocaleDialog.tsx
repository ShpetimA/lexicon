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

const localeSchema = z.object({
  code: z.string().min(1, "Locale code is required"),
  isDefault: z.boolean(),
});

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

type UpdateLocaleDialogProps = {
  open: boolean;
  locale: Locale | null;
  onOpenChange: (open: boolean) => void;
};

export function UpdateLocaleDialog({
  open,
  locale,
  onOpenChange,
}: UpdateLocaleDialogProps) {
  const updateLocale = useMutation(api.locales.update);

  const form = useAppForm({
    defaultValues: {
      code: locale?.code ?? "",
      isDefault: locale?.isDefault ?? false,
    },
    validators: {
      onChange: localeSchema,
    },
    onSubmit: async ({ value }) => {
      if (!locale) return;
      try {
        await updateLocale({
          id: locale._id,
          code: value.code,
          isDefault: value.isDefault,
        });
        toast.success("Locale updated successfully");
        onOpenChange(false);
      } catch {
        toast.error("Failed to update locale");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Locale</DialogTitle>
          <DialogDescription>Update the locale settings.</DialogDescription>
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
