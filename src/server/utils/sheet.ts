export function getSheet(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  if (!sheet) throw new Error(`找不到工作表：${sheetName}`)
  return sheet
}
