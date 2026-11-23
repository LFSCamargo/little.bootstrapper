#!/usr/bin/env bash
set -euo pipefail

# Automated Semver Bump, Changelog Updater & Git Tag Creator for little.bootstrapper CLI
# Usage: bash scripts/release.sh <patch|minor|major|X.Y.Z> [--dry-run]

BUMP="${1:-}"
DRY_RUN="${2:-}"

if [[ -z "${BUMP}" ]]; then
  echo "Usage: bash scripts/release.sh <patch|minor|major|X.Y.Z> [--dry-run]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# 1. Run full pattern validation before cutting a release
echo "🛡️  Running little.bootstrapper Pattern Validation Gate..."
node "${REPO_ROOT}/packages/initializer/dist/cli.js" validate --dir "${REPO_ROOT}"

# 2. Compute next semver version
CURRENT_VERSION="$(node -e "console.log(require('./package.json').version)")"
NEXT_VERSION="$(node -e "
const cur = '${CURRENT_VERSION}'.split('.').map(Number);
const bump = '${BUMP}';
if (/^\\d+\\.\\d+\\.\\d+$/.test(bump)) {
  console.log(bump);
} else if (bump === 'major') {
  console.log((cur[0] + 1) + '.0.0');
} else if (bump === 'minor') {
  console.log(cur[0] + '.' + (cur[1] + 1) + '.0');
} else if (bump === 'patch') {
  console.log(cur[0] + '.' + cur[1] + '.' + (cur[2] + 1));
} else {
  process.exit(1);
}
")"

TAG="v${NEXT_VERSION}"
TODAY="$(date +%Y-%m-%d)"

echo "🚀 Preparing release ${TAG} (current: v${CURRENT_VERSION})"

if [[ "${DRY_RUN}" == "--dry-run" ]]; then
  echo "[dry-run] Would bump all package.json files + CLI_VERSION to ${NEXT_VERSION}, update CHANGELOG.md, commit, and tag ${TAG}."
  exit 0
fi

# 3. Collect Conventional Commits since last tag
LAST_TAG="$(git describe --tags --abbrev=0 2>/dev/null || true)"
if [[ -n "${LAST_TAG}" ]]; then
  COMMITS="$(git log "${LAST_TAG}..HEAD" --pretty=format:"- %s (%h)" || true)"
else
  COMMITS="$(git log --pretty=format:"- %s (%h)" -n 20 || true)"
fi
[[ -z "${COMMITS}" ]] && COMMITS="- Release ${TAG}"

# 4. Bump package.json files & CLI_VERSION
node -e "
const fs = require('fs');
const files = [
  'package.json',
  'packages/ui-cli/package.json',
  'packages/ui-web/package.json',
  'packages/initializer/package.json',
  'apps/web/package.json',
];
for (const f of files) {
  const pkg = JSON.parse(fs.readFileSync(f, 'utf8'));
  pkg.version = '${NEXT_VERSION}';
  fs.writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n');
}
const helpPath = 'packages/initializer/src/commands/help.command.ts';
const helpSrc = fs.readFileSync(helpPath, 'utf8');
fs.writeFileSync(helpPath, helpSrc.replace(/CLI_VERSION = '[^']+'/, \"CLI_VERSION = '${NEXT_VERSION}'\"));
"

# 5. Prepend new release entry to CHANGELOG.md & packages/initializer/CHANGELOG.md
node -e "
const fs = require('fs');
const section = '## [${NEXT_VERSION}] - ${TODAY}\n\n### Changes\n' + process.env.RELEASE_COMMITS + '\n\n';
for (const file of ['CHANGELOG.md', 'packages/initializer/CHANGELOG.md']) {
  const cur = fs.readFileSync(file, 'utf8');
  const idx = cur.indexOf('## [');
  const next = idx === -1 ? cur + '\n' + section : cur.slice(0, idx) + section + cur.slice(idx);
  fs.writeFileSync(file, next);
}
" RELEASE_COMMITS="${COMMITS}"

# 6. Rebuild & re-verify tests
./node_modules/.bin/tsc -p packages/ui-cli/tsconfig.json
./node_modules/.bin/tsc -p packages/initializer/tsconfig.json
./node_modules/.bin/vitest run --root packages/initializer

# 7. Commit & create annotated git tag
git add package.json packages/*/package.json apps/*/package.json packages/initializer/src/commands/help.command.ts CHANGELOG.md packages/initializer/CHANGELOG.md
git commit -m "chore(release): ${TAG}"
git tag -a "${TAG}" -m "Release ${TAG}"

echo ""
echo "✅ Created release commit and annotated tag ${TAG}!"
echo "Push to trigger the automated GitHub Release & npm publish pipeline:"
echo "   git push origin main --follow-tags"
