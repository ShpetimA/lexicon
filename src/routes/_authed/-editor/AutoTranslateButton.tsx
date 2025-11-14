import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

interface AutoTranslateButtonProps {
  keyId: Id<"keys">;
  translations: Doc<"translations">[];
  locales: Locale[];
}

export function AutoTranslateButton({ keyId }: AutoTranslateButtonProps) {
  const autoTranslateMutation = useConvexAction(api.translations.autoTranslate);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleAutoTranslate = async (keyId: Id<"keys">) => {
    try {
      setIsTranslating(true);
      const results = await autoTranslateMutation({ keyId: keyId });
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success(`Translated to ${successCount} locales`);
      } else {
        toast.warning(
          `Translated to ${successCount} locales, ${failCount} failed`,
        );
      }
    } catch (error) {
      toast.error("Failed to auto-translate");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
      disabled={isTranslating}
      onClick={() => handleAutoTranslate(keyId)}
      title="Auto-translate to all locales"
    >
      {isTranslating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Languages className="h-4 w-4" />
      )}
    </Button>
  );
}
