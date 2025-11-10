import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

type Translation = {
  _id: Id<"translations">;
  value: string;
  keyId: Id<"keys">;
  localeId: Id<"locales">;
  updatedBy: Id<"users">;
  updatedAt: number;
};

type Locale = {
  _id: Id<"locales">;
  code: string;
  isDefault: boolean;
  appId: Id<"apps">;
  createdAt: number;
};

interface AutoTranslateButtonProps {
  keyId: string;
  translations: Translation[];
  locales: Locale[];
}

export function AutoTranslateButton({}: AutoTranslateButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
      disabled={true}
      title="Auto-translate feature coming soon"
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}
