# Cyberpunk Kali Dotfiles

A Kali Linux + Hyprland desktop shell inspired by cyberpunk HUD interfaces. CyberKali uses AGS/Astal, Cairo drawing, and three shared visual flavors without forking the component architecture.

## Flavors

- `red` - closest to the original CyberArch visual direction
- `cyan` - cold netrunner / Kiroshi edition
- `amber` - old-school phosphor workstation edition with CRT treatment

## Current features

- Kali Rolling / Debian-aware installer
- Hyprland session configuration with machine-local overrides
- pinned AGS v3 / Astal source bootstrap
- per-monitor projected Cairo HUD and corner telemetry
- CPU, RAM, disk, network, VPN, battery, time, media, and power-profile telemetry
- Kiroshi launcher with Kali categories, package ownership, versions, binary paths, favorites, and recents
- APT package search for tools not currently installed
- NetWatch network-intelligence panel
- Radioport MPRIS media controls
- freedesktop notification intake through AstalNotifd
- notification center, DND, and app-provided notification actions
- DPKG `+ STREET CRED` package-install events
- volume, microphone, brightness, Wi-Fi, Bluetooth, battery, and power-profile controls
- Power Matrix for lock, logout, suspend, reboot, and poweroff
- fail-soft workspace glitch transitions
- HUD layer toggle
- flavor-aware Hyprlock
- Amber CRT treatment
- screenshot / recording helpers
- multi-monitor diagnostics, backups, and recovery procedures

## Install

Run the dry-run first.

```bash
git clone https://github.com/Gh0stlyKn1ght/cyberpunk-kali-dotfiles.git
cd cyberpunk-kali-dotfiles
chmod +x install.sh
./install.sh --dry-run
./install.sh --flavor red
```

CyberKali may build pinned Astal/AGS components from source, including AstalNotifd. Build state is cached under:

```text
~/.cache/cyberkali/build/
```

After installation:

```bash
cyberkali doctor
cyberkali status
```

Log out and select the Hyprland session. Keep Kali's normal desktop session installed as a recovery path.

## Main controls

```text
SUPER + Space       Kiroshi launcher
SUPER + Return      Kitty terminal
SUPER + E           File manager
SUPER + 1..0        Workspace switch + glitch
SUPER + SHIFT + A   Latest notification actions
SUPER + SHIFT + D   Toggle CyberKali DND
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
cyberkali notification-actions
cyberkali dnd
cyberkali hud-layer
cyberkali monitors
cyberkali workspace-test 2
cyberkali notify-test "SYSTEM TEST" "notification path operational"
cyberkali streetcred-test nmap test
cyberkali tool-search wireshark
cyberkali favorite add nmap
cyberkali favorite remove nmap
cyberkali favorite list
cyberkali start
cyberkali stop
cyberkali restart
cyberkali status
cyberkali doctor
```

## Kiroshi Kali intelligence

Kiroshi indexes installed desktop applications and enriches visible results locally with:

- Kali-style tool category
- resolved executable path
- owning Debian/Kali package
- installed package version
- favorite state
- recent launch ordering

Favorites live in:

```text
~/.config/cyberkali/favorites
```

Recent launcher state lives in:

```text
~/.config/cyberkali/recent-tools
```

Kiroshi does **not** silently install packages. To search Kali/APT metadata for an uninstalled tool:

```bash
cyberkali tool-search nuclei
```

## Architecture

```text
Kali Rolling
    |
    +-- Hyprland
    |     +-- managed shared config
    |     +-- cyberkali-local.conf
    |     +-- Hyprlock
    |
    +-- AGS / Astal
    |     +-- per-monitor Cairo HUD
    |     +-- Kiroshi Kali intelligence
    |     +-- NetWatch / Radioport
    |     +-- AstalNotifd bridge
    |     +-- notification actions + DND
    |     +-- system / power controls
    |     +-- Street Cred
    |     +-- workspace + CRT effects
    |
    +-- user services
    |     +-- dpkg package watcher
    |
    +-- CyberKali CLI
          +-- diagnostics
          +-- lifecycle / recovery
          +-- flavor / overlay controls
          +-- package search / favorites
```

## Source runtime policy

CyberKali does not follow AGS/Astal `main` at install time. `dependencies.lock` pins known revisions so upstream changes do not silently mutate a previously tested install.

# Troubleshooting and recovery

Recovery is a first-class feature. Do not start by purging Kali packages. Work outward in this order:

```text
Hyprland -> session environment / portals -> AGS/Astal -> CyberKali component
```

## First response

If Hyprland works but CyberKali does not:

```bash
cyberkali doctor
cyberkali status
cyberkali restart
tail -n 200 ~/.local/state/cyberkali/ags.log
```

If the graphical session is unusable, switch to a TTY with `CTRL+ALT+F2` and stop the custom shell:

```bash
pkill -f 'ags run.*config/ags/app.ts' || true
systemctl --user stop cyberkali-package-watch.service || true
```

Then return to Kali's normal desktop session.

## Hyprland black screen or immediate exit

```bash
hyprctl version
hyprctl configerrors
find "${XDG_RUNTIME_DIR:-/run/user/$UID}/hypr" -type f -name 'hyprland.log' -print
```

Backups are stored under:

```text
~/.local/state/cyberkali/backups/
```

Check the last backup location:

```bash
cat ~/.local/state/cyberkali/latest-backup
```

Do not delete Kali's display manager or normal desktop environment while diagnosing CyberKali.

## Multi-monitor HUD missing, duplicated, or mis-scaled

CyberKali enumerates monitors when AGS starts.

```bash
cyberkali monitors
hyprctl monitors -j | jq
```

After hotplug, rotation, resolution, or scale changes:

```bash
cyberkali restart
```

Machine-specific monitor rules belong in:

```text
~/.config/hypr/cyberkali-local.conf
```

If the HUD is unusable but Hyprland works:

```bash
cyberkali stop
```

## AGS/Astal missing typelib or ABI errors

```bash
ags run ~/.config/ags/app.ts
pkg-config --modversion astal-io-0.1
pkg-config --modversion astal-3.0
pkg-config --modversion astal-4.0
pkg-config --modversion astal-notifd-0.1
find /usr/local -name '*.typelib' | grep -E 'Astal|Gnim'
echo "$GI_TYPELIB_PATH"
```

After a source install, log out and back in so `~/.profile` is reloaded.

Temporary current-shell recovery:

```bash
export GI_TYPELIB_PATH="/usr/local/lib/girepository-1.0:/usr/local/lib/x86_64-linux-gnu/girepository-1.0${GI_TYPELIB_PATH:+:$GI_TYPELIB_PATH}"
export LD_LIBRARY_PATH="/usr/local/lib:/usr/local/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
cyberkali restart
```

Do not hide ABI errors by symlinking incompatible versioned `.so` files.

## AGS/Astal source build fails

```bash
sudo apt update
sudo apt --fix-broken install
sudo dpkg --configure -a
./install.sh --dry-run
```

If only CyberKali's build cache is corrupt:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

Do not remove `/usr/local` wholesale.

## Desktop notifications missing or duplicated

```bash
pkg-config --modversion astal-notifd-0.1
busctl --user status org.freedesktop.Notifications
notify-send 'CyberKali test' 'desktop notification path'
pgrep -a -f 'dunst|mako|notification'
tail -n 100 ~/.local/state/cyberkali/ags.log
```

CyberKali does not automatically disable dunst, mako, or another daemon. Duplicate popups usually mean multiple presentation paths are active.

Temporary isolation test:

```bash
systemctl --user stop dunst.service 2>/dev/null || true
systemctl --user stop mako.service 2>/dev/null || true
cyberkali restart
notify-send 'CyberKali test' 'single notification owner test'
```

Rollback:

```bash
cyberkali stop
systemctl --user start dunst.service 2>/dev/null || true
systemctl --user start mako.service 2>/dev/null || true
```

## Notification action buttons do nothing

Only actions supplied by the sending application can be invoked.

```bash
cyberkali notification-actions
tail -n 150 ~/.local/state/cyberkali/ags.log
```

If there are no actions, the notification did not provide any. If an action exists but does nothing, the original application may already have exited.

## DND does not suppress all popups

```bash
cyberkali dnd
busctl --user status org.freedesktop.Notifications
pgrep -a -f 'dunst|mako|notification'
```

CyberKali DND controls CyberKali's AstalNotifd presentation. Another running notification daemon may still present its own popups.

## Kiroshi metadata is wrong, stale, or slow

Check the binary/package directly:

```bash
command -v nmap
dpkg-query -S "$(command -v nmap)"
dpkg-query -W nmap
```

Metadata is cached for the running AGS process. Clear the runtime cache by restarting:

```bash
cyberkali restart
```

Reset only recent launcher state if needed:

```bash
rm -f ~/.config/cyberkali/recent-tools
cyberkali restart
```

Do not purge packages to repair launcher metadata.

## Favorite does not move to the top

```bash
cyberkali favorite list
cyberkali favorite add nmap
cyberkali restart
```

The favorites file is `~/.config/cyberkali/favorites`.

## Tool is not installed / not visible in Kiroshi

Kiroshi primarily indexes installed applications. Search APT metadata separately:

```bash
cyberkali tool-search <term>
apt-cache search --names-only <term>
```

Installation remains an explicit admin action.

## System controls show N/A

```bash
wpctl status
brightnessctl -m
nmcli radio
bluetoothctl show
powerprofilesctl get
upower -e
```

Expected cases include:

- desktops/VMs with no brightness device
- no Bluetooth adapter
- no virtual battery
- hardware that does not expose every power profile
- PipeWire/WirePlumber not running
- interfaces unmanaged by NetworkManager

Do not run AGS as root to make controls work.

## Power profiles unavailable

```bash
command -v powerprofilesctl
powerprofilesctl get
systemctl status power-profiles-daemon --no-pager
```

CyberKali should continue normally if power-profile support is unavailable.

## Side-panel traffic looks wrong after VPN/dock/network changes

```bash
ip route
ip -brief address
cat /proc/net/dev
cyberkali restart
```

## NetWatch incorrect

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

If `playerctl -l` is empty, the application is not exposing MPRIS.

## Portals / screen sharing / Wayland apps broken

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

Do not install random competing portal backends as a first fix.

## Screenshots or recordings are black

```bash
command -v grim slurp wf-recorder wl-copy
grim /tmp/cyberkali-test.png
grim -g "$(slurp)" /tmp/cyberkali-region.png
```

If direct capture fails while portal sharing works, inspect Hyprland screencopy permissions and compositor configuration.

## Street Cred does not trigger

```bash
systemctl --user status cyberkali-package-watch.service
journalctl --user -u cyberkali-package-watch.service -b --no-pager
tail -n 20 /var/log/dpkg.log
cyberkali streetcred-test nmap test
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

Never weaken PAM for a themed lock screen.

## Kali Rolling upgrade breaks CyberKali

```bash
cyberkali doctor
hyprctl version
ags --version
pkg-config --modversion astal-3.0
pkg-config --modversion astal-notifd-0.1
```

If the pinned AGS/Astal runtime is inconsistent:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

Use Kali's normal desktop if Hyprland itself is broken.

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

Do not purge the display manager, Xfce/GNOME, NetworkManager, PipeWire, or other base desktop components as a troubleshooting step.

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

Do not post tokens, SSH keys, VPN credentials, browser profiles, `/etc/shadow`, or complete environment-variable dumps in bug reports.

Focused recovery documents:

- `docs/FIDELITY-RECOVERY.md`
- `docs/MULTIMON-NOTIFICATION-RECOVERY.md`
- `docs/KALI-INTELLIGENCE-RECOVERY.md`
