import { RadioGroup } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { useBulkActions } from "./context";
import LocaleRadioButton from "./components/LocaleRadioButton";

export function SourceLocaleStep() {
  const { locales, sourceLocaleId, setSourceLocaleId } = useBulkActions();

  return (
    <RadioGroup
      value={sourceLocaleId ?? undefined}
      onValueChange={(value) => setSourceLocaleId(value as Id<"globalLocales">)}
    >
      {locales.map((locale) => (
        <LocaleRadioButton
          key={locale._id}
          labelProps={{
            htmlFor: locale._id,
            children: (
              <div className="flex items-center gap-2">
                <span className="font-medium">{locale.code}</span>
                {locale.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
            ),
          }}
          radioGroupItemProps={{
            value: locale._id,
            id: locale._id,
          }}
        />
      ))}
    </RadioGroup>
  );
}
