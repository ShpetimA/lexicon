import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface PendingReviewDetailProps {
  review: {
    _id: Id<"translationReviews">;
    proposedValue: string;
    currentValue?: string;
    requestedBy: { _id: Id<"users">; email: string; name?: string } | null;
  };
  currentUserId?: Id<"users">;
  onApprove: (reviewId: Id<"translationReviews">) => Promise<void>;
  onReject: (reviewId: Id<"translationReviews">) => Promise<void>;
  onCancel: (reviewId: Id<"translationReviews">) => Promise<void>;
  isLoading?: boolean;
}

export function PendingReviewDetail({
  review,
  currentUserId,
  onApprove,
  onReject,
  onCancel,
  isLoading = false,
}: PendingReviewDetailProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isOwnReview = review.requestedBy?._id === currentUserId;

  const handleApprove = async () => {
    await onApprove(review._id);
    setIsExpanded(false);
  };

  const handleReject = async () => {
    await onReject(review._id);
    setIsExpanded(false);
  };

  const handleCancel = async () => {
    await onCancel(review._id);
    setIsExpanded(false);
  };

  return (
    <div className="border-t border-amber-200/50 bg-amber-50/40 dark:bg-amber-950/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-amber-900 dark:text-amber-100">
            Pending Review {isOwnReview ? "(Your Request)" : ""}
          </span>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 py-3 space-y-3 border-t border-amber-200/50">
          {review.currentValue && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Current:
              </div>
              <div className="text-sm bg-white dark:bg-slate-800 px-3 py-2 rounded border border-amber-200/50 dark:border-amber-800/50 text-slate-700 dark:text-slate-300">
                {review.currentValue}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Proposed:
            </div>
            <div className="text-sm bg-amber-100/50 dark:bg-amber-900/30 px-3 py-2 rounded border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 font-medium">
              {review.proposedValue}
            </div>
          </div>

          <div className="text-xs text-amber-700 dark:text-amber-300">
            By {review.requestedBy?.name || review.requestedBy?.email || "Unknown"}
          </div>

          <div className="flex gap-2 pt-2">
            {isOwnReview ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="text-xs"
              >
                {isLoading && (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                )}
                Cancel Request
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={isLoading}
                  className="gap-1 text-xs"
                >
                  {isLoading && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {!isLoading && <X className="h-3 w-3" />}
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="gap-1 text-xs"
                >
                  {isLoading && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {!isLoading && <Check className="h-3 w-3" />}
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
