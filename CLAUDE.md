# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 語言規則
- 所有回覆使用繁體中文
- 技術術語（如 function、variable、API、component 等）保持英文原文
- 程式碼、指令、路徑一律保持英文
- 錯誤訊息引用保持英文，但解說用中文

## 常用指令

```bash
pnpm install          # 安裝依賴
pnpm run build        # 一次 build（Rollup → dist/bundle.js）
pnpm run build:watch  # 監聽模式，存檔自動 rebuild
pnpm run push         # build + clasp push
pnpm run deploy       # build + push + 建立新版本 deployment
pnpm run lint         # ESLint 檢查 src/server/**/*.ts
pnpm run lint:fix     # ESLint 自動修正
pnpm run test         # 執行所有測試（Vitest）
pnpm run test:watch   # 監聽模式
pnpm run test:coverage # 含覆蓋率報告
```

執行單一測試檔案：
```bash
pnpm vitest run src/test/sheets.test.ts
```

## 架構概覽

這是一個 Google Apps Script (GAS) 專案，使用 TypeScript + Rollup 打包 server side，UI 採用 Alpine.js + 原生 CSS。

### Server side（`src/server/`）

MVC 分層架構，入口為 `src/server/index.ts`，Rollup 打包為 `dist/bundle.js`：

| 層 | 職責 |
|----|------|
| `models/` | Google Sheets / DriveApp 原始 CRUD，直接使用 GAS API |
| `services/` | 商業邏輯、資料驗證，只呼叫 model |
| `controllers/` | 組合 service、try/catch、統一回傳格式（含 `success` 欄位） |
| `types/` | 純型別定義，無 runtime 依賴 |
| `utils/` | GAS 通用工具（`getSheet` 等） |
| `index.ts` | 全域 function 登記（`global.*`），對外暴露給 `google.script.run` |

**全域 function 登記方式**（GAS 不支援 ES module export）：
```typescript
// src/server/index.ts
;(global as any).getSheetOptions = getFormOptions
;(global as any).submitForm = submitFormData
;(global as any).include = (filename: string): string =>
  HtmlService.createHtmlOutputFromFile(filename).getContent()
```

前端以 `google.script.run.getSheetOptions()` 呼叫。

Rollup 設定了 `no-treeshaking` plugin，確保所有 function 定義不被 tree-shake 移除。

### UI（`src/ui/`）

每個頁面由三個檔案組成，透過 GAS `include()` scriptlet 拼接：

| 檔案 | 用途 |
|------|------|
| `<PageName>.html` | 頁面骨架，`<?!= include(...) ?>` 引入 CSS/JS |
| `<PageName>.css.html` | 原生 CSS 樣式（語意化 class 命名） |
| `<PageName>.js.html` | Alpine.js 邏輯、`google.script.run` 封裝、本地 mock |

頁面必須使用 `createTemplateFromFile`（而非 `createHtmlOutputFromFile`）才能解析 scriptlet。

UI 的 HTML 檔案直接由 clasp push，**不需要 Rollup 處理**。

本地開發時直接用瀏覽器開啟 `.html` 檔案，`google.script.run` mock 已內建於 `.js.html` 中。

### 測試（`src/test/`）

Vitest 搭配 node environment，`src/test/setup.ts` 負責 mock GAS 全域 API（如 `SpreadsheetApp`）。

## Import 規則
- 同一資料夾內的 import 使用相對路徑 `./`（例如 `./utils`）
- 跨資料夾的 import 一律使用 `@` alias（例如 `@/server/types`），禁止使用 `../`

## 設計風格
- 整體色調：專業淺藍色調（主色 `#3B82F6` / `#60A5FA`，背景 `#F0F7FF` / `#EFF6FF`）
- 風格定調：乾淨、專業、商務感，避免過度裝飾
- 字體：無襯線字體，層次清晰
- 元件風格：參考 Ant Design 語言，圓角適中，陰影輕微

## CSS 規則
- **禁止使用 Tailwind CSS**（包含 CDN 引入），一律使用原生 CSS
- 樣式以語意化 class 命名（例如 `.btn-primary`、`.form-input`、`.step-indicator`）
- 禁止在 HTML 標籤上直接堆疊 utility class
- 互動狀態（`:hover`、`:focus`、`:disabled`）必須在 CSS 中明確定義

## 注意事項
- `.clasprc.json`（clasp 認證）絕對不能 commit 進 git
- `dist/` 目錄不需要 commit，是 build 產出
