# Desktop fidelity recovery

This document covers the animation and presentation layer only. If Hyprland, AGS, or Astal itself is failing, use the main README troubleshooting flow first.

## Workspace animation fails but workspaces still switch

The workspace wrapper is designed to fail soft. It asks AGS to show the cosmetic transition, then dispatches the actual workspace change through `hyprctl`.

Check the helper:

```bash
ls -l ~/.config/cyberkali/bin/workspace-switch
~/.config/cyberkali/bin/workspace-switch 2
```

Test the animation separately:

```bash
cyberkali workspace-test 2
```

If the workspace changes but no animation appears, AGS or the transition widget is the problem. Do not edit Hyprland workspace rules to fix a cosmetic effect.

Recovery:

```bash
cyberkali restart
hyprctl reload
```

If the helper is missing, rerun the CyberKali installer to reinstall managed scripts.

## Workspace transition briefly blocks input

The transition window uses Astal's supported `clickThrough` property. If a future Astal regression causes the overlay to intercept input, disable only the cosmetic path by changing workspace keybinds back to direct Hyprland dispatches:

```text
bind = $mod, 1, workspace, 1
```

The desktop does not depend on the transition overlay.

## HUD is covering application content

Toggle the HUD below normal windows:

```bash
cyberkali hud-layer
```

or use:

```text
SUPER + SHIFT + Z
```

The command alternates the projected HUD between the TOP and BOTTOM layer. If layer switching itself fails, restart AGS:

```bash
cyberkali restart
```

## Corner status widget is missing

Confirm AGS is running and inspect its log:

```bash
cyberkali status
tail -n 150 ~/.local/state/cyberkali/ags.log
```

Compile the fidelity stylesheet directly:

```bash
sassc ~/.config/ags/styles/fidelity.scss /tmp/cyberkali-fidelity.css
```

If this reports a Sass error, fix the stylesheet problem before restarting the shell.

## Amber CRT effect is too strong or hurts performance

The CRT overlay is cosmetic and only renders when the active flavor is `amber`. Switch flavors to verify the issue:

```bash
cyberkali flavor cyan
```

If performance returns to normal, the CRT surface is the likely cause. You can temporarily disable it by commenting out `CrtOverlayWindow()` in `config/ags/app.ts`, then restart CyberKali.

The overlay is click-through and should never be required for input or authentication.

## Amber scanlines remain after changing flavor

The overlay reads the flavor state periodically, but stale AGS state can still survive a partial style reload.

Recovery:

```bash
cyberkali flavor red
cyberkali restart
```

Verify the state file:

```bash
cat ~/.config/cyberkali/flavor
```

## Effects flicker incorrectly on multi-monitor systems

The first fidelity pass uses one full-screen transition/CRT surface. Multi-monitor geometry can differ between GPUs, scaling factors, and mixed-resolution displays.

Collect:

```bash
hyprctl monitors -j | jq
```

If the effect is mis-sized, keep the functional desktop and disable only the cosmetic full-screen overlay until monitor-specific surfaces are implemented.

## Emergency fidelity rollback

If the desktop works but the fidelity layer does not, do not roll back the entire installation. Stop AGS, then temporarily remove only the new fidelity modules from the AGS entrypoint:

- `CornerWidgets()`
- `WorkspaceTransitionWindow()`
- `CrtOverlayWindow()`

Restart:

```bash
cyberkali restart
```

Core Hyprland, Kiroshi, NetWatch, Radioport, system controls, and the lock screen do not depend on these effects.
