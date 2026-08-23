#!/usr/bin/env bash

CYBERKALI_REQUIRED_PACKAGES=(
  hyprland
  hyprlock
  xdg-desktop-portal-hyprland
  gjs
  gir1.2-gtk-3.0
  network-manager
  wireplumber
  playerctl
  upower
  socat
  jq
  libnotify-bin
  sassc
  kitty
  thunar
  curl
  wget
  sqlite3
  mpv
  ffmpeg
  sox
  grim
  slurp
  wf-recorder
  wl-clipboard
  iproute2
)

CYBERKALI_BUILD_PACKAGES=(
  git
  pkg-config
  meson
  ninja-build
  npm
  golang-go
  valac
  valadoc
  gobject-introspection
  libgirepository1.0-dev
  libgtk-3-dev
  libgtk-layer-shell-dev
  libgtk-4-dev
  libgtk4-layer-shell-dev
  libwayland-dev
  wayland-protocols
  libjson-glib-dev
  libgdk-pixbuf-2.0-dev
)

CYBERKALI_OPTIONAL_PACKAGES=(
  brightnessctl
  power-profiles-daemon
  bluez
  bluez-tools
  fonts-jetbrains-mono
  rofi
)

pkg_available() { apt-cache show "$1" >/dev/null 2>&1; }
pkg_installed() { dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q 'install ok installed'; }

scan_group() {
  local missing_name="$1" unavailable_name="$2"
  shift 2
  local package
  local -n missing_ref="$missing_name"
  local -n unavailable_ref="$unavailable_name"
  for package in "$@"; do
    if pkg_installed "$package"; then continue
    elif pkg_available "$package"; then missing_ref+=("$package")
    else unavailable_ref+=("$package")
    fi
  done
}

scan_packages() {
  MISSING_REQUIRED=(); MISSING_BUILD=(); MISSING_OPTIONAL=()
  UNAVAILABLE_REQUIRED=(); UNAVAILABLE_BUILD=(); UNAVAILABLE_OPTIONAL=()
  scan_group MISSING_REQUIRED UNAVAILABLE_REQUIRED "${CYBERKALI_REQUIRED_PACKAGES[@]}"
  scan_group MISSING_BUILD UNAVAILABLE_BUILD "${CYBERKALI_BUILD_PACKAGES[@]}"
  scan_group MISSING_OPTIONAL UNAVAILABLE_OPTIONAL "${CYBERKALI_OPTIONAL_PACKAGES[@]}"
}

install_packages() {
  scan_packages
  if [ ${#UNAVAILABLE_REQUIRED[@]} -gt 0 ]; then fail "Required packages unavailable in current APT metadata: ${UNAVAILABLE_REQUIRED[*]}"; return 1; fi
  if [ ${#UNAVAILABLE_BUILD[@]} -gt 0 ]; then fail "AGS/Astal build dependencies unavailable: ${UNAVAILABLE_BUILD[*]}"; return 1; fi
  if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then info "Installing required packages: ${MISSING_REQUIRED[*]}"; sudo apt-get install -y "${MISSING_REQUIRED[@]}"; else ok "Required runtime packages already installed"; fi
  if [ ${#MISSING_BUILD[@]} -gt 0 ]; then info "Installing AGS/Astal build dependencies"; sudo apt-get install -y "${MISSING_BUILD[@]}"; else ok "AGS/Astal build dependencies already installed"; fi
  if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then info "Installing available optional packages: ${MISSING_OPTIONAL[*]}"; sudo apt-get install -y "${MISSING_OPTIONAL[@]}" || warn "Some optional packages could not be installed"; fi
  if [ ${#UNAVAILABLE_OPTIONAL[@]} -gt 0 ]; then warn "Optional packages unavailable: ${UNAVAILABLE_OPTIONAL[*]}"; fi
}
