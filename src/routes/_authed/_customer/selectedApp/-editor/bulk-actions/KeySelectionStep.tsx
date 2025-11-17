import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useConvexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { useBulkActions } from "./context";
import { Search } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

export function KeySelectionStep() {
  const {
    appId,
    selectedKeys,
    setSelectedKeys,
    actionType,
    sourceLocaleId,
    locales,
  } = useBulkActions();

  const [searchTerm, setSearchTerm] = useState("");

  const editorData = useConvexQuery(api.translations.getEditorData, {
    appId,
    page: 1,
    limit: 1000,
    search: "",
  });

  const keys: Doc<"keys">[] = useMemo(() => {
    if (!editorData?.data) return [];
    return Object.values(editorData.data).map((item) => item.key);
  }, [editorData]);

  const sourceLocale = locales.find((l) => l._id === sourceLocaleId);

  const filteredKeys = useMemo(() => {
    let filtered = keys;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((key: Doc<"keys">) =>
        key.name.toLowerCase().includes(search),
      );
    }

    if (actionType === "fillMissing" && editorData?.data) {
      filtered = filtered.filter((key: Doc<"keys">) => {
        const keyData = editorData.data[key.name];
        if (!keyData) return true;

        const translations = keyData.translations;
        return (
          translations.length === 0 || translations.some((t: any) => !t.value)
        );
      });
    }

    return filtered;
  }, [keys, searchTerm, actionType, editorData]);

  const handleToggleKey = (keyName: string) => {
    const newSet = new Set(selectedKeys);
    if (newSet.has(keyName)) {
      newSet.delete(keyName);
    } else {
      newSet.add(keyName);
    }
    setSelectedKeys(newSet);
  };

  const handleSelectAll = () => {
    setSelectedKeys(new Set(filteredKeys.map((k: Doc<"keys">) => k.name)));
  };

  const handleDeselectAll = () => {
    setSelectedKeys(new Set());
  };

  const getKeyStatus = (keyName: string) => {
    if (!editorData?.data) return null;
    const keyData = editorData.data[keyName];
    if (!keyData) return { status: "missing", sourceText: null };

    const sourceTranslation = keyData.translations.find(
      (t: any) => t.localeId === sourceLocaleId,
    );

    if (!sourceTranslation?.value) {
      return {
        status: "no-source",
        sourceText: null,
      };
    }

    return {
      status: "ready",
      sourceText: sourceTranslation.value,
    };
  };

  return (
    <div className="space-y-4 h-full overflow-hidden">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          Select All ({filteredKeys.length})
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
        >
          Deselect All
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedKeys.size} of {filteredKeys.length} keys selected
      </div>

      <div className="space-y-2 h-full overflow-y-auto pb-40">
        {filteredKeys.map((key: Doc<"keys">) => {
          const keyInfo = getKeyStatus(key.name);
          if (!keyInfo) return null;

          const { status, sourceText } = keyInfo;

          return (
            <div
              key={key._id}
              className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent/50"
            >
              <Checkbox
                id={`key-${key._id}`}
                checked={selectedKeys.has(key.name)}
                onCheckedChange={() => handleToggleKey(key.name)}
                disabled={status === "no-source"}
                className="mt-1"
              />
              <Label
                htmlFor={`key-${key._id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.name}</span>
                    {status === "no-source" && (
                      <Badge variant="destructive" className="text-xs">
                        No {sourceLocale?.code} translation
                      </Badge>
                    )}
                    {status === "missing" && actionType === "fillMissing" && (
                      <Badge variant="secondary" className="text-xs">
                        Missing translations
                      </Badge>
                    )}
                  </div>
                  {sourceText && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{sourceLocale?.code}:</span>{" "}
                      {sourceText}
                    </div>
                  )}
                  {key.description && (
                    <div className="text-xs text-muted-foreground italic">
                      {key.description}
                    </div>
                  )}
                </div>
              </Label>
            </div>
          );
        })}

        {filteredKeys.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No keys match your search" : "No keys available"}
          </div>
        )}
      </div>
    </div>
  );
}
