import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Authenticated, useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TranslationKeyList } from "./-editor/TranslationKeyList";
import { AddKeyForm } from "./-editor/AddKeyForm";
import { TranslationActionsMenu } from "./-editor/TranslationActionsMenu";
import { useTenant } from "@/src/contexts/TenantContext";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Simple debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type TranslationStatus = "idle" | "pending" | "success" | "error";

type Key = {
  _id: Id<"keys">;
  name: string;
  description?: string;
  appId: Id<"apps">;
  createdAt: number;
};

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

type Translation = {
  _id: Id<"translations">;
  value: string;
  keyId: Id<"keys">;
  localeId: Id<"locales">;
  updatedBy: Id<"users">;
  updatedAt: number;
};

type TranslationEditorItem = {
  key: Key;
  translations: Translation[];
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
export const Route = createFileRoute("/_authed/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Authenticated>
      <TranslationEditorPage />
    </Authenticated>
  );
}

function TranslationEditorPage() {
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [translationStatuses, setTranslationStatuses] = useState<
    Record<string, TranslationStatus>
  >({});
  const { selectedApp } = useTenant();

  const locales = useQuery(
    api.locales.list,
    selectedApp ? { appId: selectedApp._id } : "skip",
  ) as Locale[] | undefined;

  const editorData = useQuery(
    api.translations.getEditorData,
    selectedApp
      ? {
          appId: selectedApp._id,
          page: currentPage,
          limit: 10,
          search: debouncedSearchTerm || undefined,
        }
      : "skip",
  ) as TranslationEditorResponse | undefined;

  const upsertTranslation = useMutation(api.translations.upsert);

  const handleUpdateTranslation = async (
    keyName: string,
    localeId: string,
    value: string,
  ) => {
    if (!value) return;

    const statusKey = `${keyName}-${localeId}`;
    setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "pending" }));

    const keyData = editorData?.data[keyName];

    if (!keyData) {
      toast.error("Key not found");
      setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "error" }));
      return;
    }

    try {
      await upsertTranslation({
        keyId: keyData.key._id,
        localeId: localeId as Id<"locales">,
        value,
      });

      setTimeout(() => {
        setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "success" }));
        setTimeout(() => {
          setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "idle" }));
        }, 2000);
      }, 600);
    } catch {
      setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "error" }));
      setTimeout(() => {
        setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "idle" }));
      }, 3000);
    }
  };

  const keys = editorData?.data
    ? Object.values(editorData.data).map((item) => item.key)
    : [];

  const filteredLocales =
    selectedLocales.length > 0
      ? locales?.filter((locale) => selectedLocales.includes(locale._id)) || []
      : locales || [];

  return (
    <Authenticated>
      <div className="flex flex-col h-dvh">
        <div className="h-dvh overflow-hidden">
          <div className="border-b bg-muted/50 p-4 flex flex-col gap-4 justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Translation Editor</h1>
              <p className="text-sm text-muted-foreground">
                {editorData?.pagination.total || 0} keys ·{" "}
                {locales?.length || 0} locales
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search keys..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-64"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={() => setIsAddingKey(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Key
                </Button>
              </div>
            </div>
          </div>

          {isAddingKey && (
            <AddKeyForm
              onCreated={() => setIsAddingKey(false)}
              onCancel={() => setIsAddingKey(false)}
            />
          )}

          {editorData && (
            <TranslationKeyList
              keys={keys}
              locales={locales || []}
              editorData={editorData}
              translationStatuses={translationStatuses}
              filteredLocales={filteredLocales}
              onUpdateTranslation={handleUpdateTranslation}
              searchTerm={searchTerm}
              onAddKey={() => setIsAddingKey(true)}
            />
          )}
        </div>
        {editorData?.pagination && editorData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {editorData.pagination.page} of{" "}
              {editorData.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(editorData.pagination.totalPages, prev + 1),
                )
              }
              disabled={currentPage === editorData.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Authenticated>
  );
}
