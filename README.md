# gas-ts-boilerplate

Google Apps Script 專案樣板，使用 TypeScript（server side）+ Alpine.js + 原生 CSS（UI）。

## 技術棧

| 層級 | 技術 |
|------|------|
| Server side | TypeScript，透過 Rollup 打包為單一 `bundle.js` |
| UI | Alpine.js（CDN）+ 原生 CSS |
| 部署工具 | clasp |
| 測試 | Vitest |

## 目錄結構

```
gas-ts-boilerplate/
│
├── src/
│   ├── server/                         ← GAS server side（TypeScript，MVC 架構）
│   │   ├── index.ts                    ← 全域 function 登記（doGet、onOpen、global.*）
│   │   ├── models/
│   │   │   └── form.model.ts           ← Google Sheets 原始 CRUD
│   │   ├── services/
│   │   │   └── form.service.ts         ← 商業邏輯與驗證
│   │   ├── controllers/
│   │   │   └── form.controller.ts      ← 組合 service、統一回傳格式
│   │   ├── types/
│   │   │   ├── index.ts                ← re-export 入口
│   │   │   └── common.ts              ← 共用型別（SheetOption、FormData 等）
│   │   └── utils/
│   │       ├── index.ts                ← re-export 入口
│   │       └── sheet.ts               ← getSheet() 等 GAS 通用工具
│   │
│   ├── ui/
│   │   └── page/
│   │       └── FormWizard/             ← 多步驟表單頁面（範例）
│   │           ├── FormWizard.html     ← 頁面骨架，透過 include() 引入 CSS/JS
│   │           ├── FormWizard.css.html ← 原生 CSS 樣式
│   │           └── FormWizard.js.html  ← Alpine.js 邏輯 + google.script.run mock
│   │
│   └── test/
│       ├── setup.ts
│       └── sheets.test.ts
│
├── dist/                               ← clasp push 目標目錄（rootDir）
│   ├── bundle.js                       ← Rollup 打包輸出
│   └── appsscript.json
│
├── rollup.config.js                    ← server side bundle 設定（含 @ alias）
├── tsconfig.json                       ← paths: { "@/*": ["src/*"] }
├── vitest.config.ts
├── eslint.config.js
├── appsscript.json
└── package.json
```

## 安裝

```bash
pnpm install
```

## 開發流程

### Server side（TypeScript）

```bash
# 一次 build
pnpm run build

# 監聽模式，存檔自動 rebuild
pnpm run build:watch
```

### UI（Alpine.js）

直接用瀏覽器開啟 `src/ui/page/FormWizard/FormWizard.html`，不需要任何 server。

`google.script.run` 的 mock 已內建於 `FormWizard.js.html`，會自動啟用並模擬 GAS 回傳資料。

### 測試

```bash
# 執行一次
pnpm run test

# 監聽模式
pnpm run test:watch

# 含覆蓋率報告
pnpm run test:coverage
```

### 部署

```bash
# build + clasp push
pnpm run push

# build + push + 建立新版本 deployment
pnpm run deploy
```

## 初次設定

1. 在 [Apps Script 設定頁](https://script.google.com/home/usersettings) 開啟 Google Apps Script API
2. 登入 clasp：
   ```bash
   pnpm run login
   ```
3. 把你的 Script ID 填入 `.clasp.json`
4. 執行 `pnpm run push`

## Server side 架構

### 各層職責

| 層 | 職責 |
|----|------|
| `models/` | Google Sheets / DriveApp 原始 CRUD，直接使用 GAS API |
| `services/` | 商業邏輯、資料驗證，只呼叫 model |
| `controllers/` | 組合 service、try/catch、統一回傳格式（含 `success` 欄位） |
| `types/` | 純型別定義，無 runtime 依賴 |
| `utils/` | GAS 通用工具（`getSheet` 等） |
| `index.ts` | 全域 function 登記（`global.*`），對外暴露給 `google.script.run` |

### Import 規則

- 同資料夾內使用相對路徑 `./`
- 跨資料夾一律使用 `@` alias（例如 `@/server/types`），**禁止使用 `../`**

### 全域 function 範例

```typescript
// src/server/index.ts
;(global as any).getSheetOptions = getFormOptions
;(global as any).submitForm = submitFormData
```

前端以 `google.script.run.getSheetOptions()` 呼叫。

## UI 架構

每個頁面由三個檔案組成，透過 GAS `include()` scriptlet 拼接：

| 檔案 | 用途 |
|------|------|
| `<PageName>.html` | 頁面骨架，`<?!= include(...) ?>` 引入 CSS/JS |
| `<PageName>.css.html` | 原生 CSS 樣式（語意化 class 命名） |
| `<PageName>.js.html` | Alpine.js 邏輯、`google.script.run` 封裝、本地 mock |

```typescript
// src/server/index.ts — include helper（必要）
;(global as any).include = (filename: string): string =>
  HtmlService.createHtmlOutputFromFile(filename).getContent()
```

頁面必須使用 `createTemplateFromFile`（而非 `createHtmlOutputFromFile`）才能解析 scriptlet。

## 注意事項

- `.clasprc.json`（clasp 認證）絕對不能 commit 進 git
- `dist/` 目錄不需要 commit，是 build 產出
- UI 的 HTML 檔案透過 clasp 的 `filePushOrder` 或目錄結構直接 push，**不需要 Rollup 處理**
