#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export CYBERKALI_ROOT="$ROOT"

# shellcheck source=installer/common.sh
. "$ROOT/installer/common.sh"
# shellcheck source=installer/packages.sh
. "$ROOT/installer/packages.sh"

DRY_RUN=0
FLAVOR="red"

usage() {
  cat <<'EOF'
CyberKali installer

Usage:
  ./install.sh [--dry-run] [--flavor red|cyan|amber]
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --flavor)
      shift
      FLAVOR="${1:-}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      usage
      exit 2
      ;;
  esac
  shift
done

case "$FLAVOR" in
  red|cyan|amber) ;;
  *) fail "Unknown flavor: $FLAVOR"; exit 2 ;;
esac

printf '%bCYBERKALI // INSTALLER%b\n' "$BOLD" "$RESET"
printf 'Flavor: %s\n\n' "$FLAVOR"

if ! have apt-get || ! have dpkg-query; then
  fail "This installer requires an APT/dpkg based Kali or Debian system."
  exit 1
fi

if ! is_kali; then
  warn "Kali was not positively identified from /etc/os-release. Continuing in Debian-compatible mode."
fi

info "Refreshing APT metadata"
if [ "$DRY_RUN" -eq 0 ]; then
  sudo apt-get update
fi

scan_packages

if [ "$DRY_RUN" -eq 1 ]; then
  printf '\n%bDRY RUN%b\n' "$AMBER" "$RESET"
  printf 'Missing required: %s\n' "${MISSING_REQUIRED[*]:-none}"
  printf 'Unavailable required: %s\n' "${UNAVAILABLE_REQUIRED[*]:-none}"
  printf 'Missing optional: %s\n' "${MISSING_OPTIONAL[*]:-none}"
  printf 'Unavailable optional: %s\n' "${UNAVAILABLE_OPTIONAL[*]:-none}"
  printf 'Selected flavor: %s\n' "$FLAVOR"
  exit 0
fi

install_packages
ensure_dirs

mkdir -p "$CYBERKALI_RUNTIME_DIR/repo"

# Keep the live checkout as the source during development. The runtime links
# make it possible to replace this with a packaged install later.
safe_link "$ROOT/config/ags" "${XDG_CONFIG_HOME:-$HOME/.config}/ags"

printf '%s\n' "$ROOT" > "$CYBERKALI_CONFIG_DIR/root"
printf '%s\n' "$FLAVOR" > "$CYBERKALI_CONFIG_DIR/flavor"
bash "$ROOT/cyberkali" flavor "$FLAVOR" --no-reload

mkdir -p "$HOME/.local/bin"
install -m 755 "$ROOT/cyberkali" "$HOME/.local/bin/cyberkali"

ok "CyberKali foundation installed"
printf '\nRun: cyberkali doctor\n'
