#!/usr/bin/env bash
set -euo pipefail

# ── 0. 確認環境參數 ────────────────────────────────────────────────────────
ENV="${1:-}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Error: 請指定部署環境，用法：bash scripts/deploy.sh <dev|prod>"
  exit 1
fi

echo "▶ 部署環境：$ENV"

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
clasp push --force || { echo "Error: clasp push 失敗，中止部署。"; exit 1; }

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

DESCRIPTION="${ENV}-${NEXT_TAG}"
echo "▶ 建立 tag: $NEXT_TAG，deployment description: $DESCRIPTION"
git tag "$NEXT_TAG" || { echo "Error: git tag 失敗，中止部署。"; exit 1; }

# ── 7. git push tag ────────────────────────────────────────────────────────
echo "▶ git push tag..."
git push origin "$NEXT_TAG" || { echo "Error: git push tag 失敗，中止部署。"; exit 1; }

# ── 8. clasp deploy（依 description 前綴找 deploymentId）─────────────────
echo "▶ 查詢既有 deployments..."
DEPLOYMENTS_OUTPUT=$(clasp deployments) || { echo "Error: clasp deployments 失敗，中止部署。"; exit 1; }

# 找 description 開頭為 $ENV 的那筆（格式：- <id> @<ver> - <description>）
DEPLOYMENT_ID=$(echo "$DEPLOYMENTS_OUTPUT" | grep -E " - ${ENV}(-|$)" | grep -oE 'AKfycb[A-Za-z0-9_-]+' | head -1 || true)

if [ -n "$DEPLOYMENT_ID" ]; then
  echo "▶ 找到既有 $ENV deployment ($DEPLOYMENT_ID)，更新中..."
  clasp deploy --deploymentId "$DEPLOYMENT_ID" --description "$DESCRIPTION" \
    || { echo "Error: clasp deploy 失敗，中止部署。"; exit 1; }
else
  echo "▶ 未找到 $ENV deployment，建立新 deployment..."
  clasp deploy --description "$DESCRIPTION" \
    || { echo "Error: clasp deploy 失敗，中止部署。"; exit 1; }
fi

echo "✔ 部署完成：$DESCRIPTION"
