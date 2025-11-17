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
import { api } from "@/convex/_generated/api";
import { useAppForm } from "@/src/hooks/useAppForm";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";
import { FieldError, FieldLabel } from "@/components/ui/field";

const localeSchema = z.object({
  localeId: z.string().min(1, "Please select a locale"),
  isDefault: z.boolean(),
});

type CreateLocaleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateLocaleDialog({
  open,
  onOpenChange,
}: CreateLocaleDialogProps) {
  const { selectedApp } = useApp();
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.locales.create),
    onError: () => {
      toast.error("Failed to create locale");
    },
  });

  const { data: globalLocales } = useQuery({
    ...convexQuery(api.locales.listGlobal, {}),
  });
  const { data: appLocales } = useQuery({
    ...convexQuery(api.locales.list, {
      appId: selectedApp._id,
    }),
  });

  const availableLocales =
    globalLocales?.filter(
      (gl) => !appLocales?.some((al) => al._id === gl._id),
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
      await mutateAsync({
        appId: selectedApp._id,
        localeId: value.localeId as Id<"globalLocales">,
        isDefault: value.isDefault,
      });
      toast.success("Locale added successfully");
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Locale</DialogTitle>
          <DialogDescription>
            Add a new locale for your app. Use BCP 47 format (e.g., "en", "fr",
            "en-US").
          </DialogDescription>
        </DialogHeader>
        <form.Form onSubmit={form.handleSubmit}>
          <form.AppField name="localeId">
            {(field) => (
              <div className="space-y-2">
                <FieldLabel className="text-sm font-medium">Locale</FieldLabel>
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
                  <FieldError errors={field.state.meta.errors} />
                )}
              </div>
            )}
          </form.AppField>

          <form.AppField name="isDefault">
            {(field) => <field.CheckboxField label="Set as default locale" />}
          </form.AppField>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Adding...">
                Add Locale
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form.Form>
      </DialogContent>
    </Dialog>
  );
}
