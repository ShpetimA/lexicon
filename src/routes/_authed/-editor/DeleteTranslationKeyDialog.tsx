import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

type Key = {
  _id: Id<"keys">;
  name: string;
  description?: string;
  appId: Id<"apps">;
  createdAt: number;
};

type DeleteTranslationKeyDialogProps = {
  open: boolean;
  translationKey: Key;
  onOpenChange: (open: boolean) => void;
};

export function DeleteTranslationKeyDialog({
  open,
  translationKey,
  onOpenChange,
}: DeleteTranslationKeyDialogProps) {
  const deleteKey = useMutation(api.keys.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteKey({ id: translationKey._id });
      toast.success("Key deleted successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete key");
      console.error("Delete key error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Translation Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the key "{translationKey.name}"?
            This action will also delete all associated translations and
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Key"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
