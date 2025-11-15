import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";

type DeleteLocaleDialogProps = {
  open: boolean;
  localeId: Id<"appLocales"> | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteLocaleDialog({ open, localeId, onOpenChange }: DeleteLocaleDialogProps) {
  const deleteLocale = useMutation(api.locales.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!localeId) return;
    setIsDeleting(true);
    try {
      await deleteLocale({ appLocaleId: localeId });
      toast.success("Locale removed successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to remove locale");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Locale</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this locale? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !localeId}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

