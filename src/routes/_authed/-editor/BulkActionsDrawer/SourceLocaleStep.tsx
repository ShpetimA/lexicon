import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { useBulkActions } from "./context";

export function SourceLocaleStep() {
  const { locales, sourceLocaleId, setSourceLocaleId } = useBulkActions();

  return (
    <RadioGroup
      value={sourceLocaleId ?? undefined}
      onValueChange={(value) => setSourceLocaleId(value as Id<"globalLocales">)}
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
  );
}
