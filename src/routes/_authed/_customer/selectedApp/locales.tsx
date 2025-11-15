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
import { Plus, Edit, Trash2 } from "lucide-react";
import { CreateLocaleDialog } from "../../-locales/CreateLocaleDialog";
import { UpdateLocaleDialog } from "../../-locales/UpdateLocaleDialog";
import { DeleteLocaleDialog } from "../../-locales/DeleteLocaleDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";
import { useCustomer } from "@/src/routes/_authed/_customer";

export const Route = createFileRoute("/_authed/_customer/selectedApp/locales")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container px-4 mx-auto py-8">
      <LocalesPage />
    </div>
  );
}

type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  appLocaleId: Id<"appLocales">;
  addedAt: number;
};

function LocalesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocale, setEditingLocale] = useState<Locale | null>(null);
  const [deleteLocaleId, setDeleteLocaleId] = useState<Id<"appLocales"> | null>(
    null,
  );
  const { selectedCustomer } = useCustomer();
  const { selectedApp } = useApp();

  const { data: locales, isLoading } = useQuery({
    ...convexQuery(api.locales.list, {
      appId: selectedApp._id,
    }),
    enabled: !!selectedApp,
  });

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
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Native Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locales.map((locale) => (
                  <TableRow key={locale.appLocaleId}>
                    <TableCell className="font-medium">{locale.name}</TableCell>
                    <TableCell>{locale.code}</TableCell>
                    <TableCell>{locale.nativeName}</TableCell>
                    <TableCell>
                      {locale.isDefault ? (
                        <Badge variant="default">Default</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(locale.addedAt).toLocaleDateString()}
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
                          onClick={() => setDeleteLocaleId(locale.appLocaleId)}
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
