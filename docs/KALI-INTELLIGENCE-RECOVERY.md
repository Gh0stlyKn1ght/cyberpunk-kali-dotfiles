# Kali Intelligence and Notification Recovery

This document covers the feature layer added after multi-monitor and desktop-notification integration.

## Kiroshi metadata looks wrong or is slow

Kiroshi resolves package ownership only for visible launcher results and caches metadata for the AGS process lifetime.

Check a binary directly:

```bash
command -v nmap
dpkg-query -S "$(command -v nmap)"
dpkg-query -W nmap
```

If package ownership is ambiguous, that is a Debian packaging issue rather than a launcher crash. Restart CyberKali to clear the in-memory metadata cache:

```bash
cyberkali restart
```

## Favorite tool does not move to the top

Favorites are stored in:

```text
~/.config/cyberkali/favorites
```

Use the CLI rather than editing state blindly:

```bash
cyberkali favorite list
cyberkali favorite add nmap
cyberkali favorite remove nmap
```

Restart CyberKali after changing favorites so cached launcher metadata is rebuilt:

```bash
cyberkali restart
```

## Recent tools are stale

Recent launches are stored in:

```text
~/.config/cyberkali/recent-tools
```

This file is non-sensitive launcher state. To reset it:

```bash
rm -f ~/.config/cyberkali/recent-tools
cyberkali restart
```

## Searching for an uninstalled Kali tool

Kiroshi indexes installed desktop applications. Use APT metadata to find packages that are available but not installed:

```bash
cyberkali tool-search nmap
apt-cache search --names-only nmap
```

Do not make Kiroshi install packages automatically. Package installation remains an explicit terminal/admin action.

## Notification action buttons do nothing

Only actions provided by the sending application can be invoked.

Open the latest actionable notification:

```bash
cyberkali notification-actions
```

If the panel says there are no app-provided actions, the notification did not include any.

If buttons appear but do nothing, the sending process may already have exited. AstalNotifd documents that invoking an action only notifies the original client.

Inspect the AGS log:

```bash
tail -n 150 ~/.local/state/cyberkali/ags.log
```

## DND does not suppress popups

Toggle DND:

```bash
cyberkali dnd
```

CyberKali DND affects CyberKali presentation through AstalNotifd. If dunst, mako, or another daemon is also showing notifications, resolve notification ownership first.

```bash
busctl --user status org.freedesktop.Notifications
pgrep -a -f 'dunst|mako|notification'
```

## Power profile controls show N/A

Check the backend:

```bash
command -v powerprofilesctl
powerprofilesctl get
systemctl status power-profiles-daemon --no-pager
```

Desktops, virtual machines, and some hardware/driver combinations may not expose all profiles. This is expected. CyberKali should continue working with profile controls unavailable.

Do not replace logind, ACPI, or kernel power-management configuration just to make the UI show a profile.

## Battery shows N/A

Check UPower and kernel power devices:

```bash
upower -e
ls -la /sys/class/power_supply
```

A desktop or VM without a virtual battery should report N/A.

## Side-panel traffic is incorrect after network changes

The panel follows CyberKali's active-interface state. Inspect the route and counters:

```bash
ip route
ip -brief address
cat /proc/net/dev
```

After changing VPNs, docks, or network adapters:

```bash
cyberkali restart
```

## Intelligence-layer emergency rollback

These features are optional. If the launcher or notification-action additions cause problems, the compositor and Kali desktop do not depend on them.

```bash
cyberkali stop
```

Then use Kali's normal applications/menu. The state files below can be safely removed if desired:

```bash
rm -f ~/.config/cyberkali/recent-tools
rm -f ~/.config/cyberkali/favorites
```

Do not purge APT packages as a launcher recovery step.
