#!/usr/bin/env bash

# Packages available directly from Kali/Debian repositories. Keep optional
# feature dependencies separate so a missing package never bricks the shell.
CYBERKALI_REQUIRED_PACKAGES=(
  hyprland
  xdg-desktop-portal-hyprland
  gjs
  gir1.2-gtk-3.0
  network-manager
  wireplumber
  playerctl
  upower
  socat
  jq
  rofi
  libnotify-bin
  sassc
  kitty
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
)

CYBERKALI_OPTIONAL_PACKAGES=(
  brightnessctl
  power-profiles-daemon
  bluez
  bluez-tools
  fonts-jetbrains-mono
)

pkg_available() {
  apt-cache show "$1" >/dev/null 2>&1
}

pkg_installed() {
  dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q 'install ok installed'
}

scan_packages() {
  local package
  MISSING_REQUIRED=()
  MISSING_OPTIONAL=()
  UNAVAILABLE_REQUIRED=()
  UNAVAILABLE_OPTIONAL=()

  for package in "${CYBERKALI_REQUIRED_PACKAGES[@]}"; do
    if pkg_installed "$package"; then
      continue
    elif pkg_available "$package"; then
      MISSING_REQUIRED+=("$package")
    else
      UNAVAILABLE_REQUIRED+=("$package")
    fi
  done

  for package in "${CYBERKALI_OPTIONAL_PACKAGES[@]}"; do
    if pkg_installed "$package"; then
      continue
    elif pkg_available "$package"; then
      MISSING_OPTIONAL+=("$package")
    else
      UNAVAILABLE_OPTIONAL+=("$package")
    fi
  done
}

install_packages() {
  scan_packages

  if [ ${#UNAVAILABLE_REQUIRED[@]} -gt 0 ]; then
    warn "Required packages unavailable in current APT metadata: ${UNAVAILABLE_REQUIRED[*]}"
    warn "These may need a source build or a Kali package-name adapter."
  fi

  if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then
    info "Installing required packages: ${MISSING_REQUIRED[*]}"
    sudo apt-get install -y "${MISSING_REQUIRED[@]}"
  else
    ok "Required APT packages already installed"
  fi

  if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then
    info "Installing available optional packages: ${MISSING_OPTIONAL[*]}"
    sudo apt-get install -y "${MISSING_OPTIONAL[@]}" || warn "Some optional packages could not be installed"
  fi

  if [ ${#UNAVAILABLE_OPTIONAL[@]} -gt 0 ]; then
    warn "Optional packages unavailable: ${UNAVAILABLE_OPTIONAL[*]}"
  fi
}
