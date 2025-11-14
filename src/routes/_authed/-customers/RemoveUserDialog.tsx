import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

type RemoveUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: Id<"customers"> | null;
  userId: Id<"users"> | null;
  userName: string;
};

export function RemoveUserDialog({
  open,
  onOpenChange,
  customerId,
  userId,
  userName,
}: RemoveUserDialogProps) {
  const removeUser = useMutation(api.customerUsers.remove);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!customerId || !userId) return;

    setIsRemoving(true);
    try {
      await removeUser({ customerId, userId });
      toast.success("User removed successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove user",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {userName} from this organization?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? "Removing..." : "Remove User"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
