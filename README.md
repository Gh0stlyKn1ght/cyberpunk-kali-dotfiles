# Cyberpunk Kali Dotfiles

A Kali Linux / Hyprland desktop shell inspired by cyberpunk HUD interfaces, using AGS/Astal with a shared runtime and three switchable visual flavors.

## Flavors

- `red` - Cyberpunk red, matching the visual direction of CyberArch-Dotfiles.
- `cyan` - cold cyan / netrunner edition.
- `amber` - old-school phosphor amber workstation edition.

All three flavors use the same components. Color, glow, surface, warning, grid, and text tokens change without duplicating the shell.

## Current features

- Kali Rolling / Debian-aware installer
- Hyprland session configuration
- AGS v3 / Astal source bootstrap with pinned upstream revisions
- CPU, RAM, disk, workspace, interface, IPv4, and VPN telemetry HUD
- Kali-aware Kiroshi application launcher
- application classification for recon, web, network, credentials, exploitation, reverse engineering, forensics, and wireless tools
- Red / Cyan / Amber runtime switching
- Wayland screenshot and screen-recording keybinds
- existing-config backups
- host-local Hyprland override file that is never overwritten
- `cyberkali doctor`, `status`, `start`, `stop`, `restart`, and `launcher`

## Install

This project is still under active development. Run the dry-run first.

```bash
git clone https://github.com/Gh0stlyKn1ght/cyberpunk-kali-dotfiles.git
cd cyberpunk-kali-dotfiles
chmod +x install.sh
./install.sh --dry-run
./install.sh --flavor red
```

The installer may build Astal and AGS from pinned source revisions when a compatible AGS runtime is not already installed. Build output is cached under `~/.cache/cyberkali/build`.

After installation:

```bash
cyberkali doctor
cyberkali status
```

Log out and select the Hyprland session from your display manager.

## Controls

```text
SUPER + Space       Kiroshi application launcher
SUPER + Return      Kitty terminal
SUPER + E           File manager
SUPER + 1..0        Workspaces
SUPER + SHIFT + C   Cycle Red -> Cyan -> Amber
SUPER + SHIFT + S   Region screenshot to clipboard
SUPER + SHIFT + R   Start / stop screen recording
SUPER + SHIFT + H   Keybind reminder
```

## CLI

```bash
cyberkali flavor red
cyberkali flavor cyan
cyberkali flavor amber
cyberkali cycle
cyberkali launcher
cyberkali start
cyberkali stop
cyberkali restart
cyberkali status
cyberkali doctor
```

## Architecture

```text
Kali Rolling
    |
    +-- Hyprland
    |     +-- managed session config
    |     +-- user-owned local overrides
    |
    +-- AGS / Astal
    |     +-- HUD telemetry
    |     +-- Kiroshi launcher
    |     +-- shared theme tokens
    |
    +-- CyberKali CLI
          +-- flavor control
          +-- diagnostics
          +-- shell lifecycle
```

## Source runtime policy

CyberKali does not track AGS or Astal `main` at install time. `dependencies.lock` pins known revisions so a future upstream change cannot silently change a previously tested installation.

## Status

The first functional shell layer is implemented. The next porting layers are notifications, media controls, richer CyberArch HUD geometry/animations, Kali package-event Street Cred, lock screen, and additional NetWatch panels.
