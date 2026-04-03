---
name: add-server-feature
description: Add a new GAS server-side feature following MVC architecture with models, services, and controllers. All filenames use kebab-case.
---

依照 MVC 架構，為 GAS server 端新增一個功能模組。

用法：`/add-server-feature <feature-name>`（例如 `/add-server-feature user-report`）

## 架構說明

```
src/server/
  models/
    <feature-name>.model.ts       # Google Sheets / DriveApp 資料存取
  services/
    <feature-name>.service.ts     # 商業邏輯，呼叫 model，不直接碰 GAS API
  controllers/
    <feature-name>.controller.ts  # 組合 service，對外暴露給 google.script.run
  types/
    index.ts                      # re-export（對外 import 路徑統一為 @/server/types）
    common.ts                     # 通用型別（或新增 <feature-name>.ts 放 feature 專屬型別）
  utils/
    index.ts                      # re-export
    sheet.ts                      # getSheet() 等 GAS 通用工具
  index.ts                        # 全域 function 登記（呼叫 controller）
```

**各層職責：**
| 層 | 職責 | 可使用 |
|---|---|---|
| Model | Sheets/Drive 原始 CRUD | GAS API（SpreadsheetApp 等）、`@/server/utils` |
| Service | 商業邏輯、資料轉換、驗證 | 僅呼叫 Model |
| Controller | 組合 Service、錯誤處理、格式化回應 | 僅呼叫 Service |
| types/ | 型別定義（通用放 `common.ts`，feature 專屬可獨立一檔） | 純型別，無 runtime 依賴 |
| utils/ | GAS 通用工具函式（`getSheet` 等） | GAS API |
| index.ts | 登記全域 function | 僅呼叫 Controller |

## 步驟

### 1. 確認需求

先用 `AskUserQuestion` 工具問清楚（如果 $ARGUMENTS 沒有提供足夠資訊）：
- 功能用途與描述
- 對應哪個 Google Sheets 工作表（或其他 GAS 資源）
- 需要哪些操作（讀取、新增、更新、刪除）
- 前端需要呼叫哪些 function（名稱與參數格式）
- 回傳資料的結構

### 2. 型別定義（`src/server/types/<feature-name>.ts` 或加入 `common.ts`）

若型別僅此 feature 使用，建立獨立檔案：

```typescript
// src/server/types/<feature-name>.ts

export interface <FeatureName> {
  // 欄位定義
}

export interface Create<FeatureName>Input {
  // 新增時所需欄位
}

export interface <FeatureName>Response {
  success: boolean
  data?: <FeatureName>[]
  message?: string
}
```

在 `src/server/types/index.ts` 補上 re-export：

```typescript
export type { <FeatureName>, Create<FeatureName>Input, <FeatureName>Response } from '@/server/types/<feature-name>'
```

若型別具跨 feature 通用性，直接加入 `src/server/types/common.ts`。

### 3. 建立 Model（`src/server/models/<feature-name>.model.ts`）

```typescript
import { getSheet } from '@/server/utils'
import type { <FeatureName>, Create<FeatureName>Input } from '@/server/types'

const SHEET_NAME = '<SheetName>'

// ── 資料存取函式 ──────────────────────────────────────────────────────────────

export function findAll(): <FeatureName>[] {
  const sheet = getSheet(SHEET_NAME)
  const rows = sheet.getDataRange().getValues()
  return rows.slice(1).map(rowTo<FeatureName>)
}

export function insert(input: Create<FeatureName>Input): void {
  const sheet = getSheet(SHEET_NAME)
  sheet.appendRow([new Date(), /* 各欄位 */])
}

// ── 私有 helpers ──────────────────────────────────────────────────────────────

function rowTo<FeatureName>(row: unknown[]): <FeatureName> {
  return {
    // row[0], row[1], ... 對應欄位
  }
}
```

**原則：**
- 型別定義已移至 `types/`，model 只負責資料存取
- 使用 `@/server/utils` 的 `getSheet`，不重複撰寫 `getActiveSpreadsheet()` 邏輯
- 若 `utils/` 缺少需要的工具函式，先在 `utils/` 新增再引入

### 4. 建立 Service（`src/server/services/<feature-name>.service.ts`）

```typescript
import { findAll, insert } from '@/server/models/<feature-name>.model'
import type { <FeatureName>, Create<FeatureName>Input } from '@/server/types'

export function getAll(): <FeatureName>[] {
  return findAll()
}

export function create(input: Create<FeatureName>Input): void {
  // 驗證
  if (!input.someField) throw new Error('someField 為必填')
  // 商業邏輯處理
  insert(input)
}
```

**原則：**
- 不直接使用 GAS API，只透過 model 函式
- 負責驗證輸入、資料轉換、商業規則判斷
- Import 路徑使用 `@` alias

### 5. 建立 Controller（`src/server/controllers/<feature-name>.controller.ts`）

```typescript
import { getAll, create } from '@/server/services/<feature-name>.service'
import type { Create<FeatureName>Input, <FeatureName>Response } from '@/server/types'

export interface <FeatureName>ListResponse {
  success: boolean
  data: ReturnType<typeof getAll>
}

export interface ActionResponse {
  success: boolean
  message: string
}

export function list<FeatureName>(): <FeatureName>ListResponse {
  try {
    const data = getAll()
    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, data: [], message } as any
  }
}

export function create<FeatureName>(input: Create<FeatureName>Input): ActionResponse {
  try {
    create(input)
    return { success: true, message: '操作成功' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, message }
  }
}
```

**原則：**
- 定義明確的 response 型別（前端 `google.script.run` 的回傳格式）
- 所有 controller function 都要 try/catch，回傳帶 `success` 的統一格式
- 不含商業邏輯，只做組合與錯誤包裝

### 6. 在 `src/server/index.ts` 登記全域 function

GAS 只能呼叫 `index.ts` 中的全域（`global.*`）function：

```typescript
import { list<FeatureName>, create<FeatureName> } from '@/server/controllers/<feature-name>.controller'

// 在檔案底部新增，對齊現有風格
;(global as any).list<FeatureName> = list<FeatureName>
;(global as any).create<FeatureName> = create<FeatureName>
```

**原則：**
- function 名稱與 controller export 名稱一致
- 前端以此名稱呼叫 `google.script.run.list<FeatureName>()`

### 7. 完成後檢查清單

- [ ] 所有新檔案以 kebab-case 命名
- [ ] 型別定義放在 `src/server/types/`，並在 `index.ts` re-export
- [ ] Model 使用 `@/server/utils` 的 `getSheet`，不重複撰寫取 sheet 邏輯
- [ ] Model 只負責 GAS API 存取，無商業邏輯
- [ ] Service 只呼叫 Model，不直接用 GAS API
- [ ] Controller 所有 function 都有 try/catch + 統一回傳格式（含 `success` 欄位）
- [ ] `index.ts` 已登記所有需對外暴露的 function
- [ ] 所有 import 使用 `@` alias（禁止相對路徑）
