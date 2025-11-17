import { useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";

interface PendingReviewsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localeId?: Id<"globalLocales">;
  currentUserId: Id<"users">;
}

export function PendingReviewsDrawer({
  open,
  onOpenChange,
  localeId,
  currentUserId,
}: PendingReviewsDrawerProps) {
  const appId = useApp().selectedApp._id;
  const { data: reviews } = useQuery({
    ...convexQuery(api.translations.listPendingReviews, {
      appId,
      localeId,
    }),
    enabled: open,
  });

  const approveReview = useConvexMutation(api.translations.approveReview);
  const rejectReview = useConvexMutation(api.translations.rejectReview);
  const cancelReview = useConvexMutation(api.translations.cancelReview);

  const handleApprove = async (reviewId: Id<"translationReviews">) => {
    try {
      await approveReview({ reviewId });
      toast.success("Review approved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve review",
      );
    }
  };

  const handleReject = async (reviewId: Id<"translationReviews">) => {
    try {
      await rejectReview({ reviewId });
      toast.success("Review rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject review",
      );
    }
  };

  const handleCancel = async (reviewId: Id<"translationReviews">) => {
    try {
      await cancelReview({ reviewId });
      toast.success("Review cancelled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel review",
      );
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Pending Reviews</DrawerTitle>
          <DrawerDescription>
            {reviews?.length || 0} translation(s) awaiting review
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[60vh] px-4">
          <div className="space-y-4 pb-4">
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => {
                const isOwnReview = review.requestedBy?._id === currentUserId;

                return (
                  <div
                    key={review._id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{review.key?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.locale?.name} ({review.locale?.code})
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {review.currentValue && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Current:
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
                        <div className="text-sm bg-primary/10 px-3 py-2 rounded">
                          {review.proposedValue}
                        </div>
                      </div>
                    </div>

                    {review.contextTranslations &&
                      review.contextTranslations.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Context - All Locales:
                          </div>
                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {review.contextTranslations.map(
                              (translation: any) => (
                                <div key={translation._id} className="text-xs">
                                  <div className="text-muted-foreground mb-1 font-medium">
                                    {translation.locale?.name} (
                                    {translation.locale?.code}):
                                  </div>
                                  <div
                                    className={`px-2 py-1 rounded ${
                                      translation.localeId === review.localeId
                                        ? "bg-primary/10 text-slate-700 dark:text-slate-300 border border-primary/30"
                                        : "bg-muted text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {translation.value || "(no translation)"}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        By {review.requestedBy?.email || "Unknown"}
                      </div>
                      <div className="flex gap-2">
                        {isOwnReview ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(review._id)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(review._id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(review._id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pending reviews
              </div>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
