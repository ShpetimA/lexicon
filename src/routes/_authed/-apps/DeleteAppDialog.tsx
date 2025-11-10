import { Button } from "../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";

type DeleteAppDialogProps = {
  open: boolean;
  appId: Id<"apps"> | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteAppDialog({
  open,
  appId,
  onOpenChange,
}: DeleteAppDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteApp = useMutation(api.apps.remove);

  const handleDelete = async () => {
    if (!appId) return;
    setIsDeleting(true);
    try {
      await deleteApp({ id: appId });
      toast.success("App deleted successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete app");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete App</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this app? This action cannot be
            undone and will remove all associated translations and locales.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !appId}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
