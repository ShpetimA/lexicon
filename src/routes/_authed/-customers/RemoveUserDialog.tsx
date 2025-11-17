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
import { api } from "../../../../convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";

type RemoveUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerUser: Doc<"customerUsers"> & {
    user: {
      name?: string;
      email: string;
    } | null;
  };
};

export function RemoveUserDialog({
  open,
  onOpenChange,
  customerUser,
}: RemoveUserDialogProps) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(api.customerUsers.remove),
    onError: () => {
      toast.error("Failed to remove user");
    },
  });

  const handleRemove = async () => {
    await mutateAsync({
      customerId: customerUser.customerId,
      userId: customerUser.userId,
    });
    toast.success("User removed successfully");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {customerUser.user?.name} from this
            organization? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? "Removing..." : "Remove User"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
