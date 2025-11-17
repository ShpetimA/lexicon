import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookmarkPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useAutoTranslate } from "./context";
import { SaveTemplateDialog } from "./SaveTemplateDialog";

export function InstructionsStep() {
  const { instructionsRef, selectedTemplateIdRef, appId } = useAutoTranslate();

  const [localInstructions, setLocalInstructions] = useState(
    instructionsRef.current,
  );
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);

  const { data: templates } = useQuery(
    convexQuery(api.instructionTemplates.list, { appId }),
  );

  const handleSelectTemplate = (templateId: string) => {
    selectedTemplateIdRef.current = templateId;
    const template = templates?.find((t) => t._id === templateId);
    if (template) {
      instructionsRef.current = template.instructions;
      setLocalInstructions(template.instructions);
    }
  };

  const handleInstructionsChange = (value: string) => {
    instructionsRef.current = value;
    setLocalInstructions(value);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Select
            value={selectedTemplateIdRef.current}
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
          {localInstructions && (
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
          value={localInstructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          These instructions will help guide the AI to translate in the style
          and tone you prefer. You can skip this step if you want standard
          translations.
        </p>
      </div>

      <SaveTemplateDialog
        open={saveTemplateDialogOpen}
        onOpenChange={setSaveTemplateDialogOpen}
        instructions={localInstructions}
      />
    </>
  );
}
