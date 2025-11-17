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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppForm } from "@/src/hooks/useAppForm";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";

const localeSchema = z.object({
  isDefault: z.boolean(),
});

type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  appLocaleId: Id<"appLocales">;
};

type UpdateLocaleDialogProps = {
  open: boolean;
  locale: Locale;
  onOpenChange: (open: boolean) => void;
};

export function UpdateLocaleDialog({
  open,
  locale,
  onOpenChange,
}: UpdateLocaleDialogProps) {
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.locales.update),
    onError: () => {
      toast.error("Failed to update locale");
    },
  });

  const form = useAppForm({
    defaultValues: {
      isDefault: locale?.isDefault ?? false,
    },
    validators: {
      onChange: localeSchema,
    },
    onSubmit: async ({ value }) => {
      await mutateAsync({
        appLocaleId: locale.appLocaleId,
        isDefault: value.isDefault,
      });
      toast.success("Locale updated successfully");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Locale</DialogTitle>
          <DialogDescription>
            Update settings for {locale?.name} ({locale?.code})
          </DialogDescription>
        </DialogHeader>
        <form.Form onSubmit={form.handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Locale</label>
            <div className="text-sm text-muted-foreground">
              {locale?.name} ({locale?.code}) - {locale?.nativeName}
            </div>
          </div>

          <form.AppField name="isDefault">
            {(field) => <field.CheckboxField label="Set as default locale" />}
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
              <form.SubmitButton loadingText="Updating...">
                Update
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form.Form>
      </DialogContent>
    </Dialog>
  );
}
