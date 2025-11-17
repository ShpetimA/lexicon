import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useBulkActions } from "./context";
import { BookmarkPlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";

export function InstructionsStep() {
  const { appId, instructions, setInstructions } = useBulkActions();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const { data: templates } = useQuery(
    convexQuery(api.instructionTemplates.list, { appId }),
  );
  const templateMutation = useConvexMutation(api.instructionTemplates.create);
  const { mutateAsync: createTemplate, isPending: isSavingTemplate } =
    useMutation({
      mutationFn: async (args: Parameters<typeof templateMutation>[0]) => {
        return await templateMutation(args);
      },
      onError: () => {
        toast.error("Failed to create template");
      },
    });

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates?.find((t) => t._id === templateId);
    if (template) {
      setInstructions(template.instructions);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !instructions.trim()) {
      toast.error("Please provide a template name and instructions");
      return;
    }

    await createTemplate({
      name: templateName,
      instructions: instructions,
      appId,
    });
    toast.success("Template saved successfully");
    setSaveTemplateDialogOpen(false);
    setTemplateName("");
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Select
            value={selectedTemplateId}
            onValueChange={handleSelectTemplate}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((template) => (
                <SelectItem key={template._id} value={template._id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {instructions && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSaveTemplateDialogOpen(true)}
              title="Save as template"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Textarea
          placeholder="e.g., Use informal tone, Keep technical terms in English, Use gender-neutral language..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          These instructions will help guide the AI to translate in the style
          and tone you prefer.
        </p>
      </div>

      <Dialog
        open={saveTemplateDialogOpen}
        onOpenChange={setSaveTemplateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Save these instructions as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Informal Tone, Technical Documentation"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
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
              onClick={() => setSaveTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveTemplate}>
              {isSavingTemplate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
