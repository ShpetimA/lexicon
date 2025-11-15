import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useConvexAction, useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { toast } from "sonner";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Save, BookmarkPlus } from "lucide-react";
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

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

interface AutoTranslateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: Id<"keys">;
  translations: Doc<"translations">[];
  locales: Locale[];
  appId: Id<"apps">;
}

type TranslationStep = "source" | "sourceText" | "targets" | "instructions" | "translating";

interface TranslationResult {
  locale: string;
  success: boolean;
  error?: string;
}

export function AutoTranslateDrawer({
  open,
  onOpenChange,
  keyId,
  translations,
  locales,
  appId,
}: AutoTranslateDrawerProps) {
  const { data: currentUser } = useQuery(
    convexQuery(api.users.getCurrentUserRecord, {})
  );
  const [step, setStep] = useState<TranslationStep>("source");
  const [sourceLocaleId, setSourceLocaleId] = useState<Id<"locales"> | null>(
    () => locales.find((l) => l.isDefault)?._id ?? null
  );
  const [sourceText, setSourceText] = useState("");
  const [targetLocaleIds, setTargetLocaleIds] = useState<Set<Id<"locales">>>(
    new Set()
  );
  const [instructions, setInstructions] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const autoTranslateMutation = useConvexAction(api.translations.autoTranslate);
  const createTemplateMutation = useConvexMutation(api.instructionTemplates.create);
  const upsertTranslationMutation = useConvexMutation(api.translations.upsert);
  const templates = useConvexQuery(api.instructionTemplates.list, { appId }) ?? [];

  const hasTranslation = (localeId: Id<"locales">) => {
    return translations.some((t) => t.localeId === localeId && t.value);
  };

  const handleNext = () => {
    if (step === "source" && sourceLocaleId) {
      if (!hasTranslation(sourceLocaleId)) {
        setStep("sourceText");
      } else {
        setStep("targets");
      }
    } else if (step === "sourceText" && sourceText.trim()) {
      setStep("targets");
    } else if (step === "targets" && targetLocaleIds.size > 0) {
      setStep("instructions");
    } else if (step === "instructions") {
      handleTranslate();
    }
  };

  const handleBack = () => {
    if (step === "sourceText") {
      setStep("source");
    } else if (step === "targets") {
      if (sourceLocaleId && !hasTranslation(sourceLocaleId)) {
        setStep("sourceText");
      } else {
        setStep("source");
      }
    } else if (step === "instructions") {
      setStep("targets");
    }
  };

  const handleTranslate = async () => {
    if (!sourceLocaleId) return;

    setStep("translating");
    setIsTranslating(true);
    setProgress(0);
    setResults([]);

    try {
      if (sourceText && !hasTranslation(sourceLocaleId) && currentUser) {
        await upsertTranslationMutation({
          keyId,
          localeId: sourceLocaleId,
          value: sourceText,
          updatedBy: currentUser._id,
        });
      }

      const response = await autoTranslateMutation({
        keyId,
        sourceLocaleId,
        targetLocaleIds: Array.from(targetLocaleIds),
        instructions: instructions || undefined,
      });

      setResults(response);
      setProgress(100);

      const successCount = response.filter((r) => r.success).length;
      const failCount = response.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success(`Translated to ${successCount} locales`);
      } else {
        toast.warning(
          `Translated to ${successCount} locales, ${failCount} failed`
        );
      }
    } catch (error) {
      toast.error("Failed to auto-translate");
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleTarget = (localeId: Id<"locales">) => {
    const newSet = new Set(targetLocaleIds);
    if (newSet.has(localeId)) {
      newSet.delete(localeId);
    } else {
      newSet.add(localeId);
    }
    setTargetLocaleIds(newSet);
  };

  const handleSelectAll = () => {
    const availableTargets = locales
      .filter((l) => l._id !== sourceLocaleId)
      .map((l) => l._id);
    setTargetLocaleIds(new Set(availableTargets));
  };

  const handleDeselectAll = () => {
    setTargetLocaleIds(new Set());
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !instructions.trim()) {
      toast.error("Please provide a template name and instructions");
      return;
    }

    try {
      await createTemplateMutation({
        name: templateName,
        instructions: instructions,
        appId,
      });
      toast.success("Template saved successfully");
      setSaveTemplateDialogOpen(false);
      setTemplateName("");
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setInstructions(template.instructions);
    }
  };

  const resetDrawer = () => {
    setStep("source");
    setSourceLocaleId(locales.find((l) => l.isDefault)?._id ?? null);
    setSourceText("");
    setTargetLocaleIds(new Set());
    setInstructions("");
    setSelectedTemplateId("");
    setProgress(0);
    setResults([]);
  };

  const handleClose = () => {
    resetDrawer();
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === "source") return sourceLocaleId !== null;
    if (step === "sourceText") return sourceText.trim().length > 0;
    if (step === "targets") return targetLocaleIds.size > 0;
    return true;
  };

  const getStepTitle = () => {
    switch (step) {
      case "source":
        return "Select Source Language";
      case "sourceText":
        return "Enter Source Text";
      case "targets":
        return "Select Target Languages";
      case "instructions":
        return "AI Instructions (Optional)";
      case "translating":
        return "Translating...";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "source":
        return "Choose the language to translate from";
      case "sourceText":
        return "Provide the text to translate";
      case "targets":
        return "Choose which languages to translate to";
      case "instructions":
        return "Provide context or style preferences for the AI translation";
      case "translating":
        return "Please wait while we translate your content";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full">
        <DrawerHeader>
          <DrawerTitle>{getStepTitle()}</DrawerTitle>
          <DrawerDescription>{getStepDescription()}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          {step === "source" && (
            <RadioGroup
              value={sourceLocaleId ?? undefined}
              onValueChange={(value) =>
                setSourceLocaleId(value as Id<"locales">)
              }
            >
              {locales.map((locale) => (
                <div
                  key={locale._id}
                  className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50"
                >
                  <RadioGroupItem value={locale._id} id={locale._id} />
                  <Label htmlFor={locale._id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{locale.code}</span>
                      {locale.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {hasTranslation(locale._id) && (
                        <Badge variant="outline" className="text-xs">
                          Has translation
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {step === "sourceText" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The selected source language does not have a translation yet.
                Please enter the text to translate.
              </p>
              <Textarea
                placeholder={`Enter text in ${locales.find((l) => l._id === sourceLocaleId)?.code}...`}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={10}
                className="resize-none"
              />
            </div>
          )}

          {step === "targets" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
              </div>
              <div className="space-y-2">
                {locales
                  .filter((l) => l._id !== sourceLocaleId)
                  .map((locale) => (
                    <div
                      key={locale._id}
                      className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50"
                    >
                      <Checkbox
                        id={`target-${locale._id}`}
                        checked={targetLocaleIds.has(locale._id)}
                        onCheckedChange={() => handleToggleTarget(locale._id)}
                      />
                      <Label
                        htmlFor={`target-${locale._id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{locale.code}</span>
                          {hasTranslation(locale._id) && (
                            <Badge variant="destructive" className="text-xs">
                              Will overwrite
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {step === "instructions" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                  <SelectTrigger className="flex-1">
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
                These instructions will help guide the AI to translate in the
                style and tone you prefer. You can skip this step if you want
                standard translations.
              </p>
            </div>
          )}

          {step === "translating" && (
            <div className="space-y-4">
              <Progress value={progress} />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <span className="font-medium">{result.locale}</span>
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-destructive">
                          {result.error}
                        </span>
                        <XCircle className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                  </div>
                ))}
                {isTranslating && results.length === 0 && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex gap-2 w-full">
            {step !== "source" && step !== "translating" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step !== "translating" && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1"
              >
                {step === "instructions" ? "Translate" : "Next"}
              </Button>
            )}
            {step === "translating" && !isTranslating && (
              <Button type="button" onClick={handleClose} className="flex-1">
                Done
              </Button>
            )}
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isTranslating}
              >
                {step === "translating" && !isTranslating ? "Close" : "Cancel"}
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>

      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
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
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}
