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
import { useMutation } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";

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
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(api.keys.remove),
    onError: () => {
      toast.error("Failed to delete key");
    },
  });

  const handleDelete = async () => {
    await mutateAsync({ id: translationKey._id });
    toast.success("Key deleted successfully");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Translation Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the key "{translationKey.name}"?
            This action will also delete all associated translations and cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete Key"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
