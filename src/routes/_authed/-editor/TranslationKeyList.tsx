import { Button } from "@/components/ui/button";
import { TranslationKeyCard } from "./TranslationKeyCard";
import { Search, Plus } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type TranslationStatus = "idle" | "pending" | "success" | "error";

type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  appLocaleId: Id<"appLocales">;
  addedAt: number;
};

type TranslationEditorItem = {
  key: Doc<"keys">;
  translations: Doc<"translations">[];
};

type TranslationEditorResponse = {
  data: Record<string, TranslationEditorItem>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type TranslationKeyListProps = {
  keys: Doc<"keys">[];
  locales: Locale[];
  editorData: TranslationEditorResponse;
  translationStatuses: Record<string, TranslationStatus>;
  filteredLocales: Locale[];
  onUpdateTranslation: (
    keyName: string,
    localeId: string,
    value: string,
  ) => void;
  searchTerm: string;
  onAddKey: () => void;
  appId: Id<"apps">;
  reviewMap?: Record<string, any>;
  currentUserId?: Id<"users">;
};

export function TranslationKeyList({
  keys,
  locales,
  editorData,
  translationStatuses,
  filteredLocales,
  onUpdateTranslation,
  searchTerm,
  onAddKey,
  appId,
  reviewMap,
  currentUserId,
}: TranslationKeyListProps) {
  if (keys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No keys found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {searchTerm
            ? "Try adjusting your search"
            : "Get started by adding your first translation key"}
        </p>
        {!searchTerm && (
          <Button onClick={onAddKey} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Key
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <div className="mb-24">
        {keys.map((key) => {
          const keyData = editorData.data[key.name];
          return (
             <TranslationKeyCard
               key={key.name}
               translationKey={key}
               locales={locales || []}
               translations={keyData}
               translationStatuses={translationStatuses}
               keyName={key.name}
               filteredLocales={filteredLocales}
               onUpdateTranslation={(localeId, value) =>
                 onUpdateTranslation(key.name, localeId, value)
               }
               appId={appId}
               reviewMap={reviewMap}
               currentUserId={currentUserId}
             />
          );
        })}
      </div>
    </div>
  );
}
