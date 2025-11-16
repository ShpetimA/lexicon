import { Button } from "../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

type DeleteCustomerDialogProps = {
  open: boolean;
  customerId: Id<"customers">;
  onOpenChange: (open: boolean) => void;
};

export function DeleteCustomerDialog({
  open,
  customerId,
  onOpenChange,
}: DeleteCustomerDialogProps) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(api.customers.remove),
    onError: () => {
      toast.error("Failed to delete customer");
    },
  });

  const handleDelete = async () => {
    await mutateAsync({ id: customerId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Organization</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this organization? This action
            cannot be undone.
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
