import { findOptions, insertSubmission } from "@/server/models/form.model";
import type { SheetOption, FormData, SubmitResult } from "@/server/types";

export function getSheetData(): SheetOption[] {
  return findOptions();
}

export function submitForm(formData: FormData): SubmitResult {
  insertSubmission(formData);
  return { success: true, message: "送出成功！" };
}
