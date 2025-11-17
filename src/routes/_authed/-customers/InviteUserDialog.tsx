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
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Label } from "../../../../components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: Id<"customers">;
};

const inviteSchema = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(["admin", "member"]),
});

export function InviteUserDialog({
  open,
  onOpenChange,
  customerId,
}: InviteUserDialogProps) {
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.customerUsers.invite),
    onError: () => {
      toast.error("Failed to invite user");
    },
  });

  const form = useAppForm({
    defaultValues: {
      email: "",
      role: "member" as "admin" | "member",
    },
    validators: {
      onSubmit: inviteSchema,
    },
    onSubmit: async ({ value }) => {
      await mutateAsync({
        customerId,
        email: value.email,
        role: value.role,
      });
      toast.success("User invited successfully");
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Invite a user to join this organization by email address.
          </DialogDescription>
        </DialogHeader>
        <form.Form onSubmit={form.handleSubmit}>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Email Address"
                placeholder="user@example.com"
                type="email"
                required
              />
            )}
          </form.AppField>

          <form.AppField name="role">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "admin" | "member")
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
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
              <form.SubmitButton loadingText="Inviting...">
                Invite User
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form.Form>
      </DialogContent>
    </Dialog>
  );
}
