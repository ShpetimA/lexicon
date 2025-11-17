import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { useBulkActions } from "./context";
import LocaleCheckbox from "@/src/routes/_authed/_customer/selectedApp/-editor/BulkActionsDrawer/components/LocaleCheckbox";

export function TargetLocalesStep() {
  const { locales, sourceLocaleId, targetLocaleIds, setTargetLocaleIds } =
    useBulkActions();

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
            <LocaleCheckbox
              key={locale._id}
              labelProps={{
                htmlFor: `target-${locale._id}`,
                children: <span className="font-medium">{locale.code}</span>,
              }}
              checkboxProps={{
                id: `target-${locale._id}`,
                checked: targetLocaleIds.has(locale._id),
                onCheckedChange: () => handleToggleTarget(locale._id),
              }}
            />
          ))}
      </div>
    </div>
  );
}
