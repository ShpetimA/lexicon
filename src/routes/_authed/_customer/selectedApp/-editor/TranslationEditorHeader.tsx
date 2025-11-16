import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, Plus, Search } from "lucide-react";

interface TranslationEditorHeaderProps {
  onExport: () => void;
  onAddKey: () => void;
  onSearch: (value: string) => void;
  keyCount: number;
  localeCount: number;
}

export function TranslationEditorHeader({
  onExport,
  onAddKey,
  onSearch,
  keyCount,
  localeCount,
}: TranslationEditorHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">AX</span>
          </div>
          <h1 className="text-3xl font-bold">Translation Editor</h1>
        </div>
        <p className="text-muted-foreground">
          {keyCount} keys • {localeCount} locales
        </p>
      </div>
      <div className="flex space-x-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search keys..."
            className="pl-10 w-64"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onExport}>
          <FileDown className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button
          variant="outline"
          onClick={onAddKey}
          className="bg-white text-black border-gray-300"
        >
          <Plus className="h-4 w-4 mr-2" />+ Add Key
        </Button>
      </div>
    </div>
  );
}
