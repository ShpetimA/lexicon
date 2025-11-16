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
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type DeleteEnvironmentDialogProps = {
  open: boolean;
  environmentId: Id<"environments">;
  onOpenChange: (open: boolean) => void;
};

export function DeleteEnvironmentDialog({
  open,
  environmentId,
  onOpenChange,
}: DeleteEnvironmentDialogProps) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(api.environments.remove),
    onError: () => {
      toast.error("Failed to delete environment");
    },
  });

  const handleDelete = async () => {
    await mutateAsync({ id: environmentId });
    toast.success("Environment deleted successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Environment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this environment? This action cannot
            be undone.
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
