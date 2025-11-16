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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

type DeleteLocaleDialogProps = {
  open: boolean;
  localeId: Id<"appLocales">;
  onOpenChange: (open: boolean) => void;
};

export function DeleteLocaleDialog({
  open,
  localeId,
  onOpenChange,
}: DeleteLocaleDialogProps) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(api.locales.remove),
    onError: () => {
      toast.error("Failed to remove locale");
    },
  });

  const handleDelete = async () => {
    await mutateAsync({ appLocaleId: localeId });
    toast.success("Locale removed successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Locale</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this locale? This action cannot be
            undone.
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
