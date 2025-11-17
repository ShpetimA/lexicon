import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TranslationKeyList } from "./-editor/TranslationKeyList";
import { AddKeyForm } from "./-editor/AddKeyForm";
import { ScrapeWebsiteSheet } from "./-editor/ScrapeWebsiteSheet";
import { BulkActionsButton } from "./-editor/BulkActionsButton";
import { PendingReviewsDrawer } from "./-editor/PendingReviewsDrawer";
import { PublishDialog } from "./-editor/PublishDialog";
import { ExportDialog } from "./-editor/ExportDialog";
import { Plus, Search, Globe, Clock, Upload, Download } from "lucide-react";
import { api } from "@/convex/_generated/api";
import useDebouncedValue from "@/src/hooks/use-debounce";
import { convexQuery } from "@convex-dev/react-query";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";

export const Route = createFileRoute("/_authed/_customer/selectedApp/editor")({
  component: TranslationEditorPage,
});

function TranslationEditorPage() {
  const { selectedApp } = useApp();
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isScrapeDialogOpen, setIsScrapeDialogOpen] = useState(false);
  const [isPendingReviewsOpen, setIsPendingReviewsOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: currentUser } = useQuery(
    convexQuery(api.users.getCurrentUserRecord, {}),
  );

  const { data: pendingReviews } = useQuery(
    convexQuery(api.translations.listPendingReviews, {
      appId: selectedApp._id,
    }),
  );

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

  const keys = editorData?.data
    ? Object.values(editorData.data).map((item) => item.key)
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
                {(pendingReviews?.length || 0) > 0 && (
                  <Button
                    onClick={() => setIsPendingReviewsOpen(true)}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Pending Reviews
                    <Badge variant="secondary" className="ml-1">
                      {pendingReviews?.length}
                    </Badge>
                  </Button>
                )}
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
                  onClick={() => setIsExportDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  onClick={() => setIsPublishDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Publish
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

          {currentUser && (
            <>
              <ScrapeWebsiteSheet
                open={isScrapeDialogOpen}
                onOpenChange={setIsScrapeDialogOpen}
                appId={selectedApp._id}
                locales={locales || []}
              />
              <PendingReviewsDrawer
                open={isPendingReviewsOpen}
                onOpenChange={setIsPendingReviewsOpen}
                appId={selectedApp._id}
                currentUserId={currentUser._id}
              />
              <PublishDialog
                open={isPublishDialogOpen}
                onOpenChange={setIsPublishDialogOpen}
                appId={selectedApp._id}
                userId={currentUser._id}
              />
            </>
          )}

          <ExportDialog
            open={isExportDialogOpen}
            onOpenChange={setIsExportDialogOpen}
            appId={selectedApp._id}
          />

          {editorData && (
            <TranslationKeyList
              keys={keys}
              locales={locales || []}
              editorData={editorData}
              filteredLocales={locales || []}
              searchTerm={searchTerm}
              onAddKey={() => setIsAddingKey(true)}
              appId={selectedApp._id}
              reviewMap={reviewMap}
              currentUserId={currentUser?._id}
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
