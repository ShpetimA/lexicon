import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { useAppForm } from "@/src/hooks/useAppForm";

const keySchema = z.object({
  name: z.string().min(1, "Key ID is required"),
  description: z.string(),
});

type Key = {
  _id: Id<"keys">;
  name: string;
  description?: string;
  appId: Id<"apps">;
  createdAt: number;
};

type EditTranslationKeyDialogProps = {
  open: boolean;
  translationKey: Key;
  onOpenChange: (open: boolean) => void;
};

export function EditTranslationKeyDialog({
  open,
  translationKey,
  onOpenChange,
}: EditTranslationKeyDialogProps) {
  const updateKey = useMutation(api.keys.update);

  const form = useAppForm({
    defaultValues: {
      name: translationKey.name,
      description: translationKey.description || "",
    },
    validators: {
      onChange: keySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateKey({
          id: translationKey._id,
          name: value.name.trim(),
          description: value.description?.trim() || undefined,
        });

        toast.success("Key updated successfully");
        onOpenChange(false);
      } catch (error) {
        toast.error("Failed to update key");
        console.error("Update key error:", error);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Translation Key</DialogTitle>
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
                label="Key ID"
                placeholder="Enter key ID"
                required
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextareaField
                label="Description (optional)"
                placeholder="Enter description"
                rows={3}
              />
            )}
          </form.AppField>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Updating...">Update Key</form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
