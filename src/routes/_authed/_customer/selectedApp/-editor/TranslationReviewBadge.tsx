import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TranslationReviewBadgeProps {
  hasPendingReview: boolean;
  requestedByCurrentUser?: boolean;
}

export function TranslationReviewBadge({
  hasPendingReview,
  requestedByCurrentUser,
}: TranslationReviewBadgeProps) {
  if (!hasPendingReview) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 cursor-help">
            <Clock className="h-3 w-3" />
            {requestedByCurrentUser ? "Your Review" : "Pending"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {requestedByCurrentUser
              ? "You submitted this change for review"
              : "This translation is awaiting review"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
