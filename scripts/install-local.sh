#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BIN_DIR="${HOME}/.local/bin"
CLI_ENTRY="${REPO_ROOT}/packages/initializer/dist/cli.js"

if [[ "${1:-}" == "--uninstall" ]]; then
  rm -f "${BIN_DIR}/little-bootstrapper" "${BIN_DIR}/planet-express"
  echo "Removed little-bootstrapper and planet-express from ${BIN_DIR}."
  exit 0
fi

echo "🚀 Building Planet Express CLI (@little-bootstrapper/ui-cli & @little-bootstrapper/initializer)..."
"${REPO_ROOT}/node_modules/.bin/tsc" -p "${REPO_ROOT}/packages/ui-cli/tsconfig.json"
"${REPO_ROOT}/node_modules/.bin/tsc" -p "${REPO_ROOT}/packages/initializer/tsconfig.json"

if [[ ! -f "${CLI_ENTRY}" ]]; then
  echo "Error: Compiled CLI entrypoint not found at ${CLI_ENTRY}" >&2
  exit 1
fi

mkdir -p "${BIN_DIR}"

install_wrapper() {
  local name="$1"
  local target="${BIN_DIR}/${name}"
  cat > "${target}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec node "${CLI_ENTRY}" "\$@"
EOF
  chmod +x "${target}"
}

install_wrapper "little-bootstrapper"
install_wrapper "planet-express"

echo ""
echo "✅ Good news, everyone! Installed locally to ${BIN_DIR}:"
echo "   • ${BIN_DIR}/little-bootstrapper"
echo "   • ${BIN_DIR}/planet-express"
echo ""

case ":${PATH}:" in
  *":${BIN_DIR}:"*)
    echo "Ready to fly! Run:"
    echo "   little-bootstrapper"
    echo "   little-bootstrapper init"
    echo "   little-bootstrapper normalize"
    echo "   little-bootstrapper update"
    ;;
  *)
    echo "⚠️  ${BIN_DIR} is not currently in your PATH."
    echo "Add this line to your ~/.zshrc:"
    echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Or run directly right now:"
    echo "   ~/.local/bin/little-bootstrapper"
    ;;
esac
