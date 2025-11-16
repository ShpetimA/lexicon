import { toast } from "sonner";
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
import { z } from "zod";
import { useAppForm } from "@/src/hooks/useAppForm";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Label } from "../../../../components/ui/label";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";

type UpdateUserRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerUser: Doc<"customerUsers"> & { user: Doc<"users"> | null };
};

const roleSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});

export function UpdateUserRoleDialog({
  open,
  onOpenChange,
  customerUser,
}: UpdateUserRoleDialogProps) {
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.customerUsers.updateRole),
    onError: () => {
      toast.error("Failed to update user role");
    },
  });

  const form = useAppForm({
    defaultValues: {
      role: customerUser.role,
    },
    validators: {
      onChange: roleSchema,
    },
    onSubmit: async ({ value }) => {
      await mutateAsync({
        customerId: customerUser.customerId,
        userId: customerUser.userId,
        role: value.role,
      });
      toast.success("User role updated successfully");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User Role</DialogTitle>
          <DialogDescription>
            Update the role for {customerUser.user?.name} in this organization.
          </DialogDescription>
        </DialogHeader>
        <form.Form onSubmit={form.handleSubmit}>
          <form.AppField name="role">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "owner" | "admin" | "member")
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.AppField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.AppForm>
              <form.SubmitButton loadingText="Updating...">
                Update Role
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form.Form>
      </DialogContent>
    </Dialog>
  );
}
