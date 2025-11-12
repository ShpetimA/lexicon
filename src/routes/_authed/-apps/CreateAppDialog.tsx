import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Field, FieldLabel, FieldError } from "../../../../components/ui/field";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { z } from "zod";

type CreateAppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: Id<"customers">;
};

const CreateAppSchema = z.object({
  name: z.string().min(1, "App name is required"),
});

export function CreateAppDialog({
  open,
  onOpenChange,
  customerId,
}: CreateAppDialogProps) {
  const createApp = useMutation(api.apps.create);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: CreateAppSchema,
    },
    onSubmit: async (data) => {
      try {
        await createApp({
          customerId,
          name: data.value.name.trim(),
        });
        toast.success("App created successfully");
        onOpenChange(false);
        form.reset();
      } catch {
        toast.error("Failed to create app");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create App</DialogTitle>
          <DialogDescription>
            Create a new app for this organization. An API key will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>App Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Enter app name"
                    disabled={form.state.isSubmitting}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
