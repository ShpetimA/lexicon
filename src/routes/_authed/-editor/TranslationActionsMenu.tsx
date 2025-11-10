import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Upload, Eye, Send, MoreHorizontal } from "lucide-react";

export function TranslationActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled>
          <Upload className="h-4 w-4 mr-2" />
          Import Translations
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Download className="h-4 w-4 mr-2" />
          Export Snapshot
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Eye className="h-4 w-4 mr-2" />
          Preview Snapshot
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Send className="h-4 w-4 mr-2" />
          Publish Snapshot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
