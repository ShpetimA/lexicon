import { createContext, useContext, useState, ReactNode } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface ScrapedTranslation {
  keyName: string;
  value: string;
  selected: boolean;
}

interface ScrapeContextValue {
  scrapedData: ScrapedTranslation[];
  setScrapedData: (data: ScrapedTranslation[]) => void;
  scrapedUrl: string;
  setScrapedUrl: (url: string) => void;
  selectedLocaleId: Id<"globalLocales"> | "";
  setSelectedLocaleId: (id: Id<"globalLocales"> | "") => void;
  step: "input" | "review";
  setStep: (step: "input" | "review") => void;
}

const ScrapeContext = createContext<ScrapeContextValue | null>(null);

export function useScrapeContext() {
  const context = useContext(ScrapeContext);
  if (!context) {
    throw new Error("useScrapeContext must be used within ScrapeProvider");
  }
  return context;
}

export function ScrapeProvider({ children }: { children: ReactNode }) {
  const [scrapedData, setScrapedData] = useState<ScrapedTranslation[]>([]);
  const [scrapedUrl, setScrapedUrl] = useState("");
  const [selectedLocaleId, setSelectedLocaleId] = useState<Id<"globalLocales"> | "">("");
  const [step, setStep] = useState<"input" | "review">("input");

  return (
    <ScrapeContext.Provider
      value={{
        scrapedData,
        setScrapedData,
        scrapedUrl,
        setScrapedUrl,
        selectedLocaleId,
        setSelectedLocaleId,
        step,
        setStep,
      }}
    >
      {children}
    </ScrapeContext.Provider>
  );
}
