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

type DeleteEnvironmentDialogProps = {
  open: boolean;
  environmentId: Id<"environments"> | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteEnvironmentDialog({ open, environmentId, onOpenChange }: DeleteEnvironmentDialogProps) {
  const deleteEnvironment = useMutation(api.environments.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!environmentId) return;
    setIsDeleting(true);
    try {
      await deleteEnvironment({ id: environmentId });
      toast.success("Environment deleted successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete environment");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Environment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this environment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !environmentId}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

