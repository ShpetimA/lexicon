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
import { useTenant } from "../../../contexts/TenantContext";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const CreateEnvironmentSchema = z.object({
  name: z.string().min(1, "Environment name is required").max(50, "Environment name must be less than 50 characters"),
});

type CreateEnvironmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateEnvironmentDialog({ open, onOpenChange }: CreateEnvironmentDialogProps) {
  const { selectedApp } = useTenant();
  const form = useForm({
    resolver: zodResolver(CreateEnvironmentSchema),
    defaultValues: {
      name: "",
    },
  });

  const createEnvironment = useMutation(api.environments.create);

  const handleCreate = form.handleSubmit(async (data) => {
    if (!selectedApp) {
      toast.error("No app selected");
      return;
    }
    try {
      await createEnvironment({
        name: data.name,
        appId: selectedApp._id,
      });
      toast.success("Environment created successfully");
      onOpenChange(false);
      form.reset({ name: "" });
    } catch {
      toast.error("Failed to create environment");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Environment</DialogTitle>
          <DialogDescription>
            Add a new deployment environment for your app (e.g., "dev", "staging", "prod").
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleCreate} className="space-y-4">
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creating..." : "Add Environment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

