import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ReviewTranslationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue?: string;
  proposedValue: string;
  keyName: string;
  localeName: string;
  onApprove: () => void | Promise<void>;
  onReject: (comment?: string) => void | Promise<void>;
}

export function ReviewTranslationDialog({
  open,
  onOpenChange,
  currentValue,
  proposedValue,
  keyName,
  localeName,
  onApprove,
  onReject,
}: ReviewTranslationDialogProps) {
  const [rejectComment, setRejectComment] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    await onApprove();
    onOpenChange(false);
  };

  const handleReject = async () => {
    setIsRejecting(true);
  };

  const confirmReject = async () => {
    await onReject(rejectComment || undefined);
    setRejectComment("");
    setIsRejecting(false);
    onOpenChange(false);
  };

  const cancelReject = () => {
    setRejectComment("");
    setIsRejecting(false);
  };

  if (isRejecting) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Translation</AlertDialogTitle>
            <AlertDialogDescription>
              Add an optional comment explaining why you're rejecting this
              change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Explain why this change is being rejected..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReject}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject}>
              Reject Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Review Translation Change</AlertDialogTitle>
          <AlertDialogDescription>
            Review the proposed change for {keyName} in {localeName}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          {currentValue && (
            <div>
              <div className="text-sm font-medium mb-2">Current Value:</div>
              <div className="text-sm bg-muted px-3 py-2 rounded">
                {currentValue}
              </div>
            </div>
          )}
          <div>
            <div className="text-sm font-medium mb-2">Proposed Value:</div>
            <div className="text-sm bg-primary/10 px-3 py-2 rounded">
              {proposedValue}
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={handleReject} className="bg-destructive">
            Reject
          </AlertDialogAction>
          <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
