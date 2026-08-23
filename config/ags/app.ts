import { App } from "./widget.ts"
import { execAsync } from "astal"
import GLib from "gi://GLib"
import { ProjectedHudWindow } from "./modules/projected-hud.ts"
import { LauncherWindow, hideLauncher, showLauncher, toggleLauncher } from "./modules/launcher.ts"
import { NetwatchWindow, hideNetwatch, showNetwatch, toggleNetwatch } from "./modules/netwatch.ts"
import { MediaWindow, hideMedia, showMedia, toggleMedia } from "./modules/media.ts"
import { StreetCredWindow, showStreetCred } from "./modules/streetcred.ts"
import { NotificationWindow, hideNotification, showNotification } from "./modules/notifications.ts"
import { NotificationCenterWindow, pushNotice, toggleNotificationCenter } from "./modules/notification-center.ts"
import { SystemControlsWindow, toggleSystemControls } from "./modules/system-controls.ts"

const ROOT = `${GLib.get_user_config_dir()}/ags`
const SCSS = `${ROOT}/styles/main.scss`
const CSS = `${ROOT}/styles/main.css`

const compileCss = async () => {
  try {
    await execAsync(["sassc", SCSS, CSS])
    App.apply_css(CSS, true)
  } catch (error) {
    print(`[cyberkali] stylesheet compile failed: ${error}`)
  }
}

const parseStreetCred = (request: string) => {
  if (!request.startsWith("streetcred|")) return false
  const [, pkg = "", version = ""] = request.split("|", 3)
  showStreetCred(pkg, version)
  pushNotice("PACKAGE INSTALLED", `${pkg} ${version}`.trim())
  return true
}

const parseNotification = (request: string) => {
  if (!request.startsWith("notify|")) return false
  const [, title = "SYSTEM MESSAGE", body = ""] = request.split("|", 3)
  showNotification(title, body)
  pushNotice(title, body)
  return true
}

App.start({
  instanceName: "cyberkali",
  requestHandler(request, response) {
    const reply = (value: string) => {
      try { response(value) } catch {}
    }

    if (request === "reload-style") {
      compileCss().then(() => reply("ok")).catch(() => reply("error"))
    } else if (request === "launcher") {
      toggleLauncher(); reply("ok")
    } else if (request === "launcher-open") {
      showLauncher(); reply("ok")
    } else if (request === "launcher-close") {
      hideLauncher(); reply("ok")
    } else if (request === "netwatch") {
      toggleNetwatch(); reply("ok")
    } else if (request === "netwatch-open") {
      showNetwatch(); reply("ok")
    } else if (request === "netwatch-close") {
      hideNetwatch(); reply("ok")
    } else if (request === "media") {
      toggleMedia(); reply("ok")
    } else if (request === "media-open") {
      showMedia(); reply("ok")
    } else if (request === "media-close") {
      hideMedia(); reply("ok")
    } else if (request === "notifications") {
      toggleNotificationCenter(); reply("ok")
    } else if (request === "controls") {
      toggleSystemControls(); reply("ok")
    } else if (request === "notification-close") {
      hideNotification(); reply("ok")
    } else if (parseStreetCred(request) || parseNotification(request)) {
      reply("ok")
    } else {
      reply("unknown request")
    }
  },
  main() {
    compileCss()
    ProjectedHudWindow()
    LauncherWindow()
    NetwatchWindow()
    MediaWindow()
    StreetCredWindow()
    NotificationWindow()
    NotificationCenterWindow()
    SystemControlsWindow()
  },
})
