import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { EditTranslationKeyDialog } from "./EditTranslationKeyDialog";
import { DeleteTranslationKeyDialog } from "./DeleteTranslationKeyDialog";

type Key = {
  _id: Id<"keys">;
  name: string;
  description?: string;
  appId: Id<"apps">;
  createdAt: number;
};

interface TranslationKeyActionsProps {
  translationKey: Key;
}

export function TranslationKeyActions({
  translationKey,
}: TranslationKeyActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
        onClick={() => setIsEditDialogOpen(true)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-gray-200 transition-colors"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <EditTranslationKeyDialog
        open={isEditDialogOpen}
        translationKey={translationKey}
        onOpenChange={setIsEditDialogOpen}
      />
      <DeleteTranslationKeyDialog
        open={isDeleteDialogOpen}
        translationKey={translationKey}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
}
