import { Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { useTenant } from "../../../../contexts/TenantContext";
import { Plus, Edit, Trash2 } from "lucide-react";
import { CreateEnvironmentDialog } from "./-environments/CreateEnvironmentDialog";
import { UpdateEnvironmentDialog } from "./-environments/UpdateEnvironmentDialog";
import { DeleteEnvironmentDialog } from "./-environments/DeleteEnvironmentDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";
import { LoadingPage } from "@/components/ui/loading";

export const Route = createFileRoute(
  "/_authed/_customer/selectedApp/environments",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <div className="container px-4 mx-auto py-8">
        <EnvironmentsPage />
      </div>
    </Suspense>
  );
}

type Environment = {
  _id: Id<"environments">;
  name: string;
  appId: Id<"apps">;
  createdAt: number;
};

function EnvironmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { selectedCustomer } = useTenant();
  const { selectedApp } = useApp();

  const { data: environments = [] } = useSuspenseQuery({
    ...convexQuery(api.environments.list, {
      appId: selectedApp._id,
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Environments</h1>
          <p className="text-muted-foreground">
            Manage deployment environments for {selectedApp.name} in{" "}
            {selectedCustomer?.name}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Environment
        </Button>
        <CreateEnvironmentDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Environments</CardTitle>
          <CardDescription>
            {environments.length} environment(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {environments && environments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {environments.map((environment) => (
                  <EnvironmentRow
                    key={environment._id}
                    environment={environment}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyEnvironments onCreate={() => setIsCreateOpen(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const EnvironmentRow = ({ environment }: { environment: Environment }) => {
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);
  const [deleteEnvironmentId, setDeleteEnvironmentId] =
    useState<Id<"environments"> | null>(null);

  return (
    <TableRow key={environment._id}>
      <TableCell className="font-medium">{environment.name}</TableCell>
      <TableCell>
        <Badge variant="secondary">Active</Badge>
      </TableCell>
      <TableCell>
        {new Date(environment.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingEnvironment(environment)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteEnvironmentId(environment._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      {editingEnvironment && (
        <UpdateEnvironmentDialog
          key={editingEnvironment._id}
          open={true}
          environment={editingEnvironment}
          onOpenChange={(open) => {
            if (!open) setEditingEnvironment(null);
          }}
        />
      )}
      {deleteEnvironmentId && (
        <DeleteEnvironmentDialog
          key={deleteEnvironmentId}
          open={true}
          environmentId={deleteEnvironmentId}
          onOpenChange={(open) => {
            if (!open) setDeleteEnvironmentId(null);
          }}
        />
      )}
    </TableRow>
  );
};

const EmptyEnvironments = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">
        No environments found. Create your first environment to get started.
      </p>
      <Button onClick={onCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Add Environment
      </Button>
    </div>
  );
};
