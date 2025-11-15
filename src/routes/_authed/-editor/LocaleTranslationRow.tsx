import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { PendingReviewStack } from "./PendingReviewStack";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

type TranslationStatus = "idle" | "pending" | "success" | "error";

type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  appLocaleId: Id<"appLocales">;
  addedAt: number;
};

interface LocaleTranslationRowProps {
  locale: Locale;
  translation?: Doc<"translations">;
  status: TranslationStatus;
  onSave: (localeId: string, value: string) => Promise<{ requiresReview: boolean }>;
  reviews?: any[];
  currentUserId?: Id<"users">;
}

export function LocaleTranslationRow({
  locale,
  translation,
  status,
  onSave,
  reviews,
  currentUserId,
}: LocaleTranslationRowProps) {
  const [value, setValue] = useState(translation?.value || "");
  const [reviewLoading, setReviewLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const approveReview = useConvexMutation(api.translations.approveReview);
  const rejectReview = useConvexMutation(api.translations.rejectReview);
  const cancelReview = useConvexMutation(api.translations.cancelReview);

  const adjustHeight = () => {
    if (CSS.supports("field-sizing", "content")) {
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    setValue(translation?.value || "");
  }, [translation?.value]);

   const handleBlur = async () => {
     if (value !== (translation?.value || "")) {
       await onSave(locale._id, value);
       // Don't clear field - let user keep editing while reviews are pending
     }
   };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  const getLocaleName = (code: string) => {
    const names: Record<string, string> = {
      en: "English",
      sq: "Albanian",
      fr: "French",
      de: "German",
      it: "Italian",
      sr: "Serbian",
      es: "Spanish",
      tr: "Turkish",
    };
    return names[code] || code;
  };

  const handleApprove = async (reviewId: Id<"translationReviews">) => {
    try {
      setReviewLoading(true);
      await approveReview({ reviewId, reviewedBy: currentUserId! });
      toast.success("Review approved");
      // Only clear field if this was the last pending review
      if (reviews?.length === 1) {
        setValue("");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve review",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async (reviewId: Id<"translationReviews">) => {
    try {
      setReviewLoading(true);
      await rejectReview({ reviewId, reviewedBy: currentUserId! });
      toast.error("Review rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject review",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCancel = async (reviewId: Id<"translationReviews">) => {
    try {
      setReviewLoading(true);
      await cancelReview({ reviewId, userId: currentUserId! });
      toast.success("Review cancelled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel review",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  return (
     <div className="border-t">
       <div className="flex items-start hover:bg-muted/30 transition-colors group">
         <div className="w-[200px] px-6 py-3 text-right text-sm text-muted-foreground border-r">
           {getLocaleName(locale.code)}
         </div>
         <div className="flex-1 px-4 py-2">
           <Textarea
             ref={textareaRef}
             placeholder={`Enter ${getLocaleName(locale.code)} translation...`}
             rows={1}
             value={value}
             onChange={(e) => setValue(e.target.value)}
             onBlur={handleBlur}
             className="field-sizing-content w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[32px] px-2 py-1 placeholder:text-muted-foreground/70"
           />
         </div>
         <div className="w-[120px] px-4 pt-2 flex items-start justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           {value && (
             <Button
               size="sm"
               variant="ghost"
               onClick={handleCopy}
               className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
             >
               <Copy className="h-3 w-3" />
             </Button>
           )}
         </div>
         <div className="w-[40px] px-2 pt-2 flex items-start justify-center">
           <StatusIndicator status={status} />
         </div>
         <div className="w-[60px] px-4 pt-3 text-right text-xs text-muted-foreground font-mono">
           {value.length}
         </div>
       </div>
       {reviews && reviews.length > 0 && (
         <PendingReviewStack
           reviews={reviews}
           currentUserId={currentUserId}
           onApprove={handleApprove}
           onReject={handleReject}
           onCancel={handleCancel}
           isLoading={reviewLoading}
         />
       )}
     </div>
   );
 }

function StatusIndicator({ status }: { status: TranslationStatus }) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center justify-center w-6 h-6 rounded">
      {status === "pending" && (
        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      )}
      {status === "success" && <Check className="h-4 w-4 text-green-500" />}
      {status === "error" && <X className="h-4 w-4 text-red-500" />}
    </div>
  );
}
