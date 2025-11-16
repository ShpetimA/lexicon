import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { BulkActionType } from "./types";
import { useBulkActions } from "./context";

export function ActionTypeStep() {
  const { actionType, setActionType, totalKeys } = useBulkActions();

  const handleChange = (value: BulkActionType) => {
    setActionType(value);
  };

  return (
    <RadioGroup
      value={actionType ?? undefined}
      onValueChange={(value) => handleChange(value as BulkActionType)}
    >
      <div className="space-y-3">
        <div
          className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 cursor-pointer"
          onClick={() => handleChange("translateAll")}
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
          onClick={() => handleChange("fillMissing")}
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
          onClick={() => handleChange("copyLocale")}
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
  );
}
