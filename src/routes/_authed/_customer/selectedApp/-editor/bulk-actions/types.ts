import type { Id } from "@/convex/_generated/dataModel";

export type BulkActionType = "translateAll" | "fillMissing" | "copyLocale";

export type StepType =
  | "action"
  | "source"
  | "targets"
  | "copyTarget"
  | "instructions"
  | "keySelection"
  | "confirm"
  | "processing";

export interface Locale {
  _id: Id<"globalLocales">;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  appLocaleId: Id<"appLocales">;
  addedAt: number;
}

export interface BulkResult {
  keyName: string;
  locale?: string;
  success: boolean;
  error?: string;
  requiresReview?: boolean;
}

export interface InstructionTemplate {
  _id: string;
  name: string;
  instructions: string;
}
