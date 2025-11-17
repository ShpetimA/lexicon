import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { Id } from "@/convex/_generated/dataModel";
import { useScrapeContext } from "./ScrapeContext";

interface ReviewScrapeResultsProps {
  locales: Array<{
    _id: Id<"globalLocales">;
    code: string;
    isDefault: boolean;
  }>;
  onApply: (
    localeId: Id<"globalLocales">,
    translations: Array<{ keyName: string; value: string }>,
  ) => void;
  onBack: () => void;
}

export function ReviewScrapeResults({
  locales,
  onApply,
  onBack,
}: ReviewScrapeResultsProps) {
  const {
    scrapedData,
    setScrapedData,
    scrapedUrl,
    selectedLocaleId,
    setSelectedLocaleId,
  } = useScrapeContext();

  const handleKeyNameChange = (index: number, newName: string) => {
    setScrapedData(
      scrapedData.map((item, i) =>
        i === index ? { ...item, keyName: newName } : item,
      ),
    );
  };

  const handleToggleSelection = (index: number) => {
    setScrapedData(
      scrapedData.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const handleSelectAll = () => {
    const allSelected = scrapedData.every((item) => item.selected);
    setScrapedData(
      scrapedData.map((item) => ({ ...item, selected: !allSelected })),
    );
  };

  const handleApply = () => {
    if (!selectedLocaleId) return;

    const selectedTranslations = scrapedData
      .filter((item) => item.selected)
      .map(({ keyName, value }) => ({ keyName, value }));

    if (selectedTranslations.length === 0) return;

    onApply(selectedLocaleId, selectedTranslations);
  };

  const selectedCount = scrapedData.filter((item) => item.selected).length;

  return (
    <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1">
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

      <div className="flex flex-col gap-4 overflow-y-auto">
        <div className="grid gap-2">
          <Label htmlFor="locale">Target Locale</Label>
          <Select
            value={selectedLocaleId}
            onValueChange={(value) =>
              setSelectedLocaleId(value as Id<"globalLocales">)
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
            <Label htmlFor="select-all" className="cursor-pointer text-sm">
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

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedCount === 0 || !selectedLocaleId}
          >
            Apply {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
