import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Languages, Copy } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { BulkActionsDrawer, type BulkActionType } from "./BulkActionsDrawer";

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

interface BulkActionsButtonProps {
  appId: Id<"apps">;
  locales: Locale[];
  totalKeys: number;
}

export function BulkActionsButton({
  appId,
  locales,
  totalKeys,
}: BulkActionsButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkActionType | null>(
    null,
  );

  const handleActionSelect = (action: BulkActionType) => {
    setSelectedAction(action);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedAction(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Bulk Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleActionSelect("translateAll")}>
            <Languages className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Translate All Keys</span>
              <span className="text-xs text-muted-foreground">
                Auto-translate everything
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleActionSelect("fillMissing")}>
            <Languages className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Fill Missing Translations</span>
              <span className="text-xs text-muted-foreground">
                Only empty translations
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleActionSelect("copyLocale")}>
            <Copy className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Copy Locale to Another</span>
              <span className="text-xs text-muted-foreground">
                Duplicate translations
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BulkActionsDrawer
        open={drawerOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleDrawerClose();
        }}
        appId={appId}
        locales={locales}
        totalKeys={totalKeys}
        initialAction={selectedAction}
      />
    </>
  );
}
