import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface Review {
  _id: Id<"translationReviews">;
  proposedValue: string;
  currentValue?: string;
  requestedBy: { _id: Id<"users">; email: string; name?: string } | null;
  requestedAt: number;
}

interface PendingReviewStackProps {
  reviews: Review[];
  currentUserId?: Id<"users">;
  onApprove: (reviewId: Id<"translationReviews">) => Promise<void>;
  onReject: (reviewId: Id<"translationReviews">) => Promise<void>;
  onCancel: (reviewId: Id<"translationReviews">) => Promise<void>;
  isLoading?: boolean;
}

export function PendingReviewStack({
  reviews,
  currentUserId,
  onApprove,
  onReject,
  onCancel,
  isLoading = false,
}: PendingReviewStackProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(
    new Set([reviews[reviews.length - 1]?._id])
  );

  const toggleReviewExpanded = (reviewId: Id<"translationReviews">) => {
    const newSet = new Set(expandedReviewIds);
    if (newSet.has(reviewId)) {
      newSet.delete(reviewId);
    } else {
      newSet.add(reviewId);
    }
    setExpandedReviewIds(newSet);
  };

  // Sort by requestedAt, oldest first
  const sortedReviews = [...reviews].sort(
    (a, b) => a.requestedAt - b.requestedAt
  );

  return (
    <div className="border-t border-amber-200/50 bg-amber-50/40 dark:bg-amber-950/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-amber-900 dark:text-amber-100">
            Pending Reviews ({reviews.length})
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
        <div className="space-y-2 px-4 py-3">
          {sortedReviews.map((review, idx) => {
            const isOwnReview = review.requestedBy?._id === currentUserId;
            const isExpanded = expandedReviewIds.has(review._id);

            return (
              <div
                key={review._id}
                className="border border-amber-200/50 dark:border-amber-800/50 rounded bg-white dark:bg-slate-900"
              >
                <button
                  onClick={() => toggleReviewExpanded(review._id)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      #{idx + 1}
                      {idx === sortedReviews.length - 1 && " (latest)"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      "{review.proposedValue}"
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 py-2 space-y-2 border-t border-amber-200/50 dark:border-amber-800/50">
                    {review.currentValue && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          Current:
                        </div>
                        <div className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-amber-200/50 dark:border-amber-800/50 text-slate-700 dark:text-slate-300">
                          {review.currentValue}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Proposed:
                      </div>
                      <div className="text-xs bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 font-medium">
                        {review.proposedValue}
                      </div>
                    </div>

                    <div className="text-xs text-amber-700 dark:text-amber-300">
                      By{" "}
                      {review.requestedBy?.name ||
                        review.requestedBy?.email ||
                        "Unknown"}
                    </div>

                    <div className="flex gap-2 pt-2">
                      {isOwnReview ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCancel(review._id)}
                          disabled={isLoading}
                          className="text-xs h-7"
                        >
                          {isLoading && (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          Cancel
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(review._id)}
                            disabled={isLoading}
                            className="gap-1 text-xs h-7"
                          >
                            {isLoading && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {!isLoading && <X className="h-3 w-3" />}
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onApprove(review._id)}
                            disabled={isLoading}
                            className="gap-1 text-xs h-7"
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
          })}
        </div>
      )}
    </div>
  );
}
