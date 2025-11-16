import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useConvexAction, convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle, Copy } from "lucide-react";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: Id<"apps">;
  userId: Id<"users">;
}

export function PublishDialog({
  open,
  onOpenChange,
  appId,
  userId,
}: PublishDialogProps) {
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<Id<"environments"> | null>(null);
  const [publishedResult, setPublishedResult] = useState<{
    version: number;
    cdnUrl: string;
    latestUrl: string;
  } | null>(null);

  const { data: environments } = useQuery(
    convexQuery(api.environments.list, { appId }),
  );

  const publishAction = useConvexAction((api as any).publishing.publish);
  const publish = useMutation({
    mutationFn: async (environmentId: Id<"environments">) => {
      return await publishAction({ appId, environmentId, userId });
    },
  });

  const handlePublish = async () => {
    if (!selectedEnvironment) {
      toast.error("Please select an environment");
      return;
    }

    publish.mutate(selectedEnvironment, {
      onSuccess: (result) => {
        toast.success(
          `Published version ${result.version} to environment successfully!`,
        );
        setPublishedResult({
          version: result.version,
          cdnUrl: result.cdnUrl,
          latestUrl: result.latestUrl,
        });
      },
      onError: (error) => {
        console.error("Publish error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to publish",
        );
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish Translations
          </DialogTitle>
          <DialogDescription>
            Publish current translations to an environment. Last 3 versions are
            kept.
          </DialogDescription>
        </DialogHeader>

        {publishedResult && (
          <div className="space-y-4 py-4 bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <h3 className="font-semibold">Published Successfully!</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Latest (Auto-updates) - Use this in your app
                </label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={publishedResult.latestUrl}
                    readOnly
                    className="font-mono text-xs min-w-0"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(publishedResult.latestUrl);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Version {publishedResult.version} (Permanent)
                </label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={publishedResult.cdnUrl}
                    readOnly
                    className="font-mono text-xs min-w-0"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(publishedResult.cdnUrl);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 mt-4 overflow-hidden">
                <p className="text-xs font-medium mb-2">
                  💡 Usage in your app:
                </p>
                <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto break-all whitespace-pre-wrap">
                  {`const translations = await fetch(
  '${publishedResult.latestUrl}'
).then(r => r.json());`}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Environment</label>
            <Select
              value={selectedEnvironment || undefined}
              onValueChange={(value) =>
                setSelectedEnvironment(value as Id<"environments">)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {environments?.map((env) => (
                  <SelectItem key={env._id} value={env._id}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEnvironment && (
            <VersionHistory environmentId={selectedEnvironment} />
          )}
        </div>

        <DialogFooter>
          {publishedResult ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                setPublishedResult(null);
                setSelectedEnvironment(null);
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setSelectedEnvironment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!selectedEnvironment || publish.isPending}
              >
                {publish.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Publish
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionHistory({
  environmentId,
}: {
  environmentId: Id<"environments">;
}) {
  const { data: snapshots } = useQuery(
    convexQuery((api as any).environments.listSnapshots, { environmentId }),
  );

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No versions published yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Recent Versions</label>
      <div className="space-y-2">
        {snapshots.map((snapshot: any) => (
          <div
            key={snapshot._id}
            className="text-sm border rounded p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Version {snapshot.version}</span>
              <span className="text-muted-foreground text-xs">
                {new Date(snapshot.publishedAt).toLocaleString()}
              </span>
            </div>
            {snapshot.cdnUrl && (
              <div className="flex gap-1">
                <Input
                  value={snapshot.cdnUrl}
                  readOnly
                  className="font-mono text-xs h-7 min-w-0"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(snapshot.cdnUrl);
                    toast.success("Copied!");
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
