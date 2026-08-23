import GLib from "gi://GLib"
import { interval } from "astal"
import { Anchor, DrawingArea, Exclusivity, Layer, Window } from "../widget.ts"
import { cpu, ram, disk, iface, ip, vpn, workspace } from "./system.ts"

const clamp = (n: number) => Math.max(0, Math.min(1, n))

const palette = () => {
  const path = `${GLib.get_user_config_dir()}/cyberkali/flavor`
  let flavor = "red"
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    if (ok) flavor = new TextDecoder().decode(bytes).trim()
  } catch {}

  if (flavor === "cyan") return { a: [0.38, 0.95, 1], b: [0.76, 1, 1], warn: [1, 0.82, 0.2], bg: [0.02, 0.08, 0.1] }
  if (flavor === "amber") return { a: [1, 0.69, 0], b: [1, 0.83, 0.28], warn: [1, 0.36, 0.08], bg: [0.08, 0.045, 0.005] }
  return { a: [1, 0.18, 0.24], b: [0.46, 0.89, 0.95], warn: [1, 0.84, 0.12], bg: [0.05, 0.025, 0.035] }
}

const skew = (x: number, y: number) => [x + y * 0.11, y - x * 0.012]

const line = (ctx: any, pts: number[][], rgb: number[], alpha = 1, width = 1.4) => {
  ctx.newPath()
  pts.forEach(([x, y], i) => {
    const [px, py] = skew(x, y)
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  })
  ctx.setSourceRGBA(rgb[0], rgb[1], rgb[2], alpha)
  ctx.setLineWidth(width)
  ctx.stroke()
}

const text = (ctx: any, x: number, y: number, value: string, size: number, rgb: number[], alpha = 1) => {
  const [px, py] = skew(x, y)
  ctx.selectFontFace("JetBrains Mono", 0, 1)
  ctx.setFontSize(size)
  ctx.setSourceRGBA(rgb[0], rgb[1], rgb[2], alpha)
  ctx.moveTo(px, py)
  ctx.showText(value)
}

const bar = (ctx: any, x: number, y: number, w: number, h: number, frac: number, rgb: number[]) => {
  const f = clamp(frac)
  line(ctx, [[x, y], [x + w, y], [x + w + 8, y + h], [x + 8, y + h], [x, y]], rgb, 0.34, 1)
  ctx.newPath()
  const [a1, b1] = skew(x + 2, y + 2)
  const [a2, b2] = skew(x + Math.max(5, (w - 4) * f), y + 2)
  const [a3, b3] = skew(x + Math.max(5, (w - 4) * f) + 5, y + h - 2)
  const [a4, b4] = skew(x + 7, y + h - 2)
  ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.lineTo(a3, b3); ctx.lineTo(a4, b4); ctx.closePath()
  ctx.setSourceRGBA(rgb[0], rgb[1], rgb[2], 0.78)
  ctx.fill()
}

export const ProjectedHudWindow = () => {
  const area = DrawingArea({})
  area.set_size_request(720, 210)

  area.connect("draw", (_w: any, ctx: any) => {
    const p = palette()
    ctx.setSourceRGBA(p.bg[0], p.bg[1], p.bg[2], 0.78)
    ctx.rectangle(0, 0, 720, 210)
    ctx.fill()

    for (let y = 18; y < 205; y += 8) line(ctx, [[0, y], [710, y]], p.a, 0.035, 0.6)

    line(ctx, [[18, 18], [690, 18], [705, 34]], p.a, 0.95, 2)
    line(ctx, [[18, 192], [675, 192], [705, 162]], p.a, 0.5, 1.2)
    text(ctx, 30, 43, "CYBERKALI // TACTICAL SYSTEM HUD", 13, p.b)
    text(ctx, 30, 64, `WORKSPACE ${String(workspace.get()).padStart(2, "0")}`, 24, p.a)

    text(ctx, 30, 94, "CPU", 10, p.b, 0.8)
    bar(ctx, 84, 82, 230, 14, cpu.get(), p.a)
    text(ctx, 328, 95, `${Math.round(cpu.get() * 100)}%`, 11, p.b)

    text(ctx, 30, 120, "RAM", 10, p.b, 0.8)
    bar(ctx, 84, 108, 230, 14, ram.get(), p.a)
    text(ctx, 328, 121, `${Math.round(ram.get() * 100)}%`, 11, p.b)

    text(ctx, 30, 146, "DISK", 10, p.b, 0.8)
    bar(ctx, 84, 134, 230, 14, disk.get(), p.a)
    text(ctx, 328, 147, `${Math.round(disk.get() * 100)}%`, 11, p.b)

    line(ctx, [[392, 68], [392, 166]], p.a, 0.35, 1)
    text(ctx, 418, 89, "NETWORK LINK", 10, p.b, 0.72)
    text(ctx, 418, 110, `IFACE  ${iface.get().toUpperCase()}`, 11, p.a)
    text(ctx, 418, 131, `IP     ${ip.get()}`, 11, p.a)
    const v = vpn.get()
    text(ctx, 418, 152, `VPN    ${v === "OFFLINE" ? "OFFLINE" : v.toUpperCase()}`, 11, v === "OFFLINE" ? p.warn : p.b)

    return false
  })

  interval(500, () => area.queue_draw())

  return Window({
    name: "cyberkali-projected-hud",
    className: "cyberkali-projected-hud",
    anchor: Anchor.TOP | Anchor.LEFT,
    layer: Layer.TOP,
    exclusivity: Exclusivity.IGNORE,
    marginTop: 18,
    marginLeft: 18,
    child: area,
  })
}
