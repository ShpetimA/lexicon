import { createContext, useContext, useState, ReactNode } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { BulkActionType, StepType, Locale, BulkResult } from "./types";

interface BulkActionsContextValue {
  // Step navigation
  step: StepType;
  setStep: (step: StepType) => void;
  
  // Action type
  actionType: BulkActionType | null;
  setActionType: (type: BulkActionType | null) => void;
  
  // Locales
  locales: Locale[];
  sourceLocaleId: Id<"globalLocales"> | null;
  setSourceLocaleId: (id: Id<"globalLocales"> | null) => void;
  
  // Target locales (for translate actions)
  targetLocaleIds: Set<Id<"globalLocales">>;
  setTargetLocaleIds: (ids: Set<Id<"globalLocales">>) => void;
  
  // Copy target (for copy action)
  copyTargetLocaleId: Id<"globalLocales"> | null;
  setCopyTargetLocaleId: (id: Id<"globalLocales"> | null) => void;
  
  // Instructions
  instructions: string;
  setInstructions: (instructions: string) => void;
  
  // Key selection
  selectedKeys: Set<string>;
  setSelectedKeys: (keys: Set<string>) => void;
  
  // Processing
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
  results: BulkResult[];
  setResults: (results: BulkResult[]) => void;
  
  // Other
  appId: Id<"apps">;
  totalKeys: number;
}

const BulkActionsContext = createContext<BulkActionsContextValue | null>(null);

export function useBulkActions() {
  const context = useContext(BulkActionsContext);
  if (!context) {
    throw new Error("useBulkActions must be used within BulkActionsProvider");
  }
  return context;
}

interface BulkActionsProviderProps {
  children: ReactNode;
  appId: Id<"apps">;
  locales: Locale[];
  totalKeys: number;
  initialAction: BulkActionType | null;
}

export function BulkActionsProvider({
  children,
  appId,
  locales,
  totalKeys,
  initialAction,
}: BulkActionsProviderProps) {
  const [step, setStep] = useState<StepType>(initialAction ? "source" : "action");
  const [actionType, setActionType] = useState<BulkActionType | null>(initialAction);
  const [sourceLocaleId, setSourceLocaleId] = useState<Id<"globalLocales"> | null>(
    () => locales.find((l) => l.isDefault)?._id ?? null
  );
  const [targetLocaleIds, setTargetLocaleIds] = useState<Set<Id<"globalLocales">>>(
    new Set()
  );
  const [copyTargetLocaleId, setCopyTargetLocaleId] = useState<Id<"globalLocales"> | null>(null);
  const [instructions, setInstructions] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkResult[]>([]);

  const value: BulkActionsContextValue = {
    step,
    setStep,
    actionType,
    setActionType,
    locales,
    sourceLocaleId,
    setSourceLocaleId,
    targetLocaleIds,
    setTargetLocaleIds,
    copyTargetLocaleId,
    setCopyTargetLocaleId,
    instructions,
    setInstructions,
    selectedKeys,
    setSelectedKeys,
    isProcessing,
    setIsProcessing,
    progress,
    setProgress,
    results,
    setResults,
    appId,
    totalKeys,
  };

  return (
    <BulkActionsContext.Provider value={value}>
      {children}
    </BulkActionsContext.Provider>
  );
}
