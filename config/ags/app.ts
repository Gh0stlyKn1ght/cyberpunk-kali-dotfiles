import { App } from "./widget.ts"
import { execAsync } from "astal"
import { HudWindow } from "./modules/hud.ts"

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
    if (request === "reload-style") {
      compileCss().then(() => response("ok")).catch(() => response("error"))
      return
    }
    response("unknown request")
  },
  main() {
    compileCss()
    HudWindow()
  },
})
