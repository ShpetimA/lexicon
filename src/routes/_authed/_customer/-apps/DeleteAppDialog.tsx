import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useConvexMutation } from "@convex-dev/react-query";

type DeleteAppDialogProps = {
  open: boolean;
  appId: Id<"apps">;
  onOpenChange: (open: boolean) => void;
};

export function DeleteAppDialog({
  open,
  appId,
  onOpenChange,
}: DeleteAppDialogProps) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(api.apps.remove),
    onError: () => {
      toast.error("Failed to delete app");
    },
  });

  const handleDelete = async () => {
    await mutateAsync({ id: appId });
    toast.success("App deleted successfully");
    onOpenChange(false);
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
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
