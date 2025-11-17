import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: Id<"apps">;
}

export function ExportDialog({ open, onOpenChange, appId }: ExportDialogProps) {
  const { data, isLoading } = useQuery(
    convexQuery(api.environments.generateExportData, { appId }),
  );

  const handleDownload = () => {
    if (!data) return;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Translations
          </DialogTitle>
          <DialogDescription>
            Download all current translations as JSON file for local use
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 w-full flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 w-full flex flex-col gap-4">
              <div className="rounded border w-full p-4 bg-muted/50 overflow-hidden">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <pre className="text-xs overflow-x-auto max-h-48 w-full break-all whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2).slice(0, 500)}...
                </pre>
              </div>

              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
