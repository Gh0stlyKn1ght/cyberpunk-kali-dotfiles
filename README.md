# Cyberpunk Kali Dotfiles

A Kali Linux / Hyprland desktop shell inspired by Cyberpunk-style HUD interfaces, using AGS/Astal with three switchable visual flavors.

## Flavors

- `red` - closest to the original CyberArch visual direction
- `cyan` - cold netrunner / Kiroshi edition
- `amber` - old-school phosphor workstation edition with CRT treatment

All three flavors share the same components. Fixes and features are maintained once.

## Current features

- Kali Rolling / Debian-aware installer
- Hyprland session configuration
- pinned AGS v3 / Astal source bootstrap
- per-monitor projected Cairo HUD surfaces
- projected corner status widgets on each active monitor
- CPU, RAM, disk, workspace, interface, IPv4, VPN, time, and mode telemetry
- Kiroshi application launcher with Kali tool categories
- NetWatch network-intelligence panel
- Radioport MPRIS media controls
- notification toast surface + in-session notification center
- freedesktop desktop notification intake through AstalNotifd
- DPKG package watcher with `+ STREET CRED` install events
- volume, microphone, brightness, Wi-Fi, and Bluetooth controls
- Power Matrix for lock, logout, suspend, reboot, and poweroff
- workspace glitch transitions with fail-soft switching
- HUD top/bottom layer toggle
- flavor-aware Hyprlock
- Amber CRT overlay
- screenshot and recording helpers
- config backups and recovery procedures
- `cyberkali doctor` diagnostics

## Install

Run the dry-run first.

```bash
git clone https://github.com/Gh0stlyKn1ght/cyberpunk-kali-dotfiles.git
cd cyberpunk-kali-dotfiles
chmod +x install.sh
./install.sh --dry-run
./install.sh --flavor red
```

The installer may build pinned Astal and AGS components from source, including `AstalNotifd`. Build artifacts are cached under:

```text
~/.cache/cyberkali/build/
```

After installation:

```bash
cyberkali doctor
cyberkali status
```

Then log out and choose the Hyprland session.

## Controls

```text
SUPER + Space       Kiroshi launcher
SUPER + Return      Kitty terminal
SUPER + E           File manager
SUPER + 1..0        Workspace switch + glitch effect
SUPER + SHIFT + N   NetWatch
SUPER + SHIFT + O   Radioport
SUPER + SHIFT + M   Notification center
SUPER + SHIFT + V   System controls
SUPER + SHIFT + P   Power Matrix
SUPER + SHIFT + Z   HUD top/bottom layer
SUPER + SHIFT + C   Cycle Red -> Cyan -> Amber
SUPER + SHIFT + L   Lock
SUPER + SHIFT + S   Screenshot region
SUPER + SHIFT + R   Screen recording
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
cyberkali power
cyberkali hud-layer
cyberkali workspace-test 2
cyberkali notify-test "SYSTEM TEST" "notification path operational"
cyberkali streetcred-test nmap test
cyberkali monitors
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
    |     +-- local machine overrides
    |     +-- flavor-aware Hyprlock
    |
    +-- AGS / Astal
    |     +-- per-monitor Cairo HUD
    |     +-- corner telemetry
    |     +-- Kiroshi launcher
    |     +-- NetWatch
    |     +-- Radioport
    |     +-- notification daemon/proxy bridge
    |     +-- notification center
    |     +-- system controls
    |     +-- Power Matrix
    |     +-- Street Cred
    |     +-- workspace / CRT effects
    |
    +-- user service
    |     +-- dpkg package event watcher
    |
    +-- CyberKali CLI
          +-- diagnostics
          +-- shell lifecycle
          +-- flavor and overlay controls
```

## Source runtime policy

CyberKali does not follow AGS/Astal `main` during installation. `dependencies.lock` pins known revisions so upstream changes do not silently alter a tested install.

# Troubleshooting and recovery

Recovery is a first-class feature. Do not start by purging Kali packages. Work outward in this order:

```text
Hyprland -> session environment / portals -> AGS/Astal -> CyberKali component
```

## First response: get a shell

If Hyprland works but the CyberKali shell does not:

```bash
cyberkali doctor
cyberkali status
cyberkali restart
tail -n 200 ~/.local/state/cyberkali/ags.log
```

If the graphical session is unusable, switch to a TTY with `CTRL+ALT+F2`, log in, and stop the shell:

```bash
pkill -f 'ags run.*config/ags/app.ts' || true
systemctl --user stop cyberkali-package-watch.service || true
```

You can then log out and choose Kali's normal desktop session.

## Black screen or Hyprland exits

```bash
hyprctl version
hyprctl configerrors
find "${XDG_RUNTIME_DIR:-/run/user/$UID}/hypr" -type f -name 'hyprland.log' -print
```

CyberKali backs up managed files under:

```text
~/.local/state/cyberkali/backups/
```

Find the latest backup:

```bash
cat ~/.local/state/cyberkali/latest-backup
```

Restore a previous `hyprland.conf` only after confirming the backup contains it.

## Multi-monitor HUD is missing, duplicated, or positioned incorrectly

CyberKali enumerates active monitors when AGS starts.

Inspect the layout:

```bash
cyberkali monitors
hyprctl monitors -j | jq
```

After plugging, unplugging, rotating, or changing scale:

```bash
cyberkali restart
```

Machine-specific monitor rules belong in:

```text
~/.config/hypr/cyberkali-local.conf
```

Do not hard-code one computer's monitor geometry into the shared repository.

If the HUD itself is unusable but Hyprland is fine:

```bash
cyberkali stop
```

This removes AGS surfaces without stopping the compositor.

## Mixed-DPI or mixed-resolution displays

Check each scale and logical geometry:

```bash
cyberkali monitors
```

If an overlay is clipped or oversized after a scale change, restart AGS. Current multi-monitor surfaces are created at shell startup rather than dynamically rebuilt for every hotplug event.

## Desktop notifications do not appear

CyberKali uses pinned `AstalNotifd` to receive/proxy `org.freedesktop.Notifications`.

```bash
pkg-config --modversion astal-notifd-0.1
busctl --user status org.freedesktop.Notifications
notify-send 'CyberKali test' 'desktop notification path'
tail -n 100 ~/.local/state/cyberkali/ags.log
```

If `AstalNotifd` is missing:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

## dunst, mako, or another notification daemon conflicts

CyberKali does not automatically disable another daemon.

```bash
systemctl --user --type=service | grep -Ei 'dunst|mako|notif'
pgrep -a -f 'dunst|mako|notification'
busctl --user status org.freedesktop.Notifications
```

For a temporary CyberKali-only notification test:

```bash
systemctl --user stop dunst.service 2>/dev/null || true
systemctl --user stop mako.service 2>/dev/null || true
cyberkali restart
notify-send 'CyberKali test' 'single notification owner test'
```

Do not permanently disable your previous daemon until CyberKali notifications work after a fresh login.

Rollback:

```bash
cyberkali stop
systemctl --user start dunst.service 2>/dev/null || true
systemctl --user start mako.service 2>/dev/null || true
```

Duplicate popups usually mean two presentation paths are active.

## Notification center is empty

The message buffer is intentionally in-memory and clears when AGS restarts.

```bash
cyberkali notify-test "TEST" "message buffer test"
cyberkali messages
```

This is not a persistent notification database.

## AGS starts with `Typelib ... not found`

```bash
ags run ~/.config/ags/app.ts
pkg-config --modversion astal-io-0.1
pkg-config --modversion astal-3.0
pkg-config --modversion astal-4.0
pkg-config --modversion astal-notifd-0.1
find /usr/local -name '*.typelib' | grep -E 'Astal|Gnim'
echo "$GI_TYPELIB_PATH"
```

Log out and back in after a source build so `~/.profile` is reloaded.

Temporary current-shell recovery:

```bash
export GI_TYPELIB_PATH="/usr/local/lib/girepository-1.0:/usr/local/lib/x86_64-linux-gnu/girepository-1.0${GI_TYPELIB_PATH:+:$GI_TYPELIB_PATH}"
export LD_LIBRARY_PATH="/usr/local/lib:/usr/local/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
cyberkali restart
```

Do not symlink incompatible versioned `.so` files to hide ABI errors. Rebuild the pinned runtime.

## AGS/Astal build fails

```bash
sudo apt update
sudo apt --fix-broken install
sudo dpkg --configure -a
./install.sh --dry-run
```

If the CyberKali build cache is corrupted:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

Do not remove `/usr/local` wholesale.

## Portals, screen sharing, or Wayland apps are broken

```bash
systemctl --user status xdg-desktop-portal-hyprland
systemctl --user status xdg-desktop-portal
journalctl --user -u xdg-desktop-portal-hyprland -b --no-pager
```

Refresh the environment:

```bash
dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE
systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE
systemctl --user restart xdg-desktop-portal-hyprland.service || true
systemctl --user restart xdg-desktop-portal.service || true
```

Do not install random competing portal backends as a first fix.

## Screenshots or recordings are black

```bash
command -v grim slurp wf-recorder wl-copy
grim /tmp/cyberkali-test.png
grim -g "$(slurp)" /tmp/cyberkali-region.png
```

If direct capture fails while portal-based sharing works, inspect Hyprland screencopy permissions and compositor configuration.

## NetWatch looks wrong

```bash
ip route
ip -brief address
nmcli device status
nmcli -t -f NAME,TYPE connection show --active
cat /etc/resolv.conf
```

VPN detection is heuristic and may not recognize every vendor-specific interface name.

## Radioport has no media

```bash
playerctl -l
playerctl status
playerctl metadata
```

If `playerctl -l` is empty, the application is not exposing an MPRIS player.

## System control shows N/A

```bash
wpctl status
brightnessctl -m
nmcli radio
bluetoothctl show
```

Common expected cases:

- desktops and some VMs have no brightness device
- VMs may have no Bluetooth adapter
- PipeWire/WirePlumber may not be active
- NetworkManager may not own a manually configured interface

Do not run AGS as root to make a control button work.

## Power Matrix action fails

The panel delegates to normal session tools.

```bash
loginctl lock-session
systemctl suspend
systemctl status systemd-logind --no-pager
```

Reboot and poweroff still follow the system's normal logind/polkit rules. CyberKali does not bypass them.

If the panel itself is broken, use the standard commands from a terminal:

```bash
loginctl lock-session
systemctl suspend
systemctl reboot
systemctl poweroff
```

## Street Cred does not trigger

```bash
systemctl --user status cyberkali-package-watch.service
journalctl --user -u cyberkali-package-watch.service -b --no-pager
tail -n 20 /var/log/dpkg.log
cyberkali streetcred-test nmap test
```

## Flavor switching is partial

```bash
cyberkali flavor amber
cyberkali restart
cat ~/.config/cyberkali/flavor
sassc ~/.config/ags/styles/main.scss /tmp/cyberkali.css
sassc ~/.config/ags/styles/fidelity.scss /tmp/cyberkali-fidelity.css
```

## Lock screen fails

```bash
hyprlock -c ~/.config/hypr/hyprlock.conf
~/.config/cyberkali/bin/generate-lockscreen
cat ~/.config/hypr/hyprlock.conf
```

Safe fallback:

```bash
loginctl lock-session
```

Never weaken PAM just to make the themed lock screen work.

## Kali Rolling upgrade breaks the shell

```bash
cyberkali doctor
hyprctl version
ags --version
pkg-config --modversion astal-3.0
pkg-config --modversion astal-notifd-0.1
```

If AGS/Astal ABI state is inconsistent:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

If Hyprland itself is broken, use Kali's normal desktop until the compositor/runtime issue is resolved.

## Emergency rollback

1. Switch to a TTY with `CTRL+ALT+F2` if necessary.
2. Stop CyberKali:

```bash
pkill -f 'ags run.*config/ags/app.ts' || true
systemctl --user disable --now cyberkali-package-watch.service || true
```

3. Inspect managed paths:

```bash
readlink ~/.config/ags || true
readlink ~/.config/hypr/hyprland.conf || true
readlink ~/.config/hypr/cyberkali-keybinds.conf || true
```

4. Restore prior configs from `~/.local/state/cyberkali/backups/`.
5. Log out and choose Kali's normal desktop session.

Do not purge the display manager, Xfce/GNOME, NetworkManager, PipeWire, or other base Kali desktop components as a troubleshooting step.

## Diagnostic bundle

```bash
cyberkali doctor
cyberkali status
cyberkali monitors
hyprctl version
hyprctl configerrors
ags --version
pkg-config --modversion astal-io-0.1 astal-3.0 astal-4.0 astal-notifd-0.1
busctl --user status org.freedesktop.Notifications
systemctl --user status xdg-desktop-portal-hyprland --no-pager
systemctl --user status cyberkali-package-watch.service --no-pager
tail -n 150 ~/.local/state/cyberkali/ags.log
```

Do not post tokens, SSH keys, VPN credentials, browser profiles, `/etc/shadow`, or full environment-variable dumps in bug reports.

Additional focused recovery notes are in `docs/FIDELITY-RECOVERY.md` and `docs/MULTIMON-NOTIFICATION-RECOVERY.md`.
