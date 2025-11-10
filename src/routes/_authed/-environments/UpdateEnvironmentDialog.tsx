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
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const UpdateEnvironmentSchema = z.object({
  name: z.string().min(1, "Environment name is required").max(50, "Environment name must be less than 50 characters"),
});

type Environment = {
  _id: Id<"environments">;
  name: string;
  appId: Id<"apps">;
  createdAt: number;
};

type UpdateEnvironmentDialogProps = {
  open: boolean;
  environment: Environment | null;
  onOpenChange: (open: boolean) => void;
};

export function UpdateEnvironmentDialog({ open, environment, onOpenChange }: UpdateEnvironmentDialogProps) {
  const form = useForm({
    resolver: zodResolver(UpdateEnvironmentSchema),
    defaultValues: {
      name: environment?.name ?? "",
    },
  });

  const updateEnvironment = useMutation(api.environments.update);

  const handleUpdate = form.handleSubmit(async (data) => {
    if (!environment) return;
    try {
      await updateEnvironment({
        id: environment._id,
        name: data.name,
      });
      toast.success("Environment updated successfully");
      onOpenChange(false);
      form.reset({ name: "" });
    } catch {
      toast.error("Failed to update environment");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Environment</DialogTitle>
          <DialogDescription>Update the environment settings.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., dev, staging, prod"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

