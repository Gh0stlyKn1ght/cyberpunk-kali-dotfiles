import GLib from "gi://GLib"
import { interval } from "astal"
import { Anchor, DrawingArea, Exclusivity, Layer, Window } from "../widget.ts"

let win: any = null
let area: any = null
let active = false
let target = ""
let started = 0
let ticker: any = null

const readFlavor = () => {
  try {
    const [ok, bytes] = GLib.file_get_contents(`${GLib.get_user_config_dir()}/cyberkali/flavor`)
    return ok ? new TextDecoder().decode(bytes).trim() : "red"
  } catch { return "red" }
}

const col = () => {
  const f = readFlavor()
  if (f === "cyan") return [0.38, 0.95, 1]
  if (f === "amber") return [1, 0.69, 0]
  return [1, 0.18, 0.24]
}

export const WorkspaceTransitionWindow = () => {
  area = DrawingArea({})
  area.set_size_request(1920, 1080)
  area.connect("draw", (_w: any, ctx: any) => {
    if (!active) return false
    const elapsed = Date.now() - started
    const p = Math.min(1, elapsed / 420)
    const fade = p < 0.55 ? p / 0.55 : (1 - p) / 0.45
    const c = col()

    ctx.setSourceRGBA(0, 0, 0, Math.max(0, fade) * 0.38)
    ctx.paint()

    const seed = Math.floor(elapsed / 24)
    for (let i = 0; i < 22; i++) {
      const y = ((seed * 43 + i * 67) % 980) + 20
      const h = 2 + ((seed + i * 11) % 12)
      const offset = ((seed * 29 + i * 17) % 180) - 90
      ctx.setSourceRGBA(c[0], c[1], c[2], Math.max(0, fade) * 0.12)
      ctx.rectangle(110 + offset, y, 1700 - Math.abs(offset), h)
      ctx.fill()
    }

    ctx.selectFontFace("JetBrains Mono", 0, 1)
    ctx.setFontSize(54)
    ctx.setSourceRGBA(c[0], c[1], c[2], Math.max(0, fade) * 0.95)
    ctx.moveTo(92, 180)
    ctx.showText(`WORKSPACE // ${String(target).padStart(2, "0")}`)
    ctx.setFontSize(13)
    ctx.moveTo(96, 208)
    ctx.showText("KIROSHI DISPLAY RE-SYNCHRONIZATION")
    return false
  })

  win = Window({
    name: "cyberkali-workspace-transition",
    className: "cyberkali-workspace-transition",
    anchor: Anchor.TOP | Anchor.BOTTOM | Anchor.LEFT | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    clickThrough: true,
    child: area,
  })
  return win
}

export const triggerWorkspaceTransition = (workspace: string) => {
  if (!win || !area) return
  target = workspace
  started = Date.now()
  active = true
  win.visible = true
  if (ticker) ticker.cancel()
  ticker = interval(16, () => {
    area.queue_draw()
    if (Date.now() - started > 450) {
      active = false
      win.visible = false
      ticker?.cancel?.()
      ticker = null
    }
  })
}
