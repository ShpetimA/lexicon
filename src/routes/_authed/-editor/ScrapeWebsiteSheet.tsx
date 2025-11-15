import { useState } from "react";
import { useAction } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface ScrapedTranslation {
  keyName: string;
  value: string;
  selected: boolean;
}

interface ScrapeWebsiteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: Id<"apps">;
  locales: Array<{ _id: Id<"locales">; code: string; isDefault: boolean }>;
  onComplete: (
    localeId: Id<"locales">,
    translations: Array<{ keyName: string; value: string }>,
  ) => void;
}

type Step = "input" | "review";

export function ScrapeWebsiteSheet({
  open,
  onOpenChange,
  appId,
  locales,
  onComplete,
}: ScrapeWebsiteSheetProps) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [scrapedUrl, setScrapedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedTranslation[]>([]);
  const [selectedLocaleId, setSelectedLocaleId] = useState<Id<"locales"> | "">(
    "",
  );

  const scrapeWebsite = useAction(api.firecrawl.scrapeWebsite);

  const handleScrape = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    try {
      const result = await scrapeWebsite({ url });
      const translations: ScrapedTranslation[] = Object.entries(result).map(
        ([keyName, value]) => ({
          keyName,
          value,
          selected: true,
        }),
      );
      setScrapedData(translations);
      setScrapedUrl(url);
      setStep("review");
      toast.success(`Scraped ${translations.length} text items`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to scrape website",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyNameChange = (index: number, newName: string) => {
    setScrapedData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, keyName: newName } : item,
      ),
    );
  };

  const handleToggleSelection = (index: number) => {
    setScrapedData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const handleSelectAll = () => {
    const allSelected = scrapedData.every((item) => item.selected);
    setScrapedData((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected })),
    );
  };

  const handleApply = () => {
    if (!selectedLocaleId) {
      toast.error("Please select a locale");
      return;
    }

    const selectedTranslations = scrapedData
      .filter((item) => item.selected)
      .map(({ keyName, value }) => ({ keyName, value }));

    if (selectedTranslations.length === 0) {
      toast.error("Please select at least one translation");
      return;
    }

    onComplete(selectedLocaleId, selectedTranslations);
    handleClose();
  };

  const handleClose = () => {
    setStep("input");
    setUrl("");
    setScrapedUrl("");
    setScrapedData([]);
    setSelectedLocaleId("");
    onOpenChange(false);
  };

  const selectedCount = scrapedData.filter((item) => item.selected).length;
  const defaultLocale = locales.find((l) => l.isDefault);

  if (step === "review" && !selectedLocaleId && defaultLocale) {
    setSelectedLocaleId(defaultLocale._id);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        className={`flex flex-col ${step === "review" ? "w-full sm:max-w-none" : "w-[600px] sm:max-w-[600px]"}`}
      >
        <SheetHeader>
          <SheetTitle>
            {step === "input"
              ? "Import from Website"
              : "Review Scraped Content"}
          </SheetTitle>
          <SheetDescription>
            {step === "input"
              ? "Enter a website URL to extract all text content"
              : `Review and edit ${scrapedData.length} extracted items before importing`}
          </SheetDescription>
        </SheetHeader>

        {step === "input" && (
          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      handleScrape();
                    }
                  }}
                />
                <Button onClick={handleScrape} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Scraping..." : "Scrape"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                AI will extract all text content and generate translation keys
              </p>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="grid grid-cols-2 gap-4 overflow-y-auto">
            <div className="hidden lg:flex flex-1 flex-col border rounded-lg bg-muted overflow-hidden">
              <div className="bg-muted-foreground/10 px-3 py-2 border-b text-xs font-medium text-muted-foreground truncate">
                {scrapedUrl}
              </div>
              <iframe
                key={scrapedUrl}
                src={scrapedUrl}
                className="flex-1 w-full border-0"
                title="Website preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>

            <div className="lex flex-col gap-4 overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="locale">Target Locale</Label>
                <Select
                  value={selectedLocaleId}
                  onValueChange={(value) =>
                    setSelectedLocaleId(value as Id<"locales">)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select locale" />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((locale) => (
                      <SelectItem key={locale._id} value={locale._id}>
                        {locale.code}
                        {locale.isDefault && " (default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={scrapedData.every((item) => item.selected)}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label
                    htmlFor="select-all"
                    className="cursor-pointer text-sm"
                  >
                    Select all ({selectedCount}/{scrapedData.length})
                  </Label>
                </div>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-3 pb-4">
                  {scrapedData.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 space-y-2 bg-card"
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`item-${index}`}
                          checked={item.selected}
                          onCheckedChange={() => handleToggleSelection(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <Label
                              htmlFor={`key-${index}`}
                              className="text-xs text-muted-foreground"
                            >
                              Key Name
                            </Label>
                            <Input
                              id={`key-${index}`}
                              value={item.keyName}
                              onChange={(e) =>
                                handleKeyNameChange(index, e.target.value)
                              }
                              className="font-mono text-sm"
                              disabled={!item.selected}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Value
                            </Label>
                            <p className="text-sm p-2 bg-muted rounded border max-h-20 overflow-y-auto">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <SheetFooter>
          {step === "input" ? (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>
                Back
              </Button>
              <Button
                onClick={handleApply}
                disabled={selectedCount === 0 || !selectedLocaleId}
              >
                Apply {selectedCount > 0 && `(${selectedCount})`}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
