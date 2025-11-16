import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { useBulkActions } from "./context";

export function CopyTargetStep() {
  const { locales, sourceLocaleId, copyTargetLocaleId, setCopyTargetLocaleId } = useBulkActions();

  return (
    <RadioGroup
      value={copyTargetLocaleId ?? undefined}
      onValueChange={(value) => setCopyTargetLocaleId(value as Id<"globalLocales">)}
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
  );
}
