#!/usr/bin/env bash
set -u

CYBERKALI_ROOT="${CYBERKALI_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
CYBERKALI_STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/cyberkali"
CYBERKALI_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/cyberkali"
CYBERKALI_RUNTIME_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/cyberkali"

RED='\033[38;2;255;45;61m'
CYAN='\033[38;2;97;243;255m'
AMBER='\033[38;2;255;176;0m'
GREEN='\033[38;2;90;230;130m'
YELLOW='\033[38;2;255;214;31m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

info() { printf "%b▸%b %s\n" "$CYAN" "$RESET" "$*"; }
ok() { printf "%b✓%b %s\n" "$GREEN" "$RESET" "$*"; }
warn() { printf "%b!%b %s\n" "$YELLOW" "$RESET" "$*" >&2; }
fail() { printf "%b✗%b %s\n" "$RED" "$RESET" "$*" >&2; return 1; }

have() { command -v "$1" >/dev/null 2>&1; }

is_kali() {
  [ -r /etc/os-release ] || return 1
  . /etc/os-release
  case "${ID:-}:${ID_LIKE:-}" in
    kali:*|*:kali*|*:debian*) return 0 ;;
    *) return 1 ;;
  esac
}

ensure_dirs() {
  mkdir -p "$CYBERKALI_STATE_DIR" "$CYBERKALI_CONFIG_DIR" "$CYBERKALI_RUNTIME_DIR"
}

backup_path() {
  local target="$1"
  [ -e "$target" ] || [ -L "$target" ] || return 0
  local stamp backup_root
  stamp="$(date +%Y%m%d-%H%M%S)"
  backup_root="$CYBERKALI_STATE_DIR/backups/$stamp"
  mkdir -p "$backup_root"
  cp -a "$target" "$backup_root/"
  printf '%s\n' "$backup_root" > "$CYBERKALI_STATE_DIR/latest-backup"
  ok "Backed up $target to $backup_root"
}

safe_link() {
  local source="$1" target="$2"
  mkdir -p "$(dirname "$target")"
  if [ -e "$target" ] || [ -L "$target" ]; then
    backup_path "$target"
    rm -rf "$target"
  fi
  ln -s "$source" "$target"
}
