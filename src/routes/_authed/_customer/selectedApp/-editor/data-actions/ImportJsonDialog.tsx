import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/shadcn-io/dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, FileJson } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

type Locale = {
  _id: Id<"globalLocales">;
  code: string;
  isDefault: boolean;
};

interface ImportJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: Id<"apps">;
  locales: Locale[];
}

type ParsedData = {
  keyName: string;
  value: string;
}[];

type MultiLangParsedData = {
  [localeCode: string]: ParsedData;
};

export function ImportJsonDialog({
  open,
  onOpenChange,
  appId,
  locales,
}: ImportJsonDialogProps) {
  const [selectedLocale, setSelectedLocale] =
    useState<Id<"globalLocales"> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [multiLangData, setMultiLangData] =
    useState<MultiLangParsedData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const { mutateAsync: importTranslations, isPending: isImporting } =
    useMutation({
      mutationFn: useConvexMutation(
        api.translations.createBatchWithTranslations,
      ),
      onError: () => {
        toast.error("Failed to import translations");
      },
    });

  const handleFileSelect = async (files: File[]) => {
    const selectedFile = files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setParsedData(null);
    setMultiLangData(null);

    try {
      const text = await selectedFile.text();
      const json = JSON.parse(text);

      const flattenObject = (obj: any, prefix = ""): ParsedData => {
        const translations: ParsedData = [];
        for (const key in obj) {
          const value = obj[key];
          const fullKey = prefix ? `${prefix}.${key}` : key;

          if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            translations.push(...flattenObject(value, fullKey));
          } else {
            translations.push({
              keyName: fullKey,
              value: String(value),
            });
          }
        }
        return translations;
      };

      const topLevelKeys = Object.keys(json);
      const isMultiLang = topLevelKeys.some((key) =>
        locales.some(
          (locale) => locale.code.toLowerCase() === key.toLowerCase(),
        ),
      );

      if (isMultiLang) {
        const multiLang: MultiLangParsedData = {};
        let totalTranslations = 0;

        for (const localeCode in json) {
          const translations = flattenObject(json[localeCode]);
          if (translations.length > 0) {
            multiLang[localeCode] = translations;
            totalTranslations += translations.length;
          }
        }

        if (totalTranslations === 0) {
          setParseError("No translations found in JSON file");
          return;
        }

        setMultiLangData(multiLang);
      } else {
        const translations = flattenObject(json);

        if (translations.length === 0) {
          setParseError("No translations found in JSON file");
          return;
        }

        setParsedData(translations);
      }
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Failed to parse JSON file",
      );
    }
  };

  const handleImport = async () => {
    if (multiLangData) {
      let totalKeys = 0;
      let totalTranslations = 0;

      for (const localeCode in multiLangData) {
        const locale = locales.find(
          (l) => l.code.toLowerCase() === localeCode.toLowerCase(),
        );

        if (locale) {
          const result = await importTranslations({
            appId,
            localeId: locale._id,
            translations: multiLangData[localeCode],
          });
          totalKeys += result.keys;
          totalTranslations += result.translations;
        }
      }

      toast.success(
        `Imported ${totalKeys} keys and ${totalTranslations} translations across ${Object.keys(multiLangData).length} locales`,
      );
    } else if (parsedData && selectedLocale) {
      const result = await importTranslations({
        appId,
        localeId: selectedLocale,
        translations: parsedData,
      });

      toast.success(
        `Imported ${result.keys} keys and ${result.translations} translations`,
      );
    }

    handleCancel();
  };

  const handleCancel = () => {
    setFile(null);
    setParsedData(null);
    setMultiLangData(null);
    setParseError(null);
    setSelectedLocale(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import JSON Translations</DialogTitle>
          <DialogDescription>
            Upload an i18n JSON file. Supports single-language or multi-language
            format (e.g., {`{en: {...}, sq: {...}}`})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!multiLangData && (
            <div className="space-y-2">
              <Label>Target Locale</Label>
              <Select
                value={selectedLocale || undefined}
                onValueChange={(value) =>
                  setSelectedLocale(value as Id<"globalLocales">)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a locale" />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((locale) => (
                    <SelectItem key={locale._id} value={locale._id}>
                      {locale.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>JSON File</Label>
            <Dropzone
              accept={{ "application/json": [".json"] }}
              maxFiles={1}
              maxSize={5 * 1024 * 1024} // 5MB
              onDrop={handleFileSelect}
              src={file ? [file] : undefined}
            >
              <DropzoneEmptyState />
              <DropzoneContent>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <FileJson className="h-4 w-4" />
                  </div>
                  <p className="my-2 w-full truncate font-medium text-sm">
                    {file?.name}
                  </p>
                  <p className="w-full text-wrap text-muted-foreground text-xs">
                    Click to replace
                  </p>
                </div>
              </DropzoneContent>
            </Dropzone>
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {parsedData && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Found {parsedData.length} translation
                {parsedData.length !== 1 ? "s" : ""} in file
              </AlertDescription>
            </Alert>
          )}

          {multiLangData && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Found {Object.keys(multiLangData).length} language
                {Object.keys(multiLangData).length !== 1 ? "s" : ""}:{" "}
                {Object.keys(multiLangData).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          {parsedData && parsedData.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (first 5 keys)</Label>
              <div className="rounded-md border p-3 space-y-1.5 max-h-40 overflow-y-auto">
                {parsedData.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-mono text-muted-foreground">
                      {item.keyName}:
                    </span>{" "}
                    <span className="text-foreground">{item.value}</span>
                  </div>
                ))}
                {parsedData.length > 5 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    ... and {parsedData.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {multiLangData && (
            <div className="space-y-2">
              <Label>Preview by Locale</Label>
              <div className="rounded-md border p-3 space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(multiLangData).map(
                  ([localeCode, translations]) => (
                    <div key={localeCode} className="space-y-1">
                      <div className="font-semibold text-sm">
                        {localeCode.toUpperCase()} ({translations.length}{" "}
                        translations)
                      </div>
                      {translations.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-sm pl-3">
                          <span className="font-mono text-muted-foreground text-xs">
                            {item.keyName}:
                          </span>{" "}
                          <span className="text-foreground text-xs">
                            {item.value}
                          </span>
                        </div>
                      ))}
                      {translations.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-3">
                          ... and {translations.length - 3} more
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              isImporting ||
              (!multiLangData && (!selectedLocale || !parsedData)) ||
              (!!multiLangData && Object.keys(multiLangData).length === 0)
            }
          >
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
