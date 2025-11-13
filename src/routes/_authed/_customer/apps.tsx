import { use, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import {
  Smartphone,
  Plus,
  Calendar,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { CreateAppDialog } from "../-apps/CreateAppDialog";
import { DeleteAppDialog } from "../-apps/DeleteAppDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCustomer } from "@/src/routes/_authed/_customer";

export const Route = createFileRoute("/_authed/_customer/apps")({
  component: AppsPage,
});

function AppsPage() {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteAppId, setDeleteAppId] = useState<Id<"apps"> | null>(null);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());

  const { selectedCustomer } = useCustomer();
  const customerId = selectedCustomer._id;

  const { data: apps } = useSuspenseQuery(
    convexQuery(api.apps.list, { customerId }),
  );

  const toggleApiKeyVisibility = (appId: string) => {
    const newVisible = new Set(visibleApiKeys);
    if (newVisible.has(appId)) {
      newVisible.delete(appId);
    } else {
      newVisible.add(appId);
    }
    setVisibleApiKeys(newVisible);
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const maskApiKey = (apiKey: string) => {
    return apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Apps</h1>
          <p className="text-muted-foreground">
            Manage apps for this organization
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create App
        </Button>
        <CreateAppDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          customerId={customerId}
        />
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No apps yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first app to start managing translations and locales.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Apps</CardTitle>
            <CardDescription>
              Manage your apps and their API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps?.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{app.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {app._id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {visibleApiKeys.has(app._id)
                            ? app.apiKey
                            : maskApiKey(app.apiKey)}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApiKeyVisibility(app._id)}
                        >
                          {visibleApiKeys.has(app._id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyApiKey(app.apiKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate({
                              to: `/customers/${customerId}/apps/${app._id}`,
                            })
                          }
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteAppId(app._id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DeleteAppDialog
        open={!!deleteAppId}
        appId={deleteAppId}
        onOpenChange={(open) => {
          if (!open) setDeleteAppId(null);
        }}
      />
    </div>
  );
}
