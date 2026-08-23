#!/usr/bin/env bash
set -euo pipefail

. "${CYBERKALI_ROOT:?}/installer/common.sh"

LOCK_FILE="$CYBERKALI_ROOT/dependencies.lock"
BUILD_ROOT="${XDG_CACHE_HOME:-$HOME/.cache}/cyberkali/build"

load_pins() {
  [ -r "$LOCK_FILE" ] || { fail "Missing dependency lock file: $LOCK_FILE"; return 1; }
  . "$LOCK_FILE"
  : "${AGS_REPO:?}" "${AGS_REF:?}" "${ASTAL_REPO:?}" "${ASTAL_REF:?}"
}

checkout_ref() {
  local repo="$1" ref="$2" dest="$3"
  if [ ! -d "$dest/.git" ]; then
    rm -rf "$dest"
    git clone "$repo" "$dest"
  fi
  git -C "$dest" fetch --tags --force origin
  git -C "$dest" checkout --force "$ref"
  git -C "$dest" submodule update --init --recursive
}

meson_install_dir() {
  local dir="$1"
  rm -rf "$dir/build"
  meson setup "$dir/build" "$dir" --prefix=/usr/local
  meson compile -C "$dir/build"
  sudo meson install -C "$dir/build"
  sudo ldconfig
}

multiarch_triplet() {
  if command -v dpkg-architecture >/dev/null 2>&1; then
    dpkg-architecture -qDEB_HOST_MULTIARCH 2>/dev/null || true
  fi
}

ensure_loader_paths() {
  sudo ldconfig
  local profile="$HOME/.profile" triplet
  triplet="$(multiarch_triplet)"
  touch "$profile"
  if ! grep -q 'CYBERKALI_GI_TYPELIB_PATH' "$profile"; then
    {
      printf '\n# CYBERKALI_GI_TYPELIB_PATH\n'
      printf 'export GI_TYPELIB_PATH="/usr/local/lib/girepository-1.0'
      if [ -n "$triplet" ]; then
        printf ':/usr/local/lib/%s/girepository-1.0' "$triplet"
      fi
      printf '${GI_TYPELIB_PATH:+:$GI_TYPELIB_PATH}"\n'
      printf 'export LD_LIBRARY_PATH="/usr/local/lib'
      if [ -n "$triplet" ]; then
        printf ':/usr/local/lib/%s' "$triplet"
      fi
      printf '${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"\n'
    } >> "$profile"
  fi
}

build_astal_core() {
  local src="$BUILD_ROOT/astal"
  info "Building pinned Astal core"
  checkout_ref "$ASTAL_REPO" "$ASTAL_REF" "$src"
  meson_install_dir "$src/lib/astal/io"
  meson_install_dir "$src/lib/astal/gtk3"
  meson_install_dir "$src/lib/astal/gtk4"
  ensure_loader_paths
}

build_ags() {
  local src="$BUILD_ROOT/ags"
  info "Building pinned AGS $AGS_REF"
  checkout_ref "$AGS_REPO" "$AGS_REF" "$src"
  npm --prefix "$src" ci
  rm -rf "$src/build"
  meson setup "$src/build" "$src" --prefix=/usr/local
  meson compile -C "$src/build"
  sudo meson install -C "$src/build"
  sudo ldconfig
}

astal_ready() {
  pkg-config --exists astal-io-0.1 2>/dev/null \
    && pkg-config --exists astal-3.0 2>/dev/null \
    && pkg-config --exists astal-4.0 2>/dev/null
}

ensure_ags_runtime() {
  load_pins
  mkdir -p "$BUILD_ROOT"

  if ! astal_ready; then
    build_astal_core
  else
    ok "Astal core already available"
  fi

  if command -v ags >/dev/null 2>&1; then
    ok "AGS runtime already available: $(command -v ags)"
  else
    build_ags
  fi

  if ! command -v ags >/dev/null 2>&1; then
    fail "AGS build completed but ags is not on PATH. Check /usr/local/bin."
    return 1
  fi

  if ! astal_ready; then
    fail "Astal installed but pkg-config cannot resolve astal-io-0.1, astal-3.0, and astal-4.0."
    return 1
  fi

  ok "AGS/Astal runtime ready"
}
