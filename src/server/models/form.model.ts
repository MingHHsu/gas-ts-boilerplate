import { getSheet } from "@/server/utils";
import type { SheetOption, FormData } from "@/server/types";

const SHEET_OPTIONS = "Options";
const SHEET_SUBMISSIONS = "Submissions";

export function findOptions(): SheetOption[] {
  const sheet = getSheet(SHEET_OPTIONS);
  const rows = sheet.getDataRange().getValues();
  return rows.slice(1).map(rowToSheetOption);
}

export function insertSubmission(formData: FormData): void {
  const sheet = getSheet(SHEET_SUBMISSIONS);
  sheet.appendRow([
    new Date(),
    formData.name,
    formData.category,
    formData.note ?? "",
  ]);
}

function rowToSheetOption(row: unknown[]): SheetOption {
  return { id: String(row[0]), label: String(row[1]) };
}
