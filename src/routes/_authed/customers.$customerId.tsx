import { Suspense, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, UserCog, Trash2 } from "lucide-react";
import { InviteUserDialog } from "./-customers/InviteUserDialog";
import { UpdateUserRoleDialog } from "./-customers/UpdateUserRoleDialog";
import { RemoveUserDialog } from "./-customers/RemoveUserDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LoadingPage } from "@/components/ui/loading";

export const Route = createFileRoute("/_authed/customers/$customerId")({
  loader: async ({ context, params }) => {
    const customerId = params.customerId as Id<"customers">;
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.customers.get, { id: customerId }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.customerUsers.list, {
          customerId: customerId,
        }),
      ),
    ]);
  },
  component: () => (
    <Suspense fallback={<LoadingPage />}>
      <CustomerDetailPage />
    </Suspense>
  ),
});

type UserAction = {
  userId: Id<"users">;
  action: "invite" | "updateRole" | "remove";
};

function CustomerDetailPage() {
  const params = Route.useParams();
  const customerId = params.customerId as Id<"customers">;
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [action, setAction] = useState<UserAction | null>(null);

  const { data: customer } = useSuspenseQuery(
    convexQuery(api.customers.get, { id: customerId }),
  );

  const { data: customerUsers } = useSuspenseQuery(
    convexQuery(api.customerUsers.list, {
      customerId: customerId,
    }),
  );

  const getRoleBadgeVariant = (
    role: "owner" | "admin" | "member",
  ): "default" | "secondary" | "outline" => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
    }
  };

  const selectedCustomer = customerUsers.find(
    (customerUser) => customerUser.userId === action?.userId,
  );

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{customer?.name}</h1>
          <p className="text-muted-foreground">Manage organization members</p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Users who have access to this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members yet. Invite users to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerUsers.map((customerUser) => (
                  <TableRow key={customerUser._id}>
                    <TableCell className="font-medium">
                      {customerUser.user?.name || "N/A"}
                    </TableCell>
                    <TableCell>{customerUser.user?.email || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(customerUser.role)}>
                        {customerUser.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (customerUser.user) {
                              setAction({
                                userId: customerUser.userId,
                                action: "updateRole",
                              });
                            }
                          }}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (customerUser.user) {
                              setAction({
                                userId: customerUser.userId,
                                action: "remove",
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isInviteDialogOpen && (
        <InviteUserDialog
          open={true}
          onOpenChange={setIsInviteDialogOpen}
          customerId={customerId}
        />
      )}

      {action?.action === "updateRole" && selectedCustomer && (
        <UpdateUserRoleDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setAction(null);
          }}
          customerUser={selectedCustomer}
        />
      )}
      {action?.action === "remove" && selectedCustomer && (
        <RemoveUserDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setAction(null);
          }}
          customerUser={selectedCustomer}
        />
      )}
    </div>
  );
}
