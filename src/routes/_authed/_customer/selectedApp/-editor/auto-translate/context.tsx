import { createContext, useContext, useState, useRef, ReactNode } from "react";
import type { Id, Doc } from "@/convex/_generated/dataModel";

export type TranslationStep =
  | "source"
  | "sourceText"
  | "targets"
  | "instructions"
  | "translating";

export type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  appLocaleId: Id<"appLocales">;
  addedAt: number;
};

export interface TranslationResult {
  locale: string;
  success: boolean;
  error?: string;
  requiresReview?: boolean;
}

interface AutoTranslateContextValue {
  step: TranslationStep;
  setStep: (step: TranslationStep) => void;

  sourceLocaleId: Id<"globalLocales"> | null;
  setSourceLocaleId: (id: Id<"globalLocales"> | null) => void;

  sourceTextRef: React.MutableRefObject<string>;

  targetLocaleIds: Set<Id<"globalLocales">>;
  setTargetLocaleIds: (ids: Set<Id<"globalLocales">>) => void;

  instructionsRef: React.MutableRefObject<string>;

  selectedTemplateIdRef: React.MutableRefObject<string>;

  isTranslating: boolean;
  setIsTranslating: (translating: boolean) => void;

  progress: number;
  setProgress: (progress: number) => void;

  results: TranslationResult[];
  setResults: (results: TranslationResult[]) => void;

  keyId: Id<"keys">;
  translations: Doc<"translations">[];
  locales: Locale[];
  appId: Id<"apps">;

  hasTranslation: (localeId: Id<"globalLocales">) => boolean;
  resetDrawer: () => void;
}

const AutoTranslateContext = createContext<AutoTranslateContextValue | null>(
  null,
);

export function useAutoTranslate() {
  const context = useContext(AutoTranslateContext);
  if (!context) {
    throw new Error(
      "useAutoTranslate must be used within AutoTranslateProvider",
    );
  }
  return context;
}

interface AutoTranslateProviderProps {
  children: ReactNode;
  keyId: Id<"keys">;
  translations: Doc<"translations">[];
  locales: Locale[];
  appId: Id<"apps">;
}

export function AutoTranslateProvider({
  children,
  keyId,
  translations,
  locales,
  appId,
}: AutoTranslateProviderProps) {
  const [step, setStep] = useState<TranslationStep>("source");
  const [sourceLocaleId, setSourceLocaleId] =
    useState<Id<"globalLocales"> | null>(
      () => locales.find((l) => l.isDefault)?._id ?? null,
    );
  const sourceTextRef = useRef("");
  const [targetLocaleIds, setTargetLocaleIds] = useState<
    Set<Id<"globalLocales">>
  >(new Set());
  const instructionsRef = useRef("");
  const selectedTemplateIdRef = useRef<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TranslationResult[]>([]);

  const hasTranslation = (localeId: Id<"globalLocales">) => {
    return translations.some((t) => t.localeId === localeId && t.value);
  };

  const resetDrawer = () => {
    setStep("source");
    setSourceLocaleId(locales.find((l) => l.isDefault)?._id ?? null);
    sourceTextRef.current = "";
    setTargetLocaleIds(new Set());
    instructionsRef.current = "";
    selectedTemplateIdRef.current = "";
    setProgress(0);
    setResults([]);
  };

  const value: AutoTranslateContextValue = {
    step,
    setStep,
    sourceLocaleId,
    setSourceLocaleId,
    sourceTextRef,
    targetLocaleIds,
    setTargetLocaleIds,
    instructionsRef,
    selectedTemplateIdRef,
    isTranslating,
    setIsTranslating,
    progress,
    setProgress,
    results,
    setResults,
    keyId,
    translations,
    locales,
    appId,
    hasTranslation,
    resetDrawer,
  };

  return (
    <AutoTranslateContext.Provider value={value}>
      {children}
    </AutoTranslateContext.Provider>
  );
}
