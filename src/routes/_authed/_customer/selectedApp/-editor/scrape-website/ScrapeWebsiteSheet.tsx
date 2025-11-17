import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrapeProvider, useScrapeContext } from "./ScrapeContext";
import { NewScrapeForm } from "./NewScrapeForm";
import { ScrapeJobsList } from "./ScrapeJobsList";
import { ReviewScrapeResults } from "./ReviewScrapeResults";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useApp } from "@/src/routes/_authed/_customer/selectedApp";

type ScrapeWebsiteSheetContentProps = {
  onComplete: (
    localeId: Id<"globalLocales">,
    translations: Array<{ keyName: string; value: string }>,
  ) => Promise<void>;
} & ScrapeWebsiteSheetProps;

type ScrapeWebsiteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: Id<"apps">;
  locales: Array<{
    _id: Id<"globalLocales">;
    code: string;
    isDefault: boolean;
  }>;
};

function ScrapeWebsiteSheetContent({
  appId,
  locales,
  onComplete,
  onOpenChange,
}: ScrapeWebsiteSheetContentProps) {
  const {
    step,
    setStep,
    scrapedData,
    setScrapedData,
    setScrapedUrl,
    selectedLocaleId,
    setSelectedLocaleId,
  } = useScrapeContext();

  const defaultLocale = locales.find((l) => l.isDefault);

  useEffect(() => {
    if (step === "review" && !selectedLocaleId && defaultLocale) {
      setSelectedLocaleId(defaultLocale._id);
    }
  }, [step, selectedLocaleId, defaultLocale, setSelectedLocaleId]);

  const { data: userJobs } = useQuery(
    convexQuery(api.scrapeJobs.listUserScrapeJobs, { appId }),
  );

  const handleScrapeComplete = (
    result: Record<string, string>,
    url: string,
  ) => {
    const translations = Object.entries(result).map(([keyName, value]) => ({
      keyName,
      value: value as string,
      selected: true,
    }));
    setScrapedData(translations);
    setScrapedUrl(url);
    setStep("review");
  };

  const handleViewResults = (jobId: Id<"scrapeJobs">) => {
    const job = userJobs?.find((j) => j._id === jobId);
    if (job?.result) {
      try {
        const result = JSON.parse(job.result);
        handleScrapeComplete(result, job.url);
      } catch (error) {
        toast.error("Failed to parse job results");
      }
    }
  };

  const handleApply = (
    localeId: Id<"globalLocales">,
    translations: Array<{ keyName: string; value: string }>,
  ) => {
    onComplete(localeId, translations);
    handleClose();
  };

  const handleClose = () => {
    setStep("input");
    setScrapedData([]);
    setScrapedUrl("");
    setSelectedLocaleId("");
    onOpenChange(false);
  };

  if (step === "review") {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Review Scraped Content</SheetTitle>
          <SheetDescription>
            Review and edit {scrapedData.length} extracted items before
            importing
          </SheetDescription>
        </SheetHeader>

        <ReviewScrapeResults
          locales={locales}
          onApply={handleApply}
          onBack={() => setStep("input")}
        />
      </>
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Import from Website</SheetTitle>
        <SheetDescription>
          Enter a website URL to extract all text content
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="new" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">New Scrape</TabsTrigger>
          <TabsTrigger value="jobs">
            Recent Jobs
            {userJobs && userJobs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {userJobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="flex-1">
          <NewScrapeForm appId={appId} onComplete={handleScrapeComplete} />
        </TabsContent>

        <TabsContent value="jobs" className="flex-1">
          <ScrapeJobsList appId={appId} onViewResults={handleViewResults} />
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <Button variant="outline" onClick={handleClose} className="w-full">
          Close
        </Button>
      </div>
    </>
  );
}

export function ScrapeWebsiteSheet(props: ScrapeWebsiteSheetProps) {
  const { open, onOpenChange } = props;
  const { selectedApp } = useApp();
  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.translations.createBatchWithTranslations),
    onError: () => {
      toast.error("Failed to import translations");
    },
  });

  const handleScrapedData = async (
    localeId: Id<"globalLocales">,
    translations: Array<{ keyName: string; value: string }>,
  ) => {
    try {
      const result = await mutateAsync({
        appId: selectedApp._id,
        localeId,
        translations,
      });

      toast.success(
        `Created ${result.keys} keys and ${result.translations} translations`,
      );
    } catch (error) {
      toast.error("Failed to import translations");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-none">
        <ScrapeProvider>
          <ScrapeWebsiteSheetContent
            {...props}
            onComplete={handleScrapedData}
          />
        </ScrapeProvider>
      </SheetContent>
    </Sheet>
  );
}
