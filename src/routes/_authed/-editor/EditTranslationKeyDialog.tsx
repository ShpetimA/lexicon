import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const UpdateKeySchema = z.object({
  name: z.string().min(1, "Key ID is required"),
  description: z.string().optional(),
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
  const form = useForm({
    resolver: zodResolver(UpdateKeySchema),
    values: {
      name: translationKey.name,
      description: translationKey.description || "",
    },
  });

  const updateKey = useMutation(api.keys.update);

  const handleUpdate = form.handleSubmit(async (data) => {
    try {
      await updateKey({
        id: translationKey._id,
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
      });

      toast.success("Key updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update key");
      console.error("Update key error:", error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Translation Key</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter key ID"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      rows={3}
                      {...field}
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
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Updating..." : "Update Key"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
