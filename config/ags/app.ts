import { App } from "./widget.ts"
import { execAsync } from "astal"
import { HudWindow } from "./modules/hud.ts"
import { LauncherWindow, hideLauncher, showLauncher, toggleLauncher } from "./modules/launcher.ts"

const ROOT = `${App.configDir}`
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

App.start({
  instanceName: "cyberkali",
  requestHandler(request, response) {
    const reply = (value: string) => {
      try { response(value) } catch {}
    }

    if (request === "reload-style") {
      compileCss().then(() => reply("ok")).catch(() => reply("error"))
    } else if (request === "launcher") {
      toggleLauncher()
      reply("ok")
    } else if (request === "launcher-open") {
      showLauncher()
      reply("ok")
    } else if (request === "launcher-close") {
      hideLauncher()
      reply("ok")
    } else {
      reply("unknown request")
    }
  },
  main() {
    compileCss()
    HudWindow()
    LauncherWindow()
  },
})
