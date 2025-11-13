import { useState } from "react";
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
import { useTenant } from "../../contexts/TenantContext";
import { Plus, Edit, Trash2, Server } from "lucide-react";
import { CreateEnvironmentDialog } from "./-environments/CreateEnvironmentDialog";
import { UpdateEnvironmentDialog } from "./-environments/UpdateEnvironmentDialog";
import { DeleteEnvironmentDialog } from "./-environments/DeleteEnvironmentDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const Route = createFileRoute("/_authed/environments")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container px-4 mx-auto py-8">
      <EnvironmentsPage />
    </div>
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
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);
  const [deleteEnvironmentId, setDeleteEnvironmentId] =
    useState<Id<"environments"> | null>(null);

  const { selectedCustomer, selectedApp } = useTenant();

  const { data: environments, isLoading } = useQuery({
    ...convexQuery(api.environments.list, {
      appId: selectedApp?._id ?? ("" as any),
    }),
    enabled: !!selectedApp,
  });

  if (!selectedCustomer || !selectedApp) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Select Organization and App
          </h3>
          <p className="text-muted-foreground">
            Please select an organization and app from the sidebar to manage
            environments.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading environments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Environments</h1>
          <p className="text-muted-foreground">
            Manage deployment environments for {selectedApp.name} in{" "}
            {selectedCustomer.name}
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
            {environments?.length || 0} environment(s) configured
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
                  <TableRow key={environment._id}>
                    <TableCell className="font-medium">
                      {environment.name}
                    </TableCell>
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
                          onClick={() =>
                            setDeleteEnvironmentId(environment._id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No environments found. Create your first environment to get
                started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <UpdateEnvironmentDialog
        key={editingEnvironment?._id}
        open={!!editingEnvironment}
        environment={editingEnvironment}
        onOpenChange={(open) => {
          if (!open) setEditingEnvironment(null);
        }}
      />
      <DeleteEnvironmentDialog
        key={deleteEnvironmentId}
        open={!!deleteEnvironmentId}
        environmentId={deleteEnvironmentId}
        onOpenChange={(open) => {
          if (!open) setDeleteEnvironmentId(null);
        }}
      />
    </div>
  );
}
