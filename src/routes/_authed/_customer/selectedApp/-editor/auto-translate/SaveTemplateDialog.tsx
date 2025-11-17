import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { z } from "zod";
import { useAppForm } from "@/src/hooks/useAppForm";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useAutoTranslate } from "./context";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
});

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructions: string;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  instructions,
}: SaveTemplateDialogProps) {
  const { appId } = useAutoTranslate();

  const { mutateAsync: createTemplate, isPending } = useMutation({
    mutationFn: useConvexMutation(api.instructionTemplates.create),
    onError: () => {
      toast.error("Failed to create template");
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: templateSchema,
    },
    onSubmit: async ({ value }) => {
      if (!instructions.trim()) {
        toast.error("Please provide instructions");
        return;
      }

      await createTemplate({
        name: value.name,
        instructions: instructions,
        appId,
      });
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Template</DialogTitle>
          <DialogDescription>
            Save these instructions as a reusable template
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-4 py-4">
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label="Template Name"
                  placeholder="e.g., Informal Tone, Technical Documentation"
                  required
                />
              )}
            </form.AppField>
            <div className="space-y-2">
              <Label>Instructions Preview</Label>
              <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                {instructions}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isPending ? "Saving..." : "Save Template"}
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
