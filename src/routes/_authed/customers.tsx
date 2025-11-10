import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Plus, Building2, Calendar, Trash2 } from "lucide-react";
import { CreateCustomerDialog } from "./-customers/CreateCustomerDialog";
import { DeleteCustomerDialog } from "./-customers/DeleteCustomerDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authed/customers")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto py-8">
      <Authenticated>
        <CustomersPage />
      </Authenticated>
    </div>
  );
}

function CustomersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] =
    useState<Id<"customers"> | null>(null);
  const { data: customers } = useSuspenseQuery(
    convexQuery(api.customers.list, {}),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and their apps
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
        <CreateCustomerDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first organization to start organizing your apps and
              translations.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      Created{" "}
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    onClick={() => {
                      setDeleteCustomerId(customer._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <DeleteCustomerDialog
        open={!!deleteCustomerId}
        customerId={deleteCustomerId}
        onOpenChange={(open) => {
          if (!open) setDeleteCustomerId(null);
        }}
      />
    </div>
  );
}
