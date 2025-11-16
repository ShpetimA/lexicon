import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useBulkActions } from "./context";

export function ProcessingStep() {
  const { progress, results, isProcessing } = useBulkActions();

  return (
    <div className="space-y-4">
      <Progress value={progress} />
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border rounded-md"
          >
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {result.keyName}
              </span>
              {result.locale && (
                <span className="text-xs text-muted-foreground">
                  {result.locale}
                </span>
              )}
            </div>
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">
                  {result.error}
                </span>
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && results.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
