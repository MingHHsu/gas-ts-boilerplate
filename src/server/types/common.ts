export interface SheetOption {
  id: string
  label: string
}

export interface FormData {
  name: string
  category: string | null
  note?: string
}

export interface SubmitResult {
  success: boolean
  message: string
}
