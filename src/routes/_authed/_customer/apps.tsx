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
import { CreateAppDialog } from "./-apps/CreateAppDialog";
import { DeleteAppDialog } from "./-apps/DeleteAppDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useCustomer } from "@/src/routes/_authed/_customer";
import Loading from "@/components/ui/loading";

export const Route = createFileRoute("/_authed/_customer/apps")({
  component: () => (
    <Suspense fallback={<Loading />}>
      <AppsPage />
    </Suspense>
  ),
});

function AppsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { selectedCustomer } = useCustomer();
  const customerId = selectedCustomer._id;

  const { data: apps } = useSuspenseQuery(
    convexQuery(api.apps.list, { customerId }),
  );

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
        <EmptyApps onCreate={() => setIsCreateDialogOpen(true)} />
      ) : (
        <AppsTable apps={apps} customerId={customerId} />
      )}
    </div>
  );
}

type AppsTableProps = {
  apps: Doc<"apps">[];
  customerId: Id<"customers">;
};

const AppsTable = ({ apps }: AppsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apps</CardTitle>
        <CardDescription>Manage your apps and their API keys</CardDescription>
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
              <AppRow key={app._id} app={app} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const AppRow = ({ app }: { app: Doc<"apps"> }) => {
  const [visible, setVisible] = useState(false);
  const [deleteAppId, setDeleteAppId] = useState<Id<"apps"> | null>(null);
  const toggleApiKeyVisibility = () => {
    setVisible(!visible);
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const maskApiKey = (apiKey: string) => {
    return apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);
  };

  return (
    <TableRow key={app._id}>
      <TableCell>
        <div>
          <div className="font-medium">{app.name}</div>
          <div className="text-sm text-muted-foreground">ID: {app._id}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <code className="text-sm bg-muted px-2 py-1 rounded">
            {visible ? app.apiKey : maskApiKey(app.apiKey)}
          </code>
          <Button variant="outline" size="sm" onClick={toggleApiKeyVisibility}>
            {visible ? (
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
            onClick={() => setDeleteAppId(app._id!)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
      {deleteAppId && (
        <DeleteAppDialog
          open={true}
          appId={deleteAppId}
          onOpenChange={(open) => {
            if (!open) setDeleteAppId(null);
          }}
        />
      )}
    </TableRow>
  );
};

type EmptyAppsProps = {
  onCreate: () => void;
};

const EmptyApps = ({ onCreate }: EmptyAppsProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No apps yet</h3>
        <p className="text-muted-foreground text-center mb-4">
          Create your first app to start managing translations and locales.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create App
        </Button>
      </CardContent>
    </Card>
  );
};
