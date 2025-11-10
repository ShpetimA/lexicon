import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTenant } from "@/src/contexts/TenantContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const CreateKeySchema = z.object({
  name: z.string().min(1, "Key ID is required"),
  description: z.string().optional(),
});

type AddKeyFormProps = {
  onCreated: () => void;
  onCancel: () => void;
};

export function AddKeyForm({ onCreated, onCancel }: AddKeyFormProps) {
  const { selectedApp } = useTenant();
  const form = useForm({
    resolver: zodResolver(CreateKeySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createKey = useMutation(api.keys.create);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!selectedApp) {
      toast.error("No app selected");
      return;
    }
    try {
      await createKey({
        appId: selectedApp._id,
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
      });
      toast.success("Key added successfully");
      form.reset();
      onCreated();
    } catch {
      toast.error("Failed to add key", {
        description: "Please try again later",
      });
    }
  });

  return (
    <div className="p-4 border rounded-md bg-muted/50 space-y-4">
      <h3 className="text-lg font-semibold">Add New Key</h3>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Key ID" {...field} />
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
                      placeholder="Description (optional)"
                      rows={1}
                      className="min-h-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Adding..." : "Add Key"}
            </Button>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

