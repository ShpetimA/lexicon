import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useTenant } from "../../../contexts/TenantContext";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const CreateLocaleSchema = z.object({
  code: z.string().min(1, "Locale code is required"),
  isDefault: z.boolean(),
});

type CreateLocaleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateLocaleDialog({ open, onOpenChange }: CreateLocaleDialogProps) {
  const { selectedApp } = useTenant();
  const form = useForm({
    resolver: zodResolver(CreateLocaleSchema),
    defaultValues: {
      code: "",
      isDefault: false,
    },
  });

  const createLocale = useMutation(api.locales.create);

  const handleCreate = form.handleSubmit(async (data) => {
    if (!selectedApp) {
      toast.error("No app selected");
      return;
    }
    try {
      await createLocale({
        appId: selectedApp._id,
        code: data.code,
        isDefault: data.isDefault,
      });
      toast.success("Locale created successfully");
      onOpenChange(false);
      form.reset({ code: "", isDefault: false });
    } catch {
      toast.error("Failed to add locale");
    }
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
        <Form {...form}>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locale Code</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., en, fr, en-US"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Set as default locale</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Adding..." : "Add Locale"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

