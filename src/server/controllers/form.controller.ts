import { getOptions, submitForm } from "@/server/services/form.service";
import type { SheetOption, FormData, SubmitResult } from "@/server/types";

export function getFormOptions(): {
  success: boolean;
  data: SheetOption[];
  message?: string;
} {
  try {
    const data = getOptions();
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, data: [], message };
  }
}

export function submitFormData(formData: FormData): SubmitResult {
  try {
    submitForm(formData);
    return { success: true, message: "送出成功！" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message };
  }
}
