import { timeout } from "astal"
import { Anchor, Box, Exclusivity, Label, Layer, Window } from "../widget.ts"

let win: any = null
let title: any = null
let body: any = null
const history: { title: string; body: string; time: number }[] = []
let hideTimer: any = null

const safe = (s: string, max = 140) => String(s || "").replace(/[\r\n]+/g, " ").slice(0, max)

export const NotificationWindow = () => {
  title = Label({ className: "notification-title", label: "SYSTEM MESSAGE", xalign: 0 })
  body = Label({ className: "notification-body", label: "", xalign: 0, wrap: true })
  win = Window({
    name: "cyberkali-notification",
    className: "cyberkali-notification",
    anchor: Anchor.TOP | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    marginTop: 24,
    marginRight: 24,
    child: Box({
      className: "notification-frame cyber-panel",
      vertical: true,
      spacing: 5,
      children: [
        Label({ className: "notification-kicker", label: "NETWATCH // MESSAGE RECEIVED", xalign: 0 }),
        title,
        body,
      ],
    }),
  })
  return win
}

export const showNotification = (rawTitle: string, rawBody: string) => {
  if (!win) return
  const t = safe(rawTitle || "SYSTEM MESSAGE", 72)
  const b = safe(rawBody || "", 180)
  history.unshift({ title: t, body: b, time: Date.now() })
  if (history.length > 25) history.length = 25
  title.label = t.toUpperCase()
  body.label = b
  win.visible = true
  try { win.present() } catch {}
  try { hideTimer?.cancel?.() } catch {}
  hideTimer = timeout(5200, () => { if (win) win.visible = false })
}

export const notificationHistory = () => history.slice()
export const hideNotification = () => { if (win) win.visible = false }
