import { LocaleTranslationRow } from "./LocaleTranslationRow";
import { TranslationKeyActions } from "./TranslationKeyActions";
import { AutoTranslateButton } from "./AutoTranslateButton";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type TranslationStatus = "idle" | "pending" | "success" | "error";

type Key = {
  _id: Id<"keys">;
  name: string;
  description?: string;
  appId: Id<"apps">;
  createdAt: number;
};

type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  appLocaleId: Id<"appLocales">;
  addedAt: number;
};

type Translation = {
  _id: Id<"translations">;
  value: string;
  keyId: Id<"keys">;
  localeId: Id<"globalLocales">;
  updatedBy: Id<"users">;
  updatedAt: number;
};

interface TranslationKeyCardProps {
  translationKey: Key;
  locales: Locale[];
  translations: {
    key: Doc<"keys">;
    translations: Doc<"translations">[];
  };
  translationStatuses: Record<string, TranslationStatus>;
  keyName: string;
  onUpdateTranslation: (localeId: string, value: string) => Promise<{ requiresReview: boolean }>;
  filteredLocales?: Locale[];
  appId: Id<"apps">;
  reviewMap?: Record<string, any>;
  currentUserId?: Id<"users">;
}

export function TranslationKeyCard({
  translationKey,
  locales,
  translations,
  translationStatuses,
  keyName,
  onUpdateTranslation,
  filteredLocales,
  appId,
  reviewMap,
  currentUserId,
}: TranslationKeyCardProps) {
  const displayLocales =
    filteredLocales && filteredLocales.length > 0 ? filteredLocales : locales;

  return (
    <div className="border-b last:border-b-0">
      <div className="flex sticky top-0 items-center gap-3 bg-muted px-4 py-3">
        <span className="font-mono text-sm flex-1">{translationKey.name}</span>
        <AutoTranslateButton
          keyId={translationKey._id}
          translations={translations.translations}
          locales={locales}
          appId={appId}
        />
        <TranslationKeyActions translationKey={translationKey} />
      </div>

      <div className="bg-background">
        {displayLocales.map((locale) => {
          const translation = translations.translations.find(
            (t) => t.localeId === locale._id,
          );
          const statusKey = `${keyName}-${locale._id}`;
          const status = translationStatuses[statusKey] || "idle";

           const reviewKey = `${translationKey._id}-${locale._id}`;
           const reviews = reviewMap?.[reviewKey];

           return (
             <LocaleTranslationRow
               key={locale._id}
               locale={locale}
               translation={translation}
               status={status}
               onSave={onUpdateTranslation}
               reviews={reviews}
               currentUserId={currentUserId}
             />
           );
        })}
      </div>
    </div>
  );
}
