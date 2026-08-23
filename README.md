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
- CyberKali notification surface
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
    |     +-- notifications
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

If that backup does not contain `hyprland.conf`, inspect older directories under:

```text
~/.local/state/cyberkali/backups/
```

The installer creates separate timestamped backups as managed paths are replaced, so the newest backup is not guaranteed to contain every previous config file.

## Hyprland works but applications open slowly, portals fail, or screen sharing is broken

Wayland applications rely heavily on the desktop portal and the correct session environment. Hyprland's own documentation calls out incorrect XDG/DBus environment state as a common cause of slow application startup and broken sharing.

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
```

Then restart the portals:

```bash
systemctl --user restart xdg-desktop-portal-hyprland.service || true
systemctl --user restart xdg-desktop-portal.service || true
```

If `xdg-desktop-portal-hyprland` crashes, verify the Wayland Qt runtime and inspect its journal rather than installing random portal implementations. Multiple competing portal backends can cause confusing behavior.

## Screenshots or recording return black output

Confirm the tools are present:

```bash
command -v grim slurp wf-recorder wl-copy
```

Check Hyprland's screencopy permissions and current portal state. Newer Hyprland versions can explicitly deny direct screencopy clients such as `grim` and `wf-recorder`.

Test screenshot capture directly:

```bash
grim /tmp/cyberkali-test.png
file /tmp/cyberkali-test.png
```

Test a region:

```bash
grim -g "$(slurp)" /tmp/cyberkali-region.png
```

If direct capture fails while portal-based sharing works, the issue is likely compositor permission/configuration rather than CyberKali.

## AGS command exists but the CyberKali shell does not start

Run the shell in the foreground so the actual error is visible:

```bash
ags run ~/.config/ags/app.ts
```

Then verify the pinned runtime:

```bash
command -v ags
ags --version
pkg-config --modversion astal-io-0.1
pkg-config --modversion astal-3.0
pkg-config --modversion astal-4.0
```

Check whether GObject Introspection can see the locally installed typelibs:

```bash
find /usr/local/lib /usr/local/lib/* -path '*girepository-1.0*' -type f 2>/dev/null | grep -i Astal
printf '%s\n' "$GI_TYPELIB_PATH"
```

The source-build bootstrap adds `/usr/local` typelib/library paths to `~/.profile`. If you installed from a terminal inside an already-running desktop, log out and back in before assuming the build failed.

Temporary current-shell recovery:

```bash
export GI_TYPELIB_PATH="/usr/local/lib/girepository-1.0:/usr/local/lib/x86_64-linux-gnu/girepository-1.0${GI_TYPELIB_PATH:+:$GI_TYPELIB_PATH}"
export LD_LIBRARY_PATH="/usr/local/lib:/usr/local/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
cyberkali restart
```

Do not "fix" library errors by symlinking one versioned `.so` to a different ABI version. Rebuild the pinned runtime instead.

## AGS/Astal fails while building

Do not repeatedly rerun the entire installer first. Inspect which stage failed.

The build cache is:

```text
~/.cache/cyberkali/build/
```

Verify the build toolchain:

```bash
meson --version
ninja --version
npm --version
go version
valac --version
pkg-config --version
```

Refresh Kali packages and retry:

```bash
sudo apt update
sudo apt --fix-broken install
sudo dpkg --configure -a
./install.sh --dry-run
```

If the cache is corrupted, remove only the CyberKali build cache and let the pinned sources rebuild:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

Do not remove `/usr/local` wholesale.

## `Typelib file for namespace ... not found`

This usually means the build installed successfully but GJS cannot locate the generated GObject Introspection typelib.

Check:

```bash
echo "$GI_TYPELIB_PATH"
find /usr/local -name '*.typelib' | grep -E 'Astal|Gnim'
```

Then log out and back in, or test with the temporary `GI_TYPELIB_PATH` export shown above.

If the required typelib is genuinely absent, clear `~/.cache/cyberkali/build` and rebuild from the pinned revisions rather than mixing random AGS/Astal releases.

## Kiroshi launcher does not open

First confirm the shell is alive:

```bash
cyberkali status
```

Then request the launcher manually:

```bash
ags request launcher --instance cyberkali
```

If that works, the problem is the Hyprland keybind. Reload Hyprland:

```bash
hyprctl reload
hyprctl configerrors
```

If the request fails, inspect:

```bash
tail -n 200 ~/.local/state/cyberkali/ags.log
```

## NetWatch shows missing or incorrect data

NetWatch intentionally uses local Linux networking state rather than privileged packet capture.

Useful checks:

```bash
ip route
ip -brief address
nmcli device status
nmcli -t -f NAME,TYPE connection show --active
cat /etc/resolv.conf
```

VPN detection is heuristic. Interfaces such as `tun0`, `tap0`, or `wg0` are recognized, but vendor VPN clients may use different interface names.

## Radioport says no active media

Check Playerctl directly:

```bash
playerctl -l
playerctl status
playerctl metadata
```

Not every player exposes MPRIS. If `playerctl -l` is empty, Radioport has nothing to control and CyberKali is behaving correctly.

## Street Cred notifications do not appear after `apt install`

Check the package watcher:

```bash
systemctl --user status cyberkali-package-watch.service
journalctl --user -u cyberkali-package-watch.service -b --no-pager
tail -n 20 /var/log/dpkg.log
```

Test the UI independently of dpkg:

```bash
cyberkali streetcred-test nmap test
```

If the manual test works but real installs do not, the watcher or `/var/log/dpkg.log` access is the problem. Restart it:

```bash
systemctl --user restart cyberkali-package-watch.service
```

If the service was installed while no proper user systemd session was available:

```bash
systemctl --user daemon-reload
systemctl --user enable --now cyberkali-package-watch.service
```

## Flavor switching changes some elements but not others

The SCSS layer and Cairo HUD both consume the flavor state, but long-running processes may retain old state until restarted.

Run:

```bash
cyberkali flavor amber
cyberkali restart
```

Inspect the selected flavor:

```bash
cat ~/.config/cyberkali/flavor
```

If the generated stylesheet is suspect:

```bash
sassc ~/.config/ags/styles/main.scss /tmp/cyberkali.css
```

Any Sass error printed here should be fixed before restarting AGS.

## Lock screen fails or immediately exits

Test Hyprlock from a terminal before relying on the keybind:

```bash
hyprlock -c ~/.config/hypr/hyprlock.conf
```

Regenerate the active flavor configuration:

```bash
~/.config/cyberkali/bin/generate-lockscreen
```

Then inspect the generated file:

```bash
cat ~/.config/hypr/hyprlock.conf
```

Kali can package a Hyprlock version older or newer than the configuration syntax used during development. If Hyprlock reports an unknown property, remove or adjust that property rather than disabling PAM or weakening authentication.

If you need an immediate safe fallback, lock the login session through systemd/logind:

```bash
loginctl lock-session
```

Never replace PAM configuration merely to make the visual lock screen work.

## Package upgrade breaks Hyprland or CyberKali

Kali Rolling changes quickly. Before a large upgrade, keep a working login session available and do not delete the normal Kali desktop environment.

After an upgrade:

```bash
cyberkali doctor
hyprctl version
ags --version
pkg-config --modversion astal-3.0
```

If AGS/Astal ABI state is inconsistent, rebuild the pinned runtime:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

If Hyprland itself is broken, use the standard Kali desktop session until the packaged compositor/runtime issue is resolved.

## Emergency rollback to the normal Kali desktop

CyberKali is not intended to replace your ability to use Kali without it.

1. Switch to a TTY with `CTRL+ALT+F2` if necessary.
2. Stop CyberKali components:

```bash
pkill -f 'ags run.*config/ags/app.ts' || true
systemctl --user disable --now cyberkali-package-watch.service || true
```

3. Remove only CyberKali-managed symlinks/configs after confirming what they point to:

```bash
readlink ~/.config/ags || true
readlink ~/.config/hypr/hyprland.conf || true
readlink ~/.config/hypr/cyberkali-keybinds.conf || true
```

4. Restore prior configs from `~/.local/state/cyberkali/backups/`.
5. Log out and choose the normal Kali desktop session.

Do not purge Kali's display manager, Xfce/GNOME packages, NetworkManager, PipeWire, or other base desktop components as a troubleshooting step.

## Useful diagnostic bundle

When reporting a bug, these commands provide most of the useful state without dumping unrelated personal files:

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

Do not post tokens, browser profiles, SSH keys, VPN credentials, `/etc/shadow`, or the complete output of environment-variable dumps in bug reports.

## Status

The projected visual layer is under active development. Current work focuses on Cairo HUD geometry, native notification surfaces, lock-screen integration, richer system controls, and additional recovery automation.