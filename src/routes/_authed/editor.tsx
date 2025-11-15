import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TranslationKeyList } from "./-editor/TranslationKeyList";
import { AddKeyForm } from "./-editor/AddKeyForm";
import { ScrapeWebsiteSheet } from "./-editor/ScrapeWebsiteSheet";
import { BulkActionsButton } from "./-editor/BulkActionsButton";
import { useTenant } from "@/src/contexts/TenantContext";
import { toast } from "sonner";
import { Plus, Search, Globe } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import useDebouncedValue from "@/src/hooks/use-debounce";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";

type TranslationStatus = "idle" | "pending" | "success" | "error";

export const Route = createFileRoute("/_authed/editor")({
  component: TranslationEditorPage,
});

function TranslationEditorPage() {
  const { selectedApp } = useTenant();
  
  if (!selectedApp) {
    return <div>No app selected</div>;
  }

  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isScrapeDialogOpen, setIsScrapeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [translationStatuses, setTranslationStatuses] = useState<
    Record<string, TranslationStatus>
  >({});

  const { data: locales } = useQuery(
    convexQuery(api.locales.list, { appId: selectedApp._id }),
  );

  const { data: editorData } = useQuery(
    convexQuery(api.translations.getEditorData, {
      appId: selectedApp._id,
      page: currentPage,
      limit: 10,
      search: debouncedSearchTerm || undefined,
    }),
  );

  const upsertTranslation = useConvexMutation(api.translations.upsert);
  const createBatchWithTranslations = useConvexMutation(
    api.translations.createBatchWithTranslations
  );

  const handleScrapedData = async (
    localeId: Id<"globalLocales">,
    translations: Array<{ keyName: string; value: string }>
  ) => {
    try {
      const result = await createBatchWithTranslations({
        appId: selectedApp._id,
        localeId,
        translations,
      });

      toast.success(
        `Created ${result.keys} keys and ${result.translations} translations`
      );
    } catch (error) {
      toast.error("Failed to import translations");
    }
  };

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
        localeId: localeId as Id<"globalLocales">,
        value,
      });

      setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "success" }));
      setTimeout(() => {
        setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "idle" }));
      }, 600);
    } catch {
      setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "error" }));
      setTimeout(() => {
        setTranslationStatuses((prev) => ({ ...prev, [statusKey]: "idle" }));
      }, 600);
    }
  };

  const keys = editorData?.data
    ? Object.values(editorData.data).map((item) => item.key)
    : [];

  return (
    <>
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
                <BulkActionsButton
                  appId={selectedApp._id}
                  locales={locales || []}
                  totalKeys={editorData?.pagination.total || 0}
                />
                <Button
                  onClick={() => setIsScrapeDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Import from Website
                </Button>
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

          <ScrapeWebsiteSheet
            open={isScrapeDialogOpen}
            onOpenChange={setIsScrapeDialogOpen}
            appId={selectedApp._id}
            locales={locales || []}
            onComplete={handleScrapedData}
          />

          {editorData && (
            <TranslationKeyList
              keys={keys}
              locales={locales || []}
              editorData={editorData}
              translationStatuses={translationStatuses}
              filteredLocales={locales || []}
              onUpdateTranslation={handleUpdateTranslation}
              searchTerm={searchTerm}
              onAddKey={() => setIsAddingKey(true)}
              appId={selectedApp._id}
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
    </>
  );
}
