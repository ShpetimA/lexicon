import { Button } from "@/components/ui/button";
import { Check, X, Clock, Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ButtonGroup } from "@/components/ui/button-group";

interface Review {
  _id: Id<"translationReviews">;
  proposedValue: string;
  currentValue?: string;
  requestedBy: { _id: Id<"users">; email: string; name?: string };
  requestedAt: number;
}

interface PendingReviewStackProps {
  reviews: Review[];
}

export function PendingReviewStack({ reviews }: PendingReviewStackProps) {
  const sortedReviews = [...reviews].sort(
    (a, b) => a.requestedAt - b.requestedAt,
  );

  return (
    <div className="border-t bg-muted/50">
      <Accordion type="single" collapsible defaultValue="pending-reviews">
        <AccordionItem value="pending-reviews" className="border-b-0">
          <AccordionTrigger className="px-4 py-2 hover:bg-muted">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                Pending Reviews ({reviews.length})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-3">
            <div className="space-y-2">
              {sortedReviews.map((review) => {
                return <ReviewCard key={review._id} review={review} />;
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

const ReviewCard = ({ review }: { review: Review }) => {
  const { data: currentUser } = useQuery(
    convexQuery(api.users.getCurrentUserRecord, {}),
  );
  const { mutateAsync: approveReview, isPending: isApproveLoading } =
    useMutation({
      mutationFn: useConvexMutation(api.translations.approveReview),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to approve review",
        );
      },
    });
  const { mutateAsync: rejectReview, isPending: isRejectLoading } = useMutation(
    {
      mutationFn: useConvexMutation(api.translations.rejectReview),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to reject review",
        );
      },
    },
  );
  const { mutateAsync: cancelReview, isPending: isCancelLoading } = useMutation(
    {
      mutationFn: useConvexMutation(api.translations.cancelReview),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to cancel review",
        );
      },
    },
  );
  const isOwnReview = review.requestedBy?._id === currentUser?._id;

  const approveReviewMutation = async () => {
    await approveReview({ reviewId: review._id });
  };

  const rejectReviewMutation = async () => {
    await rejectReview({ reviewId: review._id });
  };

  const cancelReviewMutation = async () => {
    await cancelReview({ reviewId: review._id });
  };

  return (
    <Accordion type="single" collapsible defaultValue={`review-${review._id}`}>
      <AccordionItem
        value={`review-${review._id}`}
        className="border rounded bg-card"
      >
        <AccordionTrigger className="px-3 py-2 hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              #{review.requestedAt}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              "{review.proposedValue}"
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 py-2 border-t">
          <div className="space-y-2">
            <ReviewDiff review={review} />

            <ReviewButtons
              isOwnReview={isOwnReview}
              isCancelLoading={isCancelLoading}
              isRejectLoading={isRejectLoading}
              isApproveLoading={isApproveLoading}
              onCancel={cancelReviewMutation}
              onReject={rejectReviewMutation}
              onApprove={approveReviewMutation}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const ReviewDiff = ({ review }: { review: Review }) => {
  return (
    <>
      {review.currentValue && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            Current:
          </div>
          <div className="text-xs bg-muted px-2 py-1 rounded border text-accent-foreground">
            {review.currentValue}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">
          Proposed:
        </div>
        <div className="text-xs bg-accent px-2 py-1 rounded border text-foreground font-medium">
          {review.proposedValue}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {`By ${review.requestedBy.name}`}
      </div>
    </>
  );
};

const ReviewButtons = ({
  isOwnReview,
  onCancel,
  onReject,
  onApprove,
  isCancelLoading,
  isRejectLoading,
  isApproveLoading,
}: {
  isOwnReview: boolean;
  isCancelLoading: boolean;
  isRejectLoading: boolean;
  isApproveLoading: boolean;
  onCancel: () => void;
  onReject: () => void;
  onApprove: () => void;
}) => {
  if (isOwnReview) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        disabled={isCancelLoading}
        className="text-xs h-7"
      >
        {isCancelLoading ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Cancel
      </Button>
    );
  }
  return (
    <ButtonGroup className="gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onReject}
        disabled={isRejectLoading}
      >
        {isRejectLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Reject
      </Button>
      <Button size="sm" onClick={onApprove} disabled={isApproveLoading}>
        {isApproveLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Approve
      </Button>
    </ButtonGroup>
  );
};
