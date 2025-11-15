import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { AutoTranslateDrawer } from "./AutoTranslateDrawer";

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
  appId: Id<"apps">;
}

export function AutoTranslateButton({
  keyId,
  translations,
  locales,
  appId,
}: AutoTranslateButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
        onClick={() => setDrawerOpen(true)}
        title="Auto-translate to other locales"
      >
        <Languages className="h-4 w-4" />
      </Button>
      <AutoTranslateDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        keyId={keyId}
        translations={translations}
        locales={locales}
        appId={appId}
      />
    </>
  );
}
