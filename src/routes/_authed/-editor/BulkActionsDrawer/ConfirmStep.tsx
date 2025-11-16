import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useBulkActions } from "./context";

const getActionDescription = (action: string) => {
  switch (action) {
    case "translateAll":
      return "Translate all keys to selected locales";
    case "fillMissing":
      return "Only translate keys with missing translations";
    case "copyLocale":
      return "Copy all translations from one locale to another";
    default:
      return "";
  }
};

export function ConfirmStep() {
  const {
    actionType,
    locales,
    sourceLocaleId,
    copyTargetLocaleId,
    targetLocaleIds,
    instructions,
    selectedKeys,
    totalKeys,
  } = useBulkActions();

  if (!actionType) return null;

  const sourceLocale = locales.find((l) => l._id === sourceLocaleId);

  const getConfirmationMessage = () => {
    const keyCount = selectedKeys.size || totalKeys;
    
    if (actionType === "copyLocale") {
      const targetLocale = locales.find((l) => l._id === copyTargetLocaleId);
      return `Copy ${keyCount} key${keyCount !== 1 ? 's' : ''} from ${sourceLocale?.code} to ${targetLocale?.code}. This will overwrite existing translations.`;
    }

    const targetCount = targetLocaleIds.size;
    const estimatedTranslations = keyCount * targetCount;
    const actionDesc = getActionDescription(actionType);

    return `${actionDesc} - Source: ${sourceLocale?.code}, Targets: ${targetCount} locale(s), Estimated translations: ${estimatedTranslations}`;
  };

  return (
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
            {getActionDescription(actionType)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Keys:</span>
          <span className="font-medium">
            {selectedKeys.size > 0 ? `${selectedKeys.size} selected` : `All (${totalKeys})`}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Source:</span>
          <span className="font-medium">{sourceLocale?.code}</span>
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
  );
}
