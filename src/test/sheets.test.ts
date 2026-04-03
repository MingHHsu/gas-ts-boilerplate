import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSheetData, submitForm } from '@/server/sheets'

// ── helpers ────────────────────────────────────────────────────────────────

function makeSpreadsheetApp(overrides: {
  optionsRows?: unknown[][]
  submissionsSheet?: boolean
}) {
  const { optionsRows = [], submissionsSheet = true } = overrides

  const mockOptionsSheet = {
    getDataRange: vi.fn().mockReturnValue({
      getValues: vi.fn().mockReturnValue(optionsRows),
    }),
  }

  const mockSubmissionsSheet = submissionsSheet
    ? { appendRow: vi.fn() }
    : null

  const mockSS = {
    getSheetByName: vi.fn((name: string) => {
      if (name === 'Options') return mockOptionsSheet
      if (name === 'Submissions') return mockSubmissionsSheet
      return null
    }),
  }

  return {
    ss: mockSS,
    optionsSheet: mockOptionsSheet,
    submissionsSheet: mockSubmissionsSheet as { appendRow: ReturnType<typeof vi.fn> } | null,
    app: { getActiveSpreadsheet: vi.fn().mockReturnValue(mockSS) },
  }
}

// ── getSheetData ───────────────────────────────────────────────────────────

describe('getSheetData', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('回傳對應的 SheetOption 陣列（略過 header 列）', () => {
    const { app } = makeSpreadsheetApp({
      optionsRows: [
        ['id', 'label'],       // header
        ['1', '早餐'],
        ['2', '午餐'],
        ['3', '晚餐'],
      ],
    })
    vi.stubGlobal('SpreadsheetApp', app)

    const result = getSheetData()

    expect(result).toEqual([
      { id: '1', label: '早餐' },
      { id: '2', label: '午餐' },
      { id: '3', label: '晚餐' },
    ])
  })

  it('數值型 id 被轉為字串', () => {
    const { app } = makeSpreadsheetApp({
      optionsRows: [
        ['id', 'label'],
        [42, '數字選項'],
      ],
    })
    vi.stubGlobal('SpreadsheetApp', app)

    const result = getSheetData()

    expect(result[0].id).toBe('42')
  })

  it('只有 header、無資料時回傳空陣列', () => {
    const { app } = makeSpreadsheetApp({
      optionsRows: [['id', 'label']],
    })
    vi.stubGlobal('SpreadsheetApp', app)

    expect(getSheetData()).toEqual([])
  })

  it('找不到 Options 工作表時拋出錯誤', () => {
    const mockSS = { getSheetByName: vi.fn().mockReturnValue(null) }
    vi.stubGlobal('SpreadsheetApp', { getActiveSpreadsheet: vi.fn().mockReturnValue(mockSS) })

    expect(() => getSheetData()).toThrow('找不到工作表：Options')
  })
})

// ── submitForm ─────────────────────────────────────────────────────────────

describe('submitForm', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('成功送出時回傳 success: true', () => {
    const { app } = makeSpreadsheetApp({ optionsRows: [], submissionsSheet: true })
    vi.stubGlobal('SpreadsheetApp', app)

    const result = submitForm({ name: '王小明', category: '午餐', note: '不辣' })

    expect(result).toEqual({ success: true, message: '送出成功！' })
  })

  it('呼叫 appendRow 時帶入正確欄位（含 note）', () => {
    const { app, submissionsSheet } = makeSpreadsheetApp({ optionsRows: [], submissionsSheet: true })
    vi.stubGlobal('SpreadsheetApp', app)

    submitForm({ name: '王小明', category: '午餐', note: '不辣' })

    const appendArgs = submissionsSheet!.appendRow.mock.calls[0][0] as unknown[]
    expect(appendArgs[1]).toBe('王小明')
    expect(appendArgs[2]).toBe('午餐')
    expect(appendArgs[3]).toBe('不辣')
    expect(appendArgs[0]).toBeInstanceOf(Date)
  })

  it('note 為 undefined 時寫入空字串', () => {
    const { app, submissionsSheet } = makeSpreadsheetApp({ optionsRows: [], submissionsSheet: true })
    vi.stubGlobal('SpreadsheetApp', app)

    submitForm({ name: '李小華', category: '早餐' })

    const appendArgs = submissionsSheet!.appendRow.mock.calls[0][0] as unknown[]
    expect(appendArgs[3]).toBe('')
  })

  it('找不到 Submissions 工作表時拋出錯誤', () => {
    const mockSS = {
      getSheetByName: vi.fn((name: string) => (name === 'Options' ? {} : null)),
    }
    vi.stubGlobal('SpreadsheetApp', { getActiveSpreadsheet: vi.fn().mockReturnValue(mockSS) })

    expect(() => submitForm({ name: '測試', category: null })).toThrow(
      '找不到工作表：Submissions',
    )
  })
})
