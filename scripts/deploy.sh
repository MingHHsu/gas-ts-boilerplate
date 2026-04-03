#!/usr/bin/env bash
set -euo pipefail

# 確認 HEAD 上有精確的 git tag，否則拒絕部署
TAG=$(git describe --exact-match --tags HEAD 2>/dev/null || true)

if [ -z "$TAG" ]; then
  echo "Error: 目前 HEAD 沒有 git tag。請先下 tag 再部署，例如："
  echo "  git tag v1.0.0 && pnpm run deploy"
  exit 1
fi

echo "Deploying with tag: $TAG"

pnpm run lint:fix
pnpm run test
pnpm run build
clasp push
clasp deploy --description "$TAG"
