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
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import type { BulkActionType, Locale, StepType } from "./types";
import { BulkActionsProvider, useBulkActions } from "./context";
import { ActionTypeStep } from "./ActionTypeStep";
import { SourceLocaleStep } from "./SourceLocaleStep";
import { CopyTargetStep } from "./CopyTargetStep";
import { TargetLocalesStep } from "./TargetLocalesStep";
import { InstructionsStep } from "./InstructionsStep";
import { KeySelectionStep } from "./KeySelectionStep";
import { ConfirmStep } from "./ConfirmStep";
import { ProcessingStep } from "./ProcessingStep";

interface BulkActionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: Id<"apps">;
  locales: Locale[];
  totalKeys: number;
  initialAction: BulkActionType | null;
}

function BulkActionsDrawerContent({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const {
    step,
    setStep,
    actionType,
    setActionType,
    sourceLocaleId,
    targetLocaleIds,
    copyTargetLocaleId,
    instructions,
    selectedKeys,
    setIsProcessing,
    setResults,
    appId,
  } = useBulkActions();

  const bulkTranslateAction = useConvexAction(
    api.translations.bulkAutoTranslate,
  );

  const { mutateAsync: bulkTranslate } = useMutation({
    mutationFn: async (args: Parameters<typeof bulkTranslateAction>[0]) => {
      return await bulkTranslateAction(args);
    },
    onError: () => {
      toast.error("Bulk operation failed");
    },
  });
  const { mutateAsync: copyLocale } = useMutation({
    mutationFn: useConvexMutation(api.translations.copyLocale),
    onError: () => {
      toast.error("Locale copy failed");
    },
  });

  const handleExecute = async () => {
    if (!actionType || !sourceLocaleId) return;

    setStep("processing");
    setIsProcessing(true);
    setResults([]);

    try {
      if (actionType === "copyLocale") {
        if (!copyTargetLocaleId) return;

        await copyLocale({
          appId,
          sourceLocaleId,
          targetLocaleId: copyTargetLocaleId,
        });

        toast.success("Locale copied successfully");
        setResults([{ keyName: "All keys", success: true }]);
      } else {
        const response = await bulkTranslate({
          appId,
          sourceLocaleId,
          targetLocaleIds: Array.from(targetLocaleIds),
          actionType,
          instructions: instructions || undefined,
          keyNames:
            selectedKeys.size > 0 ? Array.from(selectedKeys) : undefined,
        });

        setResults(response);

        const successCount = response.filter((r) => r.success).length;
        const failCount = response.filter((r) => !r.success).length;
        const reviewCount = response.filter((r) => r.requiresReview).length;

        if (failCount === 0) {
          if (reviewCount > 0) {
            toast.success(
              `Submitted ${reviewCount} translations for review, ${successCount - reviewCount} saved directly`,
            );
          } else {
            toast.success(`Completed ${successCount} translations`);
          }
        } else {
          toast.warning(
            `Completed ${successCount} translations, ${failCount} failed`,
          );
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDrawer = () => {
    setStep("action");
    setActionType(null);
    onOpenChange(false);
  };

  return (
    <>
      <BulkActionsDrawerHeader step={step} actionType={actionType} />

      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        <StepContent step={step} />
      </div>
      <StepFooter step={step} onExecute={handleExecute} onClose={resetDrawer} />
    </>
  );
}

export function BulkActionsDrawer({
  open,
  onOpenChange,
  appId,
  locales,
  totalKeys,
  initialAction,
}: BulkActionsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full">
        <BulkActionsProvider
          appId={appId}
          locales={locales}
          totalKeys={totalKeys}
          initialAction={initialAction}
        >
          <BulkActionsDrawerContent onOpenChange={onOpenChange} />
        </BulkActionsProvider>
      </DrawerContent>
    </Drawer>
  );
}

const StepFooter = ({
  step,
  onExecute,
  onClose,
}: {
  step: StepType;
  onExecute: () => Promise<void>;
  onClose: () => void;
}) => {
  const {
    actionType,
    setStep,
    sourceLocaleId,
    copyTargetLocaleId,
    targetLocaleIds,
    selectedKeys,
    isProcessing,
  } = useBulkActions();

  const canProceed = () => {
    if (step === "action") return actionType !== null;
    if (step === "source") return sourceLocaleId !== null;
    if (step === "copyTarget") return copyTargetLocaleId !== null;
    if (step === "targets") return targetLocaleIds.size > 0;
    if (step === "keySelection") return selectedKeys.size > 0;
    return true;
  };

  const handleNext = () => {
    if (!actionType) return;

    if (step === "action" && actionType) {
      setStep("source");
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
      setStep("keySelection");
    } else if (step === "keySelection") {
      setStep("confirm");
    } else if (step === "confirm") {
      onExecute();
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
    } else if (step === "keySelection") {
      setStep("instructions");
    } else if (step === "confirm") {
      if (actionType === "copyLocale") {
        setStep("copyTarget");
      } else {
        setStep("keySelection");
      }
    }
  };

  return (
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
          <Button type="button" onClick={onClose} className="flex-1">
            Done
          </Button>
        )}
        <DrawerClose asChild>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            {step === "processing" && !isProcessing ? "Close" : "Cancel"}
          </Button>
        </DrawerClose>
      </div>
    </DrawerFooter>
  );
};

const StepContent = ({ step }: { step: StepType }) => {
  switch (step) {
    case "action":
      return <ActionTypeStep />;
    case "source":
      return <SourceLocaleStep />;
    case "copyTarget":
      return <CopyTargetStep />;
    case "targets":
      return <TargetLocalesStep />;
    case "instructions":
      return <InstructionsStep />;
    case "keySelection":
      return <KeySelectionStep />;
    case "confirm":
      return <ConfirmStep />;
    case "processing":
      return <ProcessingStep />;
  }
};

const BulkActionsDrawerHeader = ({
  step,
  actionType,
}: {
  step: StepType;
  actionType: BulkActionType | null;
}) => {
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
      case "keySelection":
        return "Select Keys";
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
      case "keySelection":
        return "Select which translation keys to process";
      case "confirm":
        return "Review and confirm your bulk action";
      case "processing":
        return "Please wait while we process your request";
    }
  };
  return (
    <DrawerHeader>
      <DrawerTitle>{getStepTitle()}</DrawerTitle>
      <DrawerDescription>{getStepDescription()}</DrawerDescription>
    </DrawerHeader>
  );
};

export type { BulkActionType } from "./types";
