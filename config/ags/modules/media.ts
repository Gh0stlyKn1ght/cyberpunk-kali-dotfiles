import { Anchor, Box, Button, Exclusivity, Label, Layer, Window } from "../widget.ts"
import { execAsync, interval } from "astal"

let win: any = null
let titleLabel: any = null
let artistLabel: any = null
let statusLabel: any = null

const run = async (args: string[]) => {
  try { return (await execAsync(args)).trim() } catch { return "" }
}

const refresh = async () => {
  if (!win?.visible) return
  const [title, artist, status] = await Promise.all([
    run(["playerctl", "metadata", "--format", "{{title}}"]),
    run(["playerctl", "metadata", "--format", "{{artist}}"]),
    run(["playerctl", "status"]),
  ])
  titleLabel?.set_label?.((title || "NO ACTIVE MEDIA").toUpperCase())
  artistLabel?.set_label?.(artist || "PLAYERCTL // IDLE")
  statusLabel?.set_label?.((status || "STOPPED").toUpperCase())
}

const control = (label: string, action: string) => {
  const button = Button({ className: "media-control", label })
  button.connect("clicked", () => {
    execAsync(["playerctl", action]).then(refresh).catch(() => {})
  })
  return button
}

export const MediaWindow = () => {
  titleLabel = Label({ className: "media-title", label: "NO ACTIVE MEDIA", xalign: 0 })
  artistLabel = Label({ className: "media-artist", label: "PLAYERCTL // IDLE", xalign: 0 })
  statusLabel = Label({ className: "media-status", label: "STOPPED", xalign: 0 })

  win = Window({
    name: "cyberkali-media",
    className: "cyberkali-media",
    anchor: Anchor.BOTTOM | Anchor.LEFT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    child: Box({
      className: "media-frame",
      vertical: true,
      spacing: 5,
      children: [
        Label({ className: "media-kicker", label: "RADIOPORT // MEDIA LINK", xalign: 0 }),
        titleLabel,
        artistLabel,
        statusLabel,
        Box({
          className: "media-controls",
          spacing: 6,
          children: [
            control("◀◀ PREV", "previous"),
            control("▶/Ⅱ", "play-pause"),
            control("NEXT ▶▶", "next"),
          ],
        }),
      ],
    }),
  })

  interval(2000, refresh)
  return win
}

export const showMedia = () => {
  if (!win) return
  win.visible = true
  refresh()
  try { win.present() } catch {}
}

export const hideMedia = () => { if (win) win.visible = false }
export const toggleMedia = () => win?.visible ? hideMedia() : showMedia()
