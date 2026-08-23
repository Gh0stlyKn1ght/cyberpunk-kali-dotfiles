import GLib from "gi://GLib"
import { interval } from "astal"
import { Anchor, DrawingArea, Exclusivity, Layer, Window } from "../widget.ts"

const readFlavor = () => {
  try {
    const [ok, bytes] = GLib.file_get_contents(`${GLib.get_user_config_dir()}/cyberkali/flavor`)
    return ok ? new TextDecoder().decode(bytes).trim() : "red"
  } catch { return "red" }
}

export const CrtOverlayWindow = () => {
  const area = DrawingArea({})
  area.set_size_request(4096, 2160)

  area.connect("draw", (widget: any, ctx: any) => {
    if (readFlavor() !== "amber") return false
    const w = Math.max(1, widget.get_allocated_width?.() || 4096)
    const h = Math.max(1, widget.get_allocated_height?.() || 2160)
    const phase = (Date.now() / 1000) % 1

    for (let y = 0; y < h; y += 4) {
      ctx.setSourceRGBA(0, 0, 0, 0.085)
      ctx.rectangle(0, y, w, 1)
      ctx.fill()
    }

    const sweepY = Math.floor(phase * h)
    ctx.setSourceRGBA(1, 0.69, 0, 0.025)
    ctx.rectangle(0, sweepY, w, 16)
    ctx.fill()

    // Slight deterministic phosphor luminance variation, deliberately subtle.
    const flicker = 0.008 + Math.abs(Math.sin(Date.now() / 137)) * 0.008
    ctx.setSourceRGBA(1, 0.55, 0, flicker)
    ctx.paint()
    return false
  })

  interval(100, () => area.queue_draw())

  return Window({
    name: "cyberkali-crt-overlay",
    className: "cyberkali-crt-overlay",
    anchor: Anchor.TOP | Anchor.BOTTOM | Anchor.LEFT | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    clickThrough: true,
    child: area,
  })
}
