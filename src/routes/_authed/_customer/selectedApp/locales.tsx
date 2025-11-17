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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Edit, Trash2 } from "lucide-react";
import { CreateLocaleDialog } from "./-locales/CreateLocaleDialog";
import { UpdateLocaleDialog } from "./-locales/UpdateLocaleDialog";
import { DeleteLocaleDialog } from "./-locales/DeleteLocaleDialog";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";
import { useCustomer } from "@/src/routes/_authed/_customer";
import { toast } from "sonner";
import { LoadingPage } from "@/components/ui/loading";

export const Route = createFileRoute("/_authed/_customer/selectedApp/locales")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <div className="container px-4 mx-auto py-8">
        <LocalesPage />
      </div>
    </Suspense>
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
  requiresReview?: boolean;
};

function LocalesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { selectedCustomer } = useCustomer();
  const { selectedApp } = useApp();

  const { data: locales } = useSuspenseQuery({
    ...convexQuery(api.locales.list, {
      appId: selectedApp._id,
    }),
  });

  const { data: userCount } = useSuspenseQuery({
    ...convexQuery(api.locales.getUserCount, {
      appId: selectedApp._id,
    }),
  });

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
                  {(userCount || 0) >= 2 && (
                    <TableHead>Review Required</TableHead>
                  )}
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locales.map((locale) => (
                  <LocaleRow
                    key={locale.appLocaleId}
                    locale={locale}
                    userCount={userCount || 0}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <NoLocales onCreate={() => setIsCreateOpen(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const LocaleRow = ({
  locale,
  userCount,
}: {
  locale: Locale;
  userCount: number;
}) => {
  const [editingLocale, setEditingLocale] = useState<Locale | null>(null);
  const [deleteLocaleId, setDeleteLocaleId] = useState<Id<"appLocales"> | null>(
    null,
  );

  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.locales.toggleReviewRequired),
    onError: () => {
      toast.error("Failed to toggle review mode");
    },
  });

  const handleToggleReview = async () => {
    await mutateAsync({
      appLocaleId: locale.appLocaleId,
      requiresReview: !locale.requiresReview,
    });
    toast.success(
      !locale.requiresReview ? "Review mode enabled" : "Review mode disabled",
    );
  };

  return (
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
      {(userCount || 0) >= 2 && (
        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-min">
                  <Switch
                    checked={locale.requiresReview || false}
                    onCheckedChange={handleToggleReview}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {locale.requiresReview
                    ? "Review mode enabled"
                    : "Enable review mode"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}
      <TableCell>{new Date(locale.addedAt).toLocaleDateString()}</TableCell>
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
          {editingLocale && (
            <UpdateLocaleDialog
              key={editingLocale?._id}
              open={!!editingLocale}
              locale={editingLocale}
              onOpenChange={(open) => {
                if (!open) setEditingLocale(null);
              }}
            />
          )}
          {deleteLocaleId && (
            <DeleteLocaleDialog
              key={deleteLocaleId}
              open={!!deleteLocaleId}
              localeId={deleteLocaleId}
              onOpenChange={(open) => {
                if (!open) setDeleteLocaleId(null);
              }}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

const NoLocales = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">
        No locales found. Create your first locale to get started.
      </p>
      <Button onClick={onCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Add Locale
      </Button>
    </div>
  );
};
