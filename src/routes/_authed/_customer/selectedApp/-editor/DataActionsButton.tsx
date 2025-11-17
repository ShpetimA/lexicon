import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Upload, Download, Database, FileJson } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { ScrapeWebsiteSheet } from "./ScrapeWebsiteSheet";
import { PublishDialog } from "./PublishDialog";
import { ExportDialog } from "./ExportDialog";
import { ImportJsonDialog } from "./ImportJsonDialog";

type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  isDefault: boolean;
};

interface DataActionsButtonProps {
  appId: Id<"apps">;
  locales: Locale[];
  currentUserId?: Id<"users">;
}

export function DataActionsButton({
  appId,
  locales,
  currentUserId,
}: DataActionsButtonProps) {
  const [isScrapeDialogOpen, setIsScrapeDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportJsonDialogOpen, setIsImportJsonDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Database className="h-4 w-4" />
            Data Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setIsImportJsonDialogOpen(true)}>
            <FileJson className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Import JSON</span>
              <span className="text-xs text-muted-foreground">
                Upload i18n file
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsScrapeDialogOpen(true)}>
            <Globe className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Import from Website</span>
              <span className="text-xs text-muted-foreground">
                Scrape translations
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Export</span>
              <span className="text-xs text-muted-foreground">
                Download translations
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsPublishDialogOpen(true)}
            disabled={!currentUserId}
          >
            <Upload className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Publish</span>
              <span className="text-xs text-muted-foreground">
                Deploy to environment
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportJsonDialog
        open={isImportJsonDialogOpen}
        onOpenChange={setIsImportJsonDialogOpen}
        appId={appId}
        locales={locales}
      />

      <ScrapeWebsiteSheet
        open={isScrapeDialogOpen}
        onOpenChange={setIsScrapeDialogOpen}
        appId={appId}
        locales={locales}
      />

      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        appId={appId}
      />

      {currentUserId && (
        <PublishDialog
          open={isPublishDialogOpen}
          onOpenChange={setIsPublishDialogOpen}
          appId={appId}
          userId={currentUserId}
        />
      )}
    </>
  );
}
