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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenant } from "../../../contexts/TenantContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAppForm } from "@/src/hooks/useAppForm";
import { Id } from "../../../../convex/_generated/dataModel";

const localeSchema = z.object({
  localeId: z.string().min(1, "Please select a locale"),
  isDefault: z.boolean(),
});

type CreateLocaleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateLocaleDialog({ open, onOpenChange }: CreateLocaleDialogProps) {
  const { selectedApp } = useTenant();
  const createLocale = useMutation(api.locales.create);
  
  const globalLocales = useQuery(api.locales.listGlobal, {});
  const appLocales = useQuery(
    api.locales.list,
    selectedApp ? { appId: selectedApp._id } : "skip"
  );

  // Filter out locales already added to this app
  const availableLocales = globalLocales?.filter(
    (gl) => !appLocales?.some((al) => al._id === gl._id)
  ) ?? [];

  const form = useAppForm({
    defaultValues: {
      localeId: "",
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
          localeId: value.localeId as Id<"globalLocales">,
          isDefault: value.isDefault,
        });
        toast.success("Locale added successfully");
        onOpenChange(false);
        form.reset();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to add locale");
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
          <form.AppField name="localeId">
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Locale</label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a locale" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocales.map((locale) => (
                      <SelectItem key={locale._id} value={locale._id}>
                        {locale.name} ({locale.code}) - {locale.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
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

