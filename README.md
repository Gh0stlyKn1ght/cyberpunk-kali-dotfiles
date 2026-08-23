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
- projected Cairo HUD with CPU, RAM, disk, workspace, interface, IPv4, and VPN telemetry
- Kali-aware Kiroshi application launcher
- application classification for recon, web, network, credentials, exploitation, reverse engineering, forensics, and wireless tools
- NetWatch overlay for interface, IPv4, gateway, DNS, Wi-Fi, and VPN state
- Radioport media overlay with playerctl previous / play-pause / next controls
- DPKG package watcher with Cyberpunk `+ STREET CRED` install notifications
- CyberKali notification toast surface
- notification center with an in-session bounded event buffer
- local system-control matrix for volume, microphone, brightness, Wi-Fi, and Bluetooth
- flavor-aware Hyprlock generation
- Red / Cyan / Amber runtime switching
- Wayland screenshot and screen-recording keybinds
- existing-config backups
- host-local Hyprland override file that is never overwritten
- CLI diagnostics and direct overlay test commands

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
SUPER + SHIFT + N   NetWatch network intelligence
SUPER + SHIFT + O   Radioport media controls
SUPER + SHIFT + M   Notification center
SUPER + SHIFT + V   Local system controls
SUPER + SHIFT + C   Cycle Red -> Cyan -> Amber
SUPER + SHIFT + L   Lock session
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
cyberkali netwatch
cyberkali media
cyberkali messages
cyberkali controls
cyberkali notify-test "SYSTEM TEST" "notification path operational"
cyberkali streetcred-test nmap 7.x
cyberkali start
cyberkali stop
cyberkali restart
cyberkali status
cyberkali doctor
```

## Package Street Cred

CyberKali does not modify APT itself. A user-level systemd service watches `/var/log/dpkg.log` and sends package install events to the running AGS shell. This keeps the feature reversible and avoids a root-owned theme hook.

## Architecture

```text
Kali Rolling
    |
    +-- Hyprland
    |     +-- managed session config
    |     +-- user-owned local overrides
    |     +-- flavor-aware Hyprlock
    |
    +-- AGS / Astal
    |     +-- projected Cairo HUD
    |     +-- Kiroshi launcher
    |     +-- NetWatch
    |     +-- Radioport
    |     +-- Street Cred overlay
    |     +-- notification toast + message buffer
    |     +-- local hardware control matrix
    |     +-- shared theme tokens
    |
    +-- user service
    |     +-- dpkg package event watcher
    |
    +-- CyberKali CLI
          +-- flavor control
          +-- diagnostics
          +-- shell lifecycle
          +-- overlay controls
```

## Source runtime policy

CyberKali does not track AGS or Astal `main` at install time. `dependencies.lock` pins known revisions so a future upstream change cannot silently change a previously tested installation.

# Troubleshooting and recovery

CyberKali replaces parts of the desktop session, so recovery is treated as a first-class feature. Do not start deleting Kali packages when the shell breaks. Work from the compositor outward: Hyprland -> environment/portals -> AGS/Astal -> CyberKali widgets.

## First response: get a shell

If Hyprland starts but the HUD is missing, open a terminal with `SUPER+Return` and run:

```bash
cyberkali doctor
cyberkali status
cyberkali restart
```

Inspect the AGS log:

```bash
tail -n 200 ~/.local/state/cyberkali/ags.log
```

If the desktop is unusable, switch to a TTY with `CTRL+ALT+F2` or another available function-key TTY, log in, and stop the custom shell:

```bash
pkill -f 'ags run.*config/ags/app.ts' || true
systemctl --user stop cyberkali-package-watch.service || true
```

You can then log out of the Hyprland session and select Kali's normal desktop session from the display manager.

## Hyprland opens to a black screen or immediately exits

Start by validating the generated configuration:

```bash
hyprctl version
hyprctl configerrors
```

From a TTY, inspect the latest Hyprland logs under the user runtime directory:

```bash
find "${XDG_RUNTIME_DIR:-/run/user/$UID}/hypr" -type f -name 'hyprland.log' -print
```

Typical causes are a configuration option unsupported by the Kali-packaged Hyprland version, a missing runtime library, a GPU/driver issue, or a stale environment variable.

### Recovery

CyberKali backs up managed files before replacing them. Find the latest backup:

```bash
cat ~/.local/state/cyberkali/latest-backup
ls -la "$(cat ~/.local/state/cyberkali/latest-backup)"
```

If `hyprland.conf` is the problem, remove the CyberKali symlink and restore the backed-up file:

```bash
rm -f ~/.config/hypr/hyprland.conf
cp -a "$(cat ~/.local/state/cyberkali/latest-backup)/hyprland.conf" ~/.config/hypr/hyprland.conf
```

If that backup does not contain `hyprland.conf`, inspect older directories under `~/.local/state/cyberkali/backups/`. The newest backup is not guaranteed to contain every previous config file.

## Hyprland works but applications open slowly, portals fail, or screen sharing is broken

Check the portal:

```bash
systemctl --user status xdg-desktop-portal-hyprland
systemctl --user status xdg-desktop-portal
journalctl --user -u xdg-desktop-portal-hyprland -b --no-pager
```

Refresh the session environment:

```bash
dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE
systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE
systemctl --user restart xdg-desktop-portal-hyprland.service || true
systemctl --user restart xdg-desktop-portal.service || true
```

If `xdg-desktop-portal-hyprland` crashes, inspect its journal rather than installing random portal implementations. Multiple competing backends can cause confusing behavior.

## Screenshots or recording return black output

Confirm the tools are present:

```bash
command -v grim slurp wf-recorder wl-copy
```

Test direct capture:

```bash
grim /tmp/cyberkali-test.png
grim -g "$(slurp)" /tmp/cyberkali-region.png
```

If direct capture fails while portal-based sharing works, inspect Hyprland screencopy permissions and compositor configuration rather than reinstalling CyberKali.

## AGS command exists but the CyberKali shell does not start

Run the shell in the foreground:

```bash
ags run ~/.config/ags/app.ts
```

Verify the pinned runtime:

```bash
command -v ags
ags --version
pkg-config --modversion astal-io-0.1
pkg-config --modversion astal-3.0
pkg-config --modversion astal-4.0
```

Check locally installed typelibs:

```bash
find /usr/local/lib /usr/local/lib/* -path '*girepository-1.0*' -type f 2>/dev/null | grep -i Astal
printf '%s\n' "$GI_TYPELIB_PATH"
```

Temporary current-shell recovery:

```bash
export GI_TYPELIB_PATH="/usr/local/lib/girepository-1.0:/usr/local/lib/x86_64-linux-gnu/girepository-1.0${GI_TYPELIB_PATH:+:$GI_TYPELIB_PATH}"
export LD_LIBRARY_PATH="/usr/local/lib:/usr/local/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
cyberkali restart
```

Do not fix library errors by symlinking one versioned `.so` to a different ABI version. Rebuild the pinned runtime instead.

## AGS/Astal fails while building

The build cache is `~/.cache/cyberkali/build/`.

Verify the toolchain:

```bash
meson --version
ninja --version
npm --version
go version
valac --version
pkg-config --version
```

Repair Kali package state first:

```bash
sudo apt update
sudo apt --fix-broken install
sudo dpkg --configure -a
./install.sh --dry-run
```

If only the CyberKali build cache is corrupted:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

Do not remove `/usr/local` wholesale.

## `Typelib file for namespace ... not found`

Check:

```bash
echo "$GI_TYPELIB_PATH"
find /usr/local -name '*.typelib' | grep -E 'Astal|Gnim'
```

Log out and back in after source installation. If the required typelib is genuinely absent, clear the CyberKali build cache and rebuild from pinned revisions instead of mixing random AGS/Astal releases.

## Kiroshi launcher does not open

```bash
cyberkali status
ags request launcher --instance cyberkali
hyprctl reload
hyprctl configerrors
tail -n 200 ~/.local/state/cyberkali/ags.log
```

If the manual AGS request works, the problem is the Hyprland keybind rather than Kiroshi itself.

## NetWatch shows missing or incorrect data

```bash
ip route
ip -brief address
nmcli device status
nmcli -t -f NAME,TYPE connection show --active
cat /etc/resolv.conf
```

VPN detection is heuristic. Interfaces such as `tun0`, `tap0`, or `wg0` are recognized, but vendor VPN clients may use different interface names.

## Radioport says no active media

```bash
playerctl -l
playerctl status
playerctl metadata
```

Not every player exposes MPRIS. If `playerctl -l` is empty, Radioport has nothing to control.

## Notification center is empty or messages do not appear

The current message buffer stores CyberKali events for the lifetime of the AGS process. Restarting AGS intentionally clears it. It is not yet a persistent desktop notification database.

Test both paths:

```bash
cyberkali notify-test "TEST" "message buffer test"
cyberkali messages
```

If the toast appears but the message center stays empty, inspect the AGS log for `notification-center` errors. If neither appears, verify the shell instance:

```bash
ags request 'notify|TEST|direct request' --instance cyberkali
cyberkali status
```

Recovery is safe because no notification daemon is replaced. Restart only CyberKali:

```bash
cyberkali restart
```

## System controls show N/A or a button does nothing

The control matrix intentionally degrades by feature. A missing optional tool must not crash the shell.

Check each backend independently:

```bash
wpctl status
wpctl get-volume @DEFAULT_AUDIO_SINK@
wpctl get-volume @DEFAULT_AUDIO_SOURCE@
brightnessctl -m
nmcli radio
bluetoothctl show
```

Common cases:

- `brightnessctl` reports no device on desktops or some VMs. Brightness will show `N/A`; this is expected.
- `bluetoothctl` fails when no Bluetooth adapter exists or BlueZ is not running. Bluetooth controls can be ignored.
- `wpctl` fails when PipeWire/WirePlumber is not active. Check `systemctl --user status pipewire wireplumber`.
- `nmcli` changes can fail if NetworkManager is not managing the interface.

Do not run the AGS shell as root to make a control button work. Fix the underlying user service or accept the unavailable optional control.

## Street Cred notifications do not appear after `apt install`

```bash
systemctl --user status cyberkali-package-watch.service
journalctl --user -u cyberkali-package-watch.service -b --no-pager
tail -n 20 /var/log/dpkg.log
cyberkali streetcred-test nmap test
```

If the UI test works but real installs do not, restart the watcher:

```bash
systemctl --user daemon-reload
systemctl --user enable --now cyberkali-package-watch.service
```

## Flavor switching changes some elements but not others

```bash
cyberkali flavor amber
cyberkali restart
cat ~/.config/cyberkali/flavor
sassc ~/.config/ags/styles/main.scss /tmp/cyberkali.css
```

Any Sass error should be fixed before restarting AGS.

## Lock screen fails or immediately exits

```bash
hyprlock -c ~/.config/hypr/hyprlock.conf
~/.config/cyberkali/bin/generate-lockscreen
cat ~/.config/hypr/hyprlock.conf
```

If Hyprlock reports an unknown property, adjust that property for the Kali-packaged Hyprlock version. Do not weaken PAM authentication.

Immediate safe fallback:

```bash
loginctl lock-session
```

## Package upgrade breaks Hyprland or CyberKali

After a Kali Rolling upgrade:

```bash
cyberkali doctor
hyprctl version
ags --version
pkg-config --modversion astal-3.0
```

If AGS/Astal ABI state is inconsistent:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

If Hyprland itself is broken, use the standard Kali desktop session until the packaged compositor/runtime issue is resolved.

## Emergency rollback to the normal Kali desktop

1. Switch to a TTY with `CTRL+ALT+F2` if necessary.
2. Stop CyberKali components:

```bash
pkill -f 'ags run.*config/ags/app.ts' || true
systemctl --user disable --now cyberkali-package-watch.service || true
```

3. Inspect managed paths before removing anything:

```bash
readlink ~/.config/ags || true
readlink ~/.config/hypr/hyprland.conf || true
readlink ~/.config/hypr/cyberkali-keybinds.conf || true
```

4. Restore prior configs from `~/.local/state/cyberkali/backups/`.
5. Log out and choose the normal Kali desktop session.

Do not purge Kali's display manager, Xfce/GNOME packages, NetworkManager, PipeWire, or other base desktop components as a troubleshooting step.

## Useful diagnostic bundle

```bash
cyberkali doctor
cyberkali status
hyprctl version
hyprctl configerrors
ags --version
pkg-config --modversion astal-io-0.1 astal-3.0 astal-4.0
systemctl --user status xdg-desktop-portal-hyprland --no-pager
systemctl --user status cyberkali-package-watch.service --no-pager
tail -n 150 ~/.local/state/cyberkali/ags.log
```

Do not post tokens, browser profiles, SSH keys, VPN credentials, `/etc/shadow`, or complete environment-variable dumps in bug reports.

## Status

The projected visual layer is under active development. Current work focuses on richer notification integration, projected side widgets, system-control polish, lock-screen fidelity, and animation/glitch behavior.
