import { useState, useEffect } from "react";
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
import {
  useConvexAction,
  useConvexMutation,
  useConvexQuery,
} from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type BulkActionType = "translateAll" | "fillMissing" | "copyLocale";

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

interface BulkActionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: Id<"apps">;
  locales: Locale[];
  totalKeys: number;
  initialAction: BulkActionType | null;
}

type StepType =
  | "action"
  | "source"
  | "targets"
  | "copyTarget"
  | "instructions"
  | "confirm"
  | "processing";

interface BulkResult {
  keyName: string;
  locale?: string;
  success: boolean;
  error?: string;
}

export function BulkActionsDrawer({
  open,
  onOpenChange,
  appId,
  locales,
  totalKeys,
  initialAction,
}: BulkActionsDrawerProps) {
  const [step, setStep] = useState<StepType>("action");
  const [actionType, setActionType] = useState<BulkActionType | null>(
    initialAction,
  );
  const [sourceLocaleId, setSourceLocaleId] = useState<Id<"locales"> | null>(
    () => locales.find((l) => l.isDefault)?._id ?? null,
  );
  const [targetLocaleIds, setTargetLocaleIds] = useState<Set<Id<"locales">>>(
    new Set(),
  );
  const [copyTargetLocaleId, setCopyTargetLocaleId] =
    useState<Id<"locales"> | null>(null);
  const [instructions, setInstructions] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkResult[]>([]);

  const bulkTranslateAction = useConvexAction(
    api.translations.bulkAutoTranslate,
  );
  const copyLocaleMutation = useConvexMutation(api.translations.copyLocale);
  const templates =
    useConvexQuery(api.instructionTemplates.list, { appId }) ?? [];

  useEffect(() => {
    if (initialAction) {
      setActionType(initialAction);
      setStep(getFirstStep(initialAction));
    }
  }, [initialAction]);

  const getFirstStep = (action: BulkActionType): StepType => {
    if (action === "copyLocale") return "source";
    return "source";
  };

  const handleNext = () => {
    if (!actionType) return;

    if (step === "action" && actionType) {
      setStep(getFirstStep(actionType));
    } else if (step === "source") {
      if (actionType === "copyLocale") {
        setStep("copyTarget");
      } else {
        setStep("targets");
      }
    } else if (step === "copyTarget") {
      setStep("confirm");
    } else if (step === "targets") {
      setStep("instructions");
    } else if (step === "instructions") {
      setStep("confirm");
    } else if (step === "confirm") {
      handleExecute();
    }
  };

  const handleBack = () => {
    if (step === "source") {
      setStep("action");
    } else if (step === "copyTarget") {
      setStep("source");
    } else if (step === "targets") {
      setStep("source");
    } else if (step === "instructions") {
      setStep("targets");
    } else if (step === "confirm") {
      if (actionType === "copyLocale") {
        setStep("copyTarget");
      } else {
        setStep("instructions");
      }
    }
  };

  const handleExecute = async () => {
    if (!actionType || !sourceLocaleId) return;

    setStep("processing");
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      if (actionType === "copyLocale") {
        if (!copyTargetLocaleId) return;

        await copyLocaleMutation({
          appId,
          sourceLocaleId,
          targetLocaleId: copyTargetLocaleId,
        });

        setProgress(100);
        toast.success("Locale copied successfully");
        setResults([{ keyName: "All keys", success: true }]);
      } else {
        // Translate actions
        const response = await bulkTranslateAction({
          appId,
          sourceLocaleId,
          targetLocaleIds: Array.from(targetLocaleIds),
          actionType,
          instructions: instructions || undefined,
        });

        setResults(response);
        setProgress(100);

        const successCount = response.filter((r) => r.success).length;
        const failCount = response.filter((r) => !r.success).length;

        if (failCount === 0) {
          toast.success(`Completed ${successCount} translations`);
        } else {
          toast.warning(
            `Completed ${successCount} translations, ${failCount} failed`,
          );
        }
      }
    } catch (error) {
      toast.error("Bulk operation failed");
      console.error(error);
    } finally {
      setIsProcessing(false);
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

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setInstructions(template.instructions);
    }
  };

  const resetDrawer = () => {
    setStep("action");
    setActionType(null);
    setSourceLocaleId(locales.find((l) => l.isDefault)?._id ?? null);
    setTargetLocaleIds(new Set());
    setCopyTargetLocaleId(null);
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
    if (step === "action") return actionType !== null;
    if (step === "source") return sourceLocaleId !== null;
    if (step === "copyTarget") return copyTargetLocaleId !== null;
    if (step === "targets") {
      return targetLocaleIds.size > 0;
    }
    return true;
  };

  const getStepTitle = () => {
    switch (step) {
      case "action":
        return "Select Bulk Action";
      case "source":
        return "Select Source Language";
      case "copyTarget":
        return "Select Target Language";
      case "targets":
        return "Select Target Languages";
      case "instructions":
        return "AI Instructions (Optional)";
      case "confirm":
        return "Confirm Bulk Action";
      case "processing":
        return "Processing...";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "action":
        return "Choose the type of bulk operation to perform";
      case "source":
        return actionType === "copyLocale"
          ? "Choose the language to copy from"
          : "Choose the language to translate from";
      case "copyTarget":
        return "Choose the language to copy to";
      case "targets":
        return "Choose which languages to translate to";
      case "instructions":
        return "Provide context or style preferences for the AI translation";
      case "confirm":
        return "Review and confirm your bulk action";
      case "processing":
        return "Please wait while we process your request";
    }
  };

  const getActionDescription = (action: BulkActionType) => {
    switch (action) {
      case "translateAll":
        return "Translate all keys to selected locales";
      case "fillMissing":
        return "Only translate keys with missing translations";
      case "copyLocale":
        return "Copy all translations from one locale to another";
    }
  };

  const getConfirmationMessage = () => {
    if (!actionType) return "";

    const actionDesc = getActionDescription(actionType);
    const sourceLocale = locales.find((l) => l._id === sourceLocaleId);

    if (actionType === "copyLocale") {
      const targetLocale = locales.find((l) => l._id === copyTargetLocaleId);
      return `Copy ${totalKeys} keys from ${sourceLocale?.code} to ${targetLocale?.code}. This will overwrite existing translations.`;
    }

    const targetCount = targetLocaleIds.size;
    const estimatedTranslations = totalKeys * targetCount;

    return `${actionDesc} - Source: ${sourceLocale?.code}, Targets: ${targetCount} locale(s), Estimated translations: ${estimatedTranslations}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full">
        <DrawerHeader>
          <DrawerTitle>{getStepTitle()}</DrawerTitle>
          <DrawerDescription>{getStepDescription()}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          {step === "action" && (
            <RadioGroup
              value={actionType ?? undefined}
              onValueChange={(value) => setActionType(value as BulkActionType)}
            >
              <div className="space-y-3">
                <div
                  className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 cursor-pointer"
                  onClick={() => setActionType("translateAll")}
                >
                  <RadioGroupItem value="translateAll" id="translateAll" />
                  <Label
                    htmlFor="translateAll"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Translate All Keys</span>
                      <span className="text-sm text-muted-foreground">
                        Auto-translate all {totalKeys} keys to selected locales
                      </span>
                    </div>
                  </Label>
                </div>

                <div
                  className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 cursor-pointer"
                  onClick={() => setActionType("fillMissing")}
                >
                  <RadioGroupItem value="fillMissing" id="fillMissing" />
                  <Label
                    htmlFor="fillMissing"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        Fill Missing Translations
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Only translate keys that are missing translations
                      </span>
                    </div>
                  </Label>
                </div>

                <div
                  className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 cursor-pointer"
                  onClick={() => setActionType("copyLocale")}
                >
                  <RadioGroupItem value="copyLocale" id="copyLocale" />
                  <Label htmlFor="copyLocale" className="flex-1 cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        Copy Locale to Another
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Duplicate all translations from one locale to another
                      </span>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          )}

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
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {step === "copyTarget" && (
            <RadioGroup
              value={copyTargetLocaleId ?? undefined}
              onValueChange={(value) =>
                setCopyTargetLocaleId(value as Id<"locales">)
              }
            >
              {locales
                .filter((l) => l._id !== sourceLocaleId)
                .map((locale) => (
                  <div
                    key={locale._id}
                    className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50"
                  >
                    <RadioGroupItem
                      value={locale._id}
                      id={`target-${locale._id}`}
                    />
                    <Label
                      htmlFor={`target-${locale._id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{locale.code}</span>
                        <Badge variant="destructive" className="text-xs">
                          Will overwrite
                        </Badge>
                      </div>
                    </Label>
                  </div>
                ))}
            </RadioGroup>
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
                      <>
                        <Checkbox
                          id={`target-${locale._id}`}
                          checked={targetLocaleIds.has(locale._id)}
                          onCheckedChange={() => handleToggleTarget(locale._id)}
                        />
                        <Label
                          htmlFor={`target-${locale._id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">{locale.code}</span>
                        </Label>
                      </>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {step === "instructions" && (
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
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Confirm Bulk Action</AlertTitle>
                <AlertDescription>{getConfirmationMessage()}</AlertDescription>
              </Alert>

              {actionType !== "copyLocale" && actionType !== "translateAll" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This action will overwrite existing translations.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Action:</span>
                  <span className="font-medium">
                    {actionType && getActionDescription(actionType)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Source:</span>
                  <span className="font-medium">
                    {locales.find((l) => l._id === sourceLocaleId)?.code}
                  </span>
                </div>
                {actionType === "copyLocale" ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">
                      {locales.find((l) => l._id === copyTargetLocaleId)?.code}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Targets:</span>
                    <span className="font-medium">
                      {targetLocaleIds.size} locale(s)
                    </span>
                  </div>
                )}
                {instructions && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Instructions:</span>
                    <span className="font-medium">Yes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="space-y-4">
              <Progress value={progress} />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {result.keyName}
                      </span>
                      {result.locale && (
                        <span className="text-xs text-muted-foreground">
                          {result.locale}
                        </span>
                      )}
                    </div>
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
                {isProcessing && results.length === 0 && (
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
            {step !== "action" && step !== "processing" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step !== "processing" && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1"
              >
                {step === "confirm" ? "Execute" : "Next"}
              </Button>
            )}
            {step === "processing" && !isProcessing && (
              <Button type="button" onClick={handleClose} className="flex-1">
                Done
              </Button>
            )}
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                {step === "processing" && !isProcessing ? "Close" : "Cancel"}
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
