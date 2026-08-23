# Visual Layer

CyberKali's visual layer is intentionally shared across the Red, Cyan, and Amber flavors.

## Projected HUD

The primary HUD is rendered with Cairo through AGS/Astal instead of relying only on rectangular GTK boxes. It applies a small perspective/skew transform to system telemetry, workspace state, and network status so the desktop reads closer to an in-world cyberdeck HUD.

## Notifications

The notification surface accepts local CyberKali requests and keeps a bounded in-memory history. This creates a common presentation path for package Street Cred events and future desktop-notification integration.

## Lockscreen

`generate-lockscreen` writes a Hyprlock configuration from the active flavor. The generated lock screen preserves the same red, cyan, or phosphor-amber identity as the running shell.

The generated lock screen is local runtime state and is not committed back into the repository.
