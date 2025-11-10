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
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const UpdateLocaleSchema = z.object({
  code: z.string().min(1, "Locale code is required").optional(),
  isDefault: z.boolean().optional(),
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
  const form = useForm({
    resolver: zodResolver(UpdateLocaleSchema),
    defaultValues: {
      code: locale?.code,
      isDefault: locale?.isDefault,
    },
  });

  const updateLocale = useMutation(api.locales.update);

  const handleUpdate = form.handleSubmit(async (data) => {
    if (!locale) return;
    try {
      await updateLocale({
        id: locale._id,
        code: data.code,
        isDefault: data.isDefault,
      });
      toast.success("Locale updated successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update locale");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Locale</DialogTitle>
          <DialogDescription>Update the locale settings.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleUpdate} className="space-y-4">
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
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isDefault"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                      />
                      <FormLabel htmlFor="isDefault">
                        Set as default locale
                      </FormLabel>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
