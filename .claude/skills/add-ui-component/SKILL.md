---
name: add-ui-component
description: Add a reusable GAS HTML Service UI component inspired by Ant Design, placed in /src/ui/components/[ComponentName]/
---

依照 Ant Design 設計規範，為專案新增一個可複用的 UI 元件。

用法：`/add-ui-component <ComponentName>`（例如 `/add-ui-component DataTable`）

## 步驟

### 1. 確認需求

先用 `AskUserQuestion` 工具問清楚（如果 $ARGUMENTS 沒有提供足夠資訊）：
- 元件的功能與用途
- 元件接受哪些輸入參數（props/config）
- 元件需要觸發哪些事件或 callback
- 是否需要與 `google.script.run` 互動

### 2. 設計風格

**必須先呼叫 `frontend-design` skill**，取得統一的設計方向後再實作，確保整個專案設計語言一致。

Ant Design 元件設計原則：
- 語義化顏色系統（Primary、Success、Warning、Error、Neutral）
- 明確的視覺層級與間距規範
- 統一的圓角、陰影、邊框樣式
- 互動狀態清晰（hover、active、disabled、loading）

### 3. 建立檔案結構

```
src/ui/components/<ComponentName>/
  <ComponentName>.html      # 元件 HTML 骨架（供 include() 引入）
  <ComponentName>.css.html  # <style> 標籤內容
  <ComponentName>.js.html   # <script> 標籤內容（Alpine.js 元件定義）
```

**命名規則：** 全部使用 PascalCase。

### 4. `<ComponentName>.html` — 元件骨架

```html
<!-- Component: <ComponentName> -->
<!-- Usage: <?!= include('components/<ComponentName>/<ComponentName>'); ?> -->
<!--
  Props（透過呼叫端的 Alpine.js data 傳入）：
  - propName: type — 說明
-->

<div x-data="<componentName>Config()" class="...">
  <!-- 元件內容 -->
</div>
```

**原則：**
- 頂部加上使用說明 comment，方便引入端參考
- 元件本身**不**包含 `<!DOCTYPE html>`、`<head>`、`<body>` 等頁面層級標籤
- 透過 Alpine.js `x-data` 宣告元件獨立 scope

### 5. `<ComponentName>.css.html` — 元件樣式

```html
<style>
  /* ── <ComponentName> Component ──────────────────────────────── */

  /* 依循 Ant Design 設計規範：
     - 使用 CSS custom properties 定義 token
     - 避免過度特定的選擇器，讓樣式易於覆寫
  */
  :root {
    --component-primary: #1677ff;
    --component-border: #d9d9d9;
    --component-radius: 6px;
  }
</style>
```

### 6. `<ComponentName>.js.html` — 元件邏輯

```html
<script>
  // ── <ComponentName> Alpine.js Component ──────────────────────────────────
  function <componentName>Config(initialConfig = {}) {
    return {
      // 預設 props
      ...initialConfig,

      // 內部狀態
      loading: false,
      error: null,

      init() {
        // 元件初始化邏輯
      },

      // 公開 methods（供呼叫端使用）
    }
  }
</script>
```

**原則：**
- 元件邏輯封裝在獨立的 function，不污染全域
- 透過 `initialConfig` 接受外部傳入的設定值
- 公開的 method 加上 comment 說明用途

### 7. 引入方式（供參考）

呼叫端（page 或其他元件）透過 `<?!= include() ?>` 引入：

```html
<!-- 在 Page 的 .html 中 -->
<?!= include('components/<ComponentName>/<ComponentName>'); ?>

<!-- 在 Page 的 .css.html 中 -->
<?!= include('components/<ComponentName>/<ComponentName>.css'); ?>

<!-- 在 Page 的 .js.html 中 -->
<?!= include('components/<ComponentName>/<ComponentName>.js'); ?>
```

### 8. 完成後檢查清單

- [ ] 三個檔案都在 `src/ui/components/<ComponentName>/` 下
- [ ] 檔名使用 PascalCase
- [ ] `.html` 頂部有使用說明 comment
- [ ] 元件不包含頁面層級標籤（`<!DOCTYPE>`、`<body>` 等）
- [ ] Alpine.js 元件透過 function 定義，不污染全域
- [ ] 樣式遵循 Ant Design 設計規範
- [ ] 互動狀態（hover、disabled、loading）都有對應樣式
- [ ] 樣式使用原生 CSS，無 Tailwind utility class
