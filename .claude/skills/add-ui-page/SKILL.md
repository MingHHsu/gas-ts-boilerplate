---
name: add-ui-page
description: Add a new GAS HTML Service UI page by composing shared components from /src/ui/components, creating new components via add-ui-component skill if needed
---

依照 Google Apps Script HTML Service best practices，組合共用元件來新增一個 UI 頁面。

用法：`/add-ui-page <PageName>`（例如 `/add-ui-page Settings`）

## 步驟

### 1. 確認需求

先用 `AskUserQuestion` 工具問清楚（如果 $ARGUMENTS 沒有提供足夠資訊）：
- 頁面的用途與功能描述
- 需要哪些 server-side functions（名稱與回傳格式）
- 是否需要表單送出、列表顯示、或其他互動

### 2. 設計風格

**必須先呼叫 `frontend-design` skill**，取得統一的設計方向後再實作，確保整個專案設計語言一致。

### 3. 盤點可用元件

掃描 `src/ui/components/` 目錄，列出現有元件：

```
src/ui/components/
  <ComponentName>/
    <ComponentName>.html
    <ComponentName>.css.html
    <ComponentName>.js.html
```

**判斷原則：**
- 優先引入已有的共用元件，保持設計一致性
- 若找不到合適元件，呼叫 `/add-ui-component` skill 先建立元件，再引入頁面
- 僅當需求高度特化、不適合複用時，才在 page 內直接撰寫一次性 UI

### 4. 建立檔案結構

```
src/ui/page/<PageName>/
  <PageName>.html      # 主要 HTML 骨架（含 include 引用）
  <PageName>.css.html  # <style> 標籤內容（原生 CSS，頁面專屬樣式）
  <PageName>.js.html   # <script> 標籤內容（Alpine.js CDN + 頁面邏輯）
```

**命名規則：** 全部使用 PascalCase。

### 5. `<PageName>.html` — 主要骨架

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?!= include('page/<PageName>/<PageName>.css'); ?>
  <!-- 引入各元件的 CSS -->
  <?!= include('components/<ComponentName>/<ComponentName>.css'); ?>
</head>
<body>

  <!-- 引入各元件的 HTML -->
  <?!= include('components/<ComponentName>/<ComponentName>'); ?>

  <!-- 頁面專屬內容 -->

  <?!= include('page/<PageName>/<PageName>.js'); ?>
  <!-- 引入各元件的 JS -->
  <?!= include('components/<ComponentName>/<ComponentName>.js'); ?>
</body>
</html>
```

**原則：**
- `<!DOCTYPE html>` 必須在最前面，避免 quirks mode
- `<base target="_top">` 讓連結在頂層視窗開啟
- CSS include 放 `<head>`，JS include 放 `</body>` 前
- JS 最後載入讓 HTML 先渲染，loading 指示器才能正確顯示

### 6. `<PageName>.css.html` — 頁面樣式

```html
<style>
  /* ===== Reset & Base ===== */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #ffffff;
    padding: 1rem;
    font-size: 0.875rem;
    color: #1F2937;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* ===== 頁面專屬樣式 ===== */
  /* 元件樣式已在元件檔內定義，不需在此重複 */
</style>
```

**原則：**
- 使用原生 CSS，**禁止引入 Tailwind CDN**
- 所有樣式以語意化 class 命名（例如 `.btn-primary`、`.form-input`），不使用 utility class
- 顏色、間距參照 CLAUDE.md 設計規範（主色 `#3B82F6`，背景 `#F0F7FF`）
- 互動狀態（`:hover`、`:disabled`、`:focus`）皆須定義對應樣式

### 7. `<PageName>.js.html` — 頁面邏輯

```html
<!-- Alpine.js CDN（必須 HTTPS） -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>

<script>
  // ── google.script.run mock（本地開發用，部署後自動使用真實 API）──────────
  if (typeof google === 'undefined') {
    window.google = {
      script: {
        run: new Proxy({}, {
          get: (_, fnName) => ({
            withSuccessHandler(cb) {
              return {
                withFailureHandler(_) {
                  return {
                    [fnName](...args) {
                      const mocks = {
                        // 在這裡加入對應的 mock 回傳值
                        // myServerFn: () => ({ ... }),
                      }
                      setTimeout(() => cb(mocks[fnName]?.(...args)), 500)
                    }
                  }
                }
              }
            }
          })
        })
      }
    }
  }

  // ── 封裝 google.script.run 為 Promise ────────────────────────────────────
  function runGas(fnName, ...args) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [fnName](...args)
    })
  }

  // ── Alpine.js 頁面元件 ────────────────────────────────────────────────────
  function <pageName>() {
    return {
      loading: false,
      error: null,
      data: null,

      // 資料一律非同步載入，不在 template scriptlets 處理
      async init() {
        await this.loadData()
      },

      async loadData() {
        this.loading = true
        this.error = null
        try {
          this.data = await runGas('<serverFunctionName>')
        } catch (err) {
          this.error = err.message
        } finally {
          this.loading = false
        }
      },
    }
  }
</script>
```

**非同步資料原則：**
- **一律用 `google.script.run`** 呼叫 server-side functions，不在 scriptlets 中做耗時操作
- Scriptlet（`<?= ?>`、`<?!= ?>`）只適合做 `include()` 這類一次性、快速的操作

### 8. Server-side `include()` helper

確認 `src/server/index.ts` 中有以下 function（若無則新增）：

```typescript
function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}
```

### 9. 開啟頁面的 server function

```typescript
function open<PageName>Dialog(): void {
  const html = HtmlService.createTemplateFromFile('page/<PageName>/<PageName>')
    .evaluate()
    .setWidth(400)
    .setHeight(600)
  SpreadsheetApp.getUi().showModalDialog(html, '<對話框標題>')
}
```

使用 `createTemplateFromFile`（而非 `createHtmlOutputFromFile`）才能解析 `<?!= include() ?>` scriptlets。

### 10. 完成後檢查清單

- [ ] 三個檔案都在 `src/ui/page/<PageName>/` 下
- [ ] 檔名使用 PascalCase
- [ ] 主檔案有 `<!DOCTYPE html>` 和 `<base target="_top">`
- [ ] CSS include 在 `<head>`，JS include 在 `</body>` 前
- [ ] 優先引用 `src/ui/components/` 的現有元件
- [ ] 缺少的元件已透過 `/add-ui-component` 新增
- [ ] Alpine.js CDN 使用 HTTPS
- [ ] 樣式使用原生 CSS，無 Tailwind utility class
- [ ] 資料載入使用 `google.script.run`（非 template scriptlets）
- [ ] `include()` helper 存在於 server 端
- [ ] server function 使用 `createTemplateFromFile`
