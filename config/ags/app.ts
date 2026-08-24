import { App } from "./widget.ts"
import { execAsync } from "astal"
import GLib from "gi://GLib"
import { ProjectedHudWindow, toggleHudLayer } from "./modules/projected-hud.ts"
import { LauncherWindow, hideLauncher, showLauncher, toggleLauncher } from "./modules/launcher.ts"
import { NetwatchWindow, hideNetwatch, showNetwatch, toggleNetwatch } from "./modules/netwatch.ts"
import { MediaWindow, hideMedia, showMedia, toggleMedia } from "./modules/media.ts"
import { StreetCredWindow, showStreetCred } from "./modules/streetcred.ts"
import { NotificationWindow, hideNotification, showNotification } from "./modules/notifications.ts"
import { NotificationCenterWindow, pushNotice, toggleNotificationCenter } from "./modules/notification-center.ts"
import { NotificationActionsWindow, toggleNotificationActions } from "./modules/notification-actions.ts"
import { SystemControlsWindow, toggleSystemControls } from "./modules/system-controls.ts"
import { CornerWidgets } from "./modules/corner-widgets.ts"
import { WorkspaceTransitionWindow, triggerWorkspaceTransition } from "./modules/workspace-transition.ts"
import { CrtOverlayWindow } from "./modules/crt-overlay.ts"
import { monitors } from "./modules/monitors.ts"
import { PowerMenuWindow, togglePowerMenu } from "./modules/power-menu.ts"
import { startDesktopNotificationBridge, toggleNotificationDnd } from "./modules/desktop-notifications.ts"
import { SystemSidePanel } from "./modules/system-sidepanel.ts"

const ROOT = `${GLib.get_user_config_dir()}/ags`
const styles = ["main", "fidelity", "intelligence"]

const compileCss = async () => {
  try {
    for (const name of styles) {
      const scss = `${ROOT}/styles/${name}.scss`
      const css = `${ROOT}/styles/${name}.css`
      await execAsync(["sassc", scss, css])
      App.apply_css(css, true)
    }
  } catch (error) { print(`[cyberkali] stylesheet compile failed: ${error}`) }
}

const parseStreetCred = (request: string) => {
  if (!request.startsWith("streetcred|")) return false
  const [, pkg = "", version = ""] = request.split("|", 3)
  showStreetCred(pkg, version); pushNotice("PACKAGE INSTALLED", `${pkg} ${version}`.trim()); return true
}
const parseNotification = (request: string) => {
  if (!request.startsWith("notify|")) return false
  const [, title = "SYSTEM MESSAGE", body = ""] = request.split("|", 3)
  showNotification(title, body); pushNotice(title, body); return true
}
const parseWorkspaceTransition = (request: string) => {
  if (!request.startsWith("workspace-glitch|")) return false
  const [, target = ""] = request.split("|", 2); triggerWorkspaceTransition(target); return true
}

App.start({
  instanceName: "cyberkali",
  requestHandler(request, response) {
    const reply = (value: string) => { try { response(value) } catch {} }
    if (request === "reload-style") compileCss().then(() => reply("ok")).catch(() => reply("error"))
    else if (request === "launcher") { toggleLauncher(); reply("ok") }
    else if (request === "launcher-open") { showLauncher(); reply("ok") }
    else if (request === "launcher-close") { hideLauncher(); reply("ok") }
    else if (request === "netwatch") { toggleNetwatch(); reply("ok") }
    else if (request === "netwatch-open") { showNetwatch(); reply("ok") }
    else if (request === "netwatch-close") { hideNetwatch(); reply("ok") }
    else if (request === "media") { toggleMedia(); reply("ok") }
    else if (request === "media-open") { showMedia(); reply("ok") }
    else if (request === "media-close") { hideMedia(); reply("ok") }
    else if (request === "notifications") { toggleNotificationCenter(); reply("ok") }
    else if (request === "notification-actions") { toggleNotificationActions(); reply("ok") }
    else if (request === "notification-dnd") { reply(toggleNotificationDnd()) }
    else if (request === "controls") { toggleSystemControls(); reply("ok") }
    else if (request === "power") { togglePowerMenu(); reply("ok") }
    else if (request === "hud-layer") reply(toggleHudLayer())
    else if (request === "notification-close") { hideNotification(); reply("ok") }
    else if (parseStreetCred(request) || parseNotification(request) || parseWorkspaceTransition(request)) reply("ok")
    else reply("unknown request")
  },
  main() {
    compileCss()
    const displays = monitors()
    if (displays.length) {
      for (const m of displays) {
        ProjectedHudWindow(m.monitor, String(m.index), m.primary)
        CornerWidgets(m.monitor, String(m.index))
      }
    } else {
      ProjectedHudWindow(); CornerWidgets()
    }
    SystemSidePanel()
    WorkspaceTransitionWindow()
    CrtOverlayWindow()
    LauncherWindow()
    NetwatchWindow()
    MediaWindow()
    StreetCredWindow()
    NotificationWindow()
    NotificationCenterWindow()
    NotificationActionsWindow()
    SystemControlsWindow()
    PowerMenuWindow()
    startDesktopNotificationBridge()
  },
})
