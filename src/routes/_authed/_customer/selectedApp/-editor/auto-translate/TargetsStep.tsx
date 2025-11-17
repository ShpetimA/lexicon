import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { useAutoTranslate } from "./context";

export function TargetsStep() {
  const {
    targetLocaleIds,
    setTargetLocaleIds,
    locales,
    sourceLocaleId,
    hasTranslation,
  } = useAutoTranslate();

  const handleToggleTarget = (localeId: Id<"globalLocales">) => {
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

  return (
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
  );
}
