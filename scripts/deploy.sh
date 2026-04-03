#!/usr/bin/env bash
set -euo pipefail

# ── 1. lint:fix（若有更動則 commit）────────────────────────────────────────
echo "▶ 執行 lint:fix..."
pnpm run lint:fix || { echo "Error: lint:fix 失敗，中止部署。"; exit 1; }

if ! git diff --quiet; then
  echo "  lint:fix 產生了變更，自動 commit..."
  git add -A
  git commit -m "style: auto lint fix"
fi

# ── 2. test ────────────────────────────────────────────────────────────────
echo "▶ 執行測試..."
pnpm run test || { echo "Error: 測試失敗，中止部署。"; exit 1; }

# ── 3. build ───────────────────────────────────────────────────────────────
echo "▶ 執行 build..."
pnpm run build || { echo "Error: build 失敗，中止部署。"; exit 1; }

# ── 4. clasp push ──────────────────────────────────────────────────────────
echo "▶ Pushing to GAS..."
clasp push || { echo "Error: clasp push 失敗，中止部署。"; exit 1; }

# ── 5. git push ────────────────────────────────────────────────────────────
echo "▶ git push..."
git push || { echo "Error: git push 失敗，中止部署。"; exit 1; }

# ── 6. 自動決定下一個 semver tag ──────────────────────────────────────────
LATEST_TAG=$(git tag --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)

if [ -z "$LATEST_TAG" ]; then
  NEXT_TAG="v1.0.0"
else
  IFS='.' read -r MAJOR MINOR PATCH <<< "${LATEST_TAG#v}"
  NEXT_TAG="v${MAJOR}.${MINOR}.$((PATCH + 1))"
fi

echo "▶ 建立 tag: $NEXT_TAG"
git tag "$NEXT_TAG" || { echo "Error: git tag 失敗，中止部署。"; exit 1; }

# ── 7. git push tag ────────────────────────────────────────────────────────
echo "▶ git push tag..."
git push origin "$NEXT_TAG" || { echo "Error: git push tag 失敗，中止部署。"; exit 1; }

# ── 8. clasp deploy ────────────────────────────────────────────────────────
echo "▶ 建立 clasp deployment..."
clasp deploy --description "$NEXT_TAG" || { echo "Error: clasp deploy 失敗，中止部署。"; exit 1; }

echo "✔ 部署完成，tag: $NEXT_TAG"
