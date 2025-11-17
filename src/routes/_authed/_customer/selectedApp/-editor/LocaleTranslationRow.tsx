import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { PendingReviewStack } from "./PendingReviewStack";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "@tanstack/react-query";

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
  reviews?: any[];
  keyId: Id<"keys">;
}

export function LocaleTranslationRow({
  locale,
  translation,
  keyId,
  reviews,
}: LocaleTranslationRowProps) {
  const [value, setValue] = useState(translation?.value || "");
  const { data: currentUser } = useQuery(
    convexQuery(api.users.getCurrentUserRecord, {}),
  );
  const { mutateAsync: upsertTranslation } = useMutation({
    mutationFn: useConvexMutation(api.translations.upsert),
    onError: () => {
      setTranslationStatus("error");
      setTimeout(() => {
        setTranslationStatus("idle");
      }, 600);
    },
  });
  const [translationStatus, setTranslationStatus] =
    useState<TranslationStatus>("idle");

  const handleUpdateTranslation = async (
    localeId: Id<"globalLocales">,
    value: string,
  ) => {
    if (!value || !currentUser) return;

    setTranslationStatus("pending");

    await upsertTranslation({
      keyId,
      localeId: localeId,
      value,
    });

    setTranslationStatus("success");
    setTimeout(() => {
      setTranslationStatus("idle");
    }, 600);
  };

  useEffect(() => {
    setValue(translation?.value || "");
  }, [translation?.value]);

  const handleBlur = async () => {
    if (value !== (translation?.value || "")) {
      await handleUpdateTranslation(locale._id, value);
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

  return (
    <div className="border-t">
      <div className="flex items-start hover:bg-muted/30 transition-colors group">
        <div className="w-[200px] px-6 py-3 text-right text-sm text-muted-foreground">
          {getLocaleName(locale.code)}
        </div>
        <div className="border-l border-muted flex-1 px-4 py-2">
          <TranslationTextArea
            locale={locale}
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
          <StatusIndicator status={translationStatus} />
        </div>
        <div className="w-[60px] px-4 pt-3 text-right text-xs text-muted-foreground font-mono">
          {value.length}
        </div>
      </div>
      {reviews && reviews.length > 0 && (
        <PendingReviewStack reviews={reviews} />
      )}
    </div>
  );
}

type TranslationTextAreaProps = {
  locale: Locale;
} & React.ComponentProps<"textarea">;

const TranslationTextArea = ({
  locale,
  ...props
}: TranslationTextAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [props.value]);

  return (
    <Textarea
      ref={textareaRef}
      {...props}
      lang={locale.code}
      className="field-sizing-content w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[32px] px-2 py-1 placeholder:text-muted-foreground/70"
    />
  );
};

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
