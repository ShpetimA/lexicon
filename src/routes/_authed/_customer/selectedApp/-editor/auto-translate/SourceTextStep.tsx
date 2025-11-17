import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAutoTranslate } from "./context";

export function SourceTextStep() {
  const { sourceTextRef, locales, sourceLocaleId } = useAutoTranslate();
  const [localSourceText, setLocalSourceText] = useState(sourceTextRef.current);

  const handleChange = (value: string) => {
    sourceTextRef.current = value;
    setLocalSourceText(value);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The selected source language does not have a translation yet. Please
        enter the text to translate.
      </p>
      <Textarea
        placeholder={`Enter text in ${locales.find((l) => l._id === sourceLocaleId)?.code}...`}
        value={localSourceText}
        onChange={(e) => handleChange(e.target.value)}
        rows={10}
        className="resize-none"
      />
    </div>
  );
}
