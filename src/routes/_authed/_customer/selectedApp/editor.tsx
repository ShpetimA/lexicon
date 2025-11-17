import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TranslationKeyList } from "./-editor/TranslationKeyList";
import { AddKeyForm } from "./-editor/translation-key/AddKeyForm";
import { BulkActionsButton } from "./-editor/BulkActionsButton";
import { DataActionsButton } from "./-editor/DataActionsButton";
import { Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import useDebouncedValue from "@/src/hooks/use-debounce";
import { convexQuery } from "@convex-dev/react-query";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";
import { LoadingPage } from "@/components/ui/loading";

export const Route = createFileRoute("/_authed/_customer/selectedApp/editor")({
  component: () => (
    <Suspense fallback={<LoadingPage />}>
      <TranslationEditorPage />
    </Suspense>
  ),
});

function TranslationEditorPage() {
  const { selectedApp } = useApp();
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: currentUser } = useSuspenseQuery(
    convexQuery(api.users.getCurrentUserRecord, {}),
  );

  const { data: pendingReviews } = useSuspenseQuery(
    convexQuery(api.translations.listPendingReviews, {
      appId: selectedApp._id,
    }),
  );

  const { data: locales } = useSuspenseQuery(
    convexQuery(api.locales.list, { appId: selectedApp._id }),
  );

  const { data: editorData, isFetching } = useQuery({
    ...convexQuery(api.translations.getEditorData, {
      appId: selectedApp._id,
      page: currentPage,
      limit: 10,
      search: debouncedSearchTerm || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const keys = editorData?.data
    ? Object.values(editorData.data)
        .map((item) => item.key)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const reviewMap =
    pendingReviews?.reduce(
      (acc, review) => {
        const key = `${review.keyId}-${review.localeId}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(review);
        return acc;
      },
      {} as Record<string, typeof pendingReviews>,
    ) ?? {};

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
                <DataActionsButton
                  appId={selectedApp._id}
                  locales={locales || []}
                  currentUserId={currentUser?._id}
                />
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
            <div className="relative">
              {isFetching && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">
                    Loading...
                  </div>
                </div>
              )}
              <TranslationKeyList
                keys={keys}
                locales={locales || []}
                editorData={editorData}
                filteredLocales={locales || []}
                searchTerm={searchTerm}
                onAddKey={() => setIsAddingKey(true)}
                reviewMap={reviewMap}
              />
            </div>
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
