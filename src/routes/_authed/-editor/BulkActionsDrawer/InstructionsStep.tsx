import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConvexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useBulkActions } from "./context";

export function InstructionsStep() {
  const { appId, instructions, setInstructions } = useBulkActions();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  
  const templates = useConvexQuery(api.instructionTemplates.list, { appId }) ?? [];

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setInstructions(template.instructions);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        value={selectedTemplateId}
        onValueChange={handleSelectTemplate}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a template (optional)" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template._id} value={template._id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        placeholder="e.g., Use informal tone, Keep technical terms in English, Use gender-neutral language..."
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={6}
        className="resize-none"
      />
      <p className="text-sm text-muted-foreground">
        These instructions will help guide the AI to translate in the
        style and tone you prefer.
      </p>
    </div>
  );
}
