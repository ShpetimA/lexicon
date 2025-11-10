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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { useTenant } from "../../contexts/TenantContext";
import { Plus, Edit, Trash2, Globe } from "lucide-react";
import { CreateLocaleDialog } from "./-locales/CreateLocaleDialog";
import { UpdateLocaleDialog } from "./-locales/UpdateLocaleDialog";
import { DeleteLocaleDialog } from "./-locales/DeleteLocaleDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authed/locales")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto py-8">
      <Authenticated>
        <LocalesPage />
      </Authenticated>
    </div>
  );
}

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

function LocalesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocale, setEditingLocale] = useState<Locale | null>(null);
  const [deleteLocaleId, setDeleteLocaleId] = useState<Id<"locales"> | null>(
    null,
  );

  const { selectedCustomer, selectedApp } = useTenant();

  const { data: locales, isLoading } = useQuery({
    ...convexQuery(api.locales.list, {
      appId: selectedApp?._id ?? ("" as any),
    }),
    enabled: !!selectedApp,
  });

  if (!selectedCustomer || !selectedApp) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Select Organization and App
          </h3>
          <p className="text-muted-foreground">
            Please select an organization and app from the sidebar to manage
            locales.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading locales...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Locales</h1>
          <p className="text-muted-foreground">
            Manage locales for {selectedApp.name} in {selectedCustomer.name}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Locale
        </Button>
        <CreateLocaleDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Locales</CardTitle>
          <CardDescription>
            {locales?.length || 0} locale(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locales && locales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locales.map((locale) => (
                  <TableRow key={locale._id}>
                    <TableCell className="font-medium">{locale.code}</TableCell>
                    <TableCell>
                      {locale.isDefault ? (
                        <Badge variant="default">Default</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(locale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLocale(locale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteLocaleId(locale._id)}
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
                No locales found. Create your first locale to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <UpdateLocaleDialog
        key={editingLocale?._id}
        open={!!editingLocale}
        locale={editingLocale}
        onOpenChange={(open) => {
          if (!open) setEditingLocale(null);
        }}
      />
      <DeleteLocaleDialog
        key={deleteLocaleId}
        open={!!deleteLocaleId}
        localeId={deleteLocaleId}
        onOpenChange={(open) => {
          if (!open) setDeleteLocaleId(null);
        }}
      />
    </div>
  );
}
