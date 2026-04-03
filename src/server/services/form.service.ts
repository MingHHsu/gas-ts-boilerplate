import { findOptions, insertSubmission } from "@/server/models/form.model";
import type { SheetOption, FormData } from "@/server/types";

export function getOptions(): SheetOption[] {
  return findOptions();
}

export function submitForm(formData: FormData): void {
  if (!formData.name) throw new Error("name 為必填");
  insertSubmission(formData);
}
