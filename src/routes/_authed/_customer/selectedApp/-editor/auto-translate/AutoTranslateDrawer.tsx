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
import { useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { toast } from "sonner";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  AutoTranslateProvider,
  useAutoTranslate,
  type Locale,
} from "./context";
import { SourceStep } from "./SourceStep";
import { SourceTextStep } from "./SourceTextStep";
import { TargetsStep } from "./TargetsStep";
import { InstructionsStep } from "./InstructionsStep";
import { TranslatingStep } from "./TranslatingStep";

interface AutoTranslateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: Id<"keys">;
  translations: Doc<"translations">[];
  locales: Locale[];
  appId: Id<"apps">;
}

function AutoTranslateDrawerContent({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const {
    step,
    setStep,
    sourceLocaleId,
    sourceTextRef,
    targetLocaleIds,
    instructionsRef,
    isTranslating,
    setIsTranslating,
    setProgress,
    setResults,
    keyId,
    hasTranslation,
    resetDrawer,
  } = useAutoTranslate();

  const { data: currentUser } = useQuery(
    convexQuery(api.users.getCurrentUserRecord, {}),
  );

  const autoTranslateMutation = useConvexAction(api.translations.autoTranslate);
  const { mutateAsync: autoTranslate } = useMutation({
    mutationFn: async (args: Parameters<typeof autoTranslateMutation>[0]) => {
      return await autoTranslateMutation(args);
    },
    onError: () => {
      toast.error("Failed to auto-translate");
    },
  });

  const { mutateAsync: upsertTranslation } = useMutation({
    mutationFn: useConvexMutation(api.translations.upsert),
    onError: () => {
      toast.error("Failed to upsert translation");
    },
  });

  const handleNext = () => {
    if (step === "source" && sourceLocaleId) {
      if (!hasTranslation(sourceLocaleId)) {
        setStep("sourceText");
      } else {
        setStep("targets");
      }
    } else if (step === "sourceText" && sourceTextRef.current.trim()) {
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
      if (
        sourceTextRef.current &&
        !hasTranslation(sourceLocaleId) &&
        currentUser
      ) {
        await upsertTranslation({
          keyId,
          localeId: sourceLocaleId,
          value: sourceTextRef.current,
        });
      }

      const response = await autoTranslate({
        keyId,
        sourceLocaleId,
        targetLocaleIds: Array.from(targetLocaleIds),
        instructions: instructionsRef.current || undefined,
      });

      setResults(response);
      setProgress(100);

      const successCount = response.filter((r) => r.success).length;
      const failCount = response.filter((r) => !r.success).length;
      const reviewCount = response.filter((r) => r.requiresReview).length;

      if (failCount === 0) {
        if (reviewCount > 0) {
          toast.success(
            `Submitted ${reviewCount} translations for review, ${successCount - reviewCount} saved directly`,
          );
        } else {
          toast.success(`Translated to ${successCount} locales`);
        }
      } else {
        toast.warning(
          `Translated to ${successCount} locales, ${failCount} failed`,
        );
      }
    } catch (error) {
      toast.error("Failed to auto-translate");
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleClose = () => {
    resetDrawer();
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === "source") return sourceLocaleId !== null;
    if (step === "sourceText") return sourceTextRef.current.trim().length > 0;
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

  const StepContent = () => {
    switch (step) {
      case "source":
        return <SourceStep />;
      case "sourceText":
        return <SourceTextStep />;
      case "targets":
        return <TargetsStep />;
      case "instructions":
        return <InstructionsStep />;
      case "translating":
        return <TranslatingStep />;
    }
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{getStepTitle()}</DrawerTitle>
        <DrawerDescription>{getStepDescription()}</DrawerDescription>
      </DrawerHeader>

      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        <StepContent />
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
    </>
  );
}

export function AutoTranslateDrawer({
  open,
  onOpenChange,
  keyId,
  translations,
  locales,
  appId,
}: AutoTranslateDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full">
        <AutoTranslateProvider
          keyId={keyId}
          translations={translations}
          locales={locales}
          appId={appId}
        >
          <AutoTranslateDrawerContent onOpenChange={onOpenChange} />
        </AutoTranslateProvider>
      </DrawerContent>
    </Drawer>
  );
}
