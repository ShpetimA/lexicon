import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Check, X, Clock, Ban } from "lucide-react";

interface ReviewHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: Id<"keys">;
  localeId: Id<"globalLocales">;
  keyName: string;
  localeName: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "outline" as const,
  },
  approved: {
    icon: Check,
    label: "Approved",
    variant: "default" as const,
  },
  rejected: {
    icon: X,
    label: "Rejected",
    variant: "destructive" as const,
  },
  cancelled: {
    icon: Ban,
    label: "Cancelled",
    variant: "secondary" as const,
  },
};

export function ReviewHistoryDialog({
  open,
  onOpenChange,
  keyId,
  localeId,
  keyName,
  localeName,
}: ReviewHistoryDialogProps) {
  const { data: history } = useQuery({
    ...convexQuery(api.translations.getReviewHistory, {
      keyId,
      localeId,
    }),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review History</DialogTitle>
          <DialogDescription>
            History for {keyName} in {localeName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 pr-4">
            {history && history.length > 0 ? (
              history.map((review) => {
                const config = statusConfig[review.status];
                const Icon = config.icon;

                return (
                  <div
                    key={review._id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.requestedAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Requested by {review.requestedBy?.email || "Unknown"}
                        </div>
                      </div>
                      <Badge variant={config.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {review.currentValue && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Previous:
                          </div>
                          <div className="text-sm bg-muted px-3 py-2 rounded">
                            {review.currentValue}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Proposed:
                        </div>
                        <div
                          className={`text-sm px-3 py-2 rounded ${
                            review.status === "approved"
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          {review.proposedValue}
                        </div>
                      </div>
                    </div>

                    {review.status !== "pending" && review.reviewedAt && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          {review.status === "cancelled"
                            ? `Cancelled at ${new Date(review.reviewedAt).toLocaleString()}`
                            : `${config.label} by ${review.reviewedBy?.email || "Unknown"} at ${new Date(review.reviewedAt).toLocaleString()}`}
                        </div>
                        {review.comment && (
                          <div className="mt-2 text-sm bg-muted px-3 py-2 rounded">
                            <span className="font-medium">Comment: </span>
                            {review.comment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No review history
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
