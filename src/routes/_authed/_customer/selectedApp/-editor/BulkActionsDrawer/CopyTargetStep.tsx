import { RadioGroup } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { useBulkActions } from "./context";
import LocaleRadioButton from "@/src/routes/_authed/_customer/selectedApp/-editor/BulkActionsDrawer/components/LocaleRadioButton";

export function CopyTargetStep() {
  const { locales, sourceLocaleId, copyTargetLocaleId, setCopyTargetLocaleId } =
    useBulkActions();

  return (
    <RadioGroup
      value={copyTargetLocaleId ?? undefined}
      onValueChange={(value) =>
        setCopyTargetLocaleId(value as Id<"globalLocales">)
      }
    >
      {locales
        .filter((l) => l._id !== sourceLocaleId)
        .map((locale) => (
          <LocaleRadioButton
            key={locale._id}
            labelProps={{
              htmlFor: `target-${locale._id}`,
              children: (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{locale.code}</span>
                  <Badge variant="destructive" className="text-xs">
                    Will overwrite
                  </Badge>
                </div>
              ),
            }}
            radioGroupItemProps={{
              value: locale._id,
              id: `target-${locale._id}`,
            }}
          />
        ))}
    </RadioGroup>
  );
}
