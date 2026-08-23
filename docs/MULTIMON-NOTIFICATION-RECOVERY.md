# Multi-monitor, notification, and power recovery

This layer adds per-monitor HUD surfaces, freedesktop notification intake, and session power controls. None of these features should be required to get back to a normal Kali desktop.

## Multi-monitor geometry is wrong

Inspect what Hyprland sees first:

```bash
cyberkali monitors
hyprctl monitors -j | jq
```

Common causes are mixed scale factors, a monitor hot-plugged after AGS started, or a display manager restoring a different monitor layout than expected.

Recovery:

```bash
cyberkali restart
hyprctl reload
```

If one monitor remains wrong, put monitor-specific Hyprland settings in `~/.config/hypr/cyberkali-local.conf`, then restart Hyprland or log out and back in. Do not hard-code one machine's monitor geometry into the shared CyberKali source.

If the projected HUD becomes unusable on secondary screens, stop AGS without stopping Hyprland:

```bash
cyberkali stop
```

The compositor and applications remain usable. Restart the shell with `cyberkali start` after correcting the monitor configuration.

## A newly connected monitor has no HUD

CyberKali enumerates monitors when AGS starts. Hot-plugging a display does not currently rebuild every layer-shell surface dynamically.

Run:

```bash
cyberkali restart
```

This is expected behavior for the current implementation and is safer than keeping stale GTK layer-shell windows attached to removed displays.

## Desktop notifications do not appear

Check the freedesktop notification bus owner:

```bash
busctl --user status org.freedesktop.Notifications
pkg-config --modversion astal-notifd-0.1
cyberkali status
```

Send a normal desktop notification, not only a CyberKali internal one:

```bash
notify-send 'CyberKali desktop test' 'freedesktop notification path'
```

Then inspect:

```bash
tail -n 100 ~/.local/state/cyberkali/ags.log
```

If `AstalNotifd` is missing, rebuild the pinned source runtime:

```bash
rm -rf ~/.cache/cyberkali/build
./install.sh
```

## dunst, mako, or another notification daemon conflicts with CyberKali

CyberKali does not automatically disable another notification daemon. AstalNotifd can operate as a proxy while another owner holds `org.freedesktop.Notifications`, but desktop environments and user services can still create confusing ownership/restart races.

Find likely user services:

```bash
systemctl --user --type=service | grep -Ei 'dunst|mako|notif'
pgrep -a -f 'dunst|mako|notification'
busctl --user status org.freedesktop.Notifications
```

Choose one notification presentation stack for the Hyprland session. If you want CyberKali to own the presentation, stop the other daemon for the current session first:

```bash
systemctl --user stop dunst.service 2>/dev/null || true
systemctl --user stop mako.service 2>/dev/null || true
cyberkali restart
```

Do not permanently disable a desktop notification service until you have verified that CyberKali notifications work after a fresh login.

To return to the previous daemon, stop CyberKali and start the old service again:

```bash
cyberkali stop
systemctl --user start dunst.service 2>/dev/null || true
systemctl --user start mako.service 2>/dev/null || true
```

## Notifications duplicate

A duplicate popup usually means two presentation paths are active. Check the notification bus owner and running notification processes as above. CyberKali intentionally does not kill another daemon automatically because that would make rollback harder.

## Power menu button does nothing

Test the underlying command directly:

```bash
loginctl lock-session
systemctl suspend
```

For reboot/poweroff capability inspection:

```bash
loginctl show-session "$XDG_SESSION_ID" 2>/dev/null
systemctl status systemd-logind --no-pager
```

Do not run AGS as root. Power actions are delegated to systemd/logind and should follow the system's normal polkit/logind rules.

If the Power Matrix UI itself is broken, the normal commands still work from a terminal:

```bash
loginctl lock-session
systemctl suspend
systemctl reboot
systemctl poweroff
```

## Power menu accidentally opened

The panel does not execute an action until a button is clicked. Choose `CANCEL` or toggle it again with `SUPER+SHIFT+P`.

## Emergency recovery

If this entire layer is suspect:

```bash
cyberkali stop
```

Use the Hyprland session without AGS, or log out and select Kali's normal desktop session. Multi-monitor enumeration, notification presentation, and the Power Matrix are all shell features and do not alter the underlying display manager, NetworkManager, PipeWire, or systemd-logind configuration.
