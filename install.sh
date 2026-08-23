#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export CYBERKALI_ROOT="$ROOT"

. "$ROOT/installer/common.sh"
. "$ROOT/installer/packages.sh"
. "$ROOT/installer/ags.sh"

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
  printf 'Missing runtime: %s\n' "${MISSING_REQUIRED[*]:-none}"
  printf 'Unavailable runtime: %s\n' "${UNAVAILABLE_REQUIRED[*]:-none}"
  printf 'Missing build deps: %s\n' "${MISSING_BUILD[*]:-none}"
  printf 'Unavailable build deps: %s\n' "${UNAVAILABLE_BUILD[*]:-none}"
  printf 'Missing optional: %s\n' "${MISSING_OPTIONAL[*]:-none}"
  printf 'Unavailable optional: %s\n' "${UNAVAILABLE_OPTIONAL[*]:-none}"
  printf 'Selected flavor: %s\n' "$FLAVOR"
  printf 'Managed configs: AGS + Hyprland\n'
  exit 0
fi

install_packages
ensure_ags_runtime
ensure_dirs

CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
mkdir -p "$CONFIG_HOME/hypr" "$CYBERKALI_CONFIG_DIR/bin" "$HOME/.local/bin"

# Keep the checkout as the managed source during development. Existing user
# configs are backed up before managed files replace them.
safe_link "$ROOT/config/ags" "$CONFIG_HOME/ags"
safe_link "$ROOT/config/hypr/hyprland.conf" "$CONFIG_HOME/hypr/hyprland.conf"
safe_link "$ROOT/config/hypr/cyberkali-keybinds.conf" "$CONFIG_HOME/hypr/cyberkali-keybinds.conf"

# Local overrides are user-owned. Never replace them once created.
if [ ! -e "$CONFIG_HOME/hypr/cyberkali-local.conf" ]; then
  cp "$ROOT/config/hypr/cyberkali-local.conf" "$CONFIG_HOME/hypr/cyberkali-local.conf"
  ok "Created local Hyprland override file"
fi

install -m 755 "$ROOT/scripts/launch-shell" "$CYBERKALI_CONFIG_DIR/bin/launch-shell"
if [ -f "$ROOT/scripts/toggle-recording" ]; then
  install -m 755 "$ROOT/scripts/toggle-recording" "$CYBERKALI_CONFIG_DIR/bin/toggle-recording"
fi
install -m 755 "$ROOT/cyberkali" "$HOME/.local/bin/cyberkali"

printf '%s\n' "$ROOT" > "$CYBERKALI_CONFIG_DIR/root"
printf '%s\n' "$FLAVOR" > "$CYBERKALI_CONFIG_DIR/flavor"
bash "$ROOT/cyberkali" flavor "$FLAVOR" --no-reload

ok "CyberKali base session installed"
printf '\nNext:\n'
printf '  cyberkali doctor\n'
printf '  log out and select the Hyprland session\n'
printf '  SUPER+SPACE opens Kiroshi launcher\n'
printf '  SUPER+SHIFT+C cycles Red / Cyan / Amber\n'
