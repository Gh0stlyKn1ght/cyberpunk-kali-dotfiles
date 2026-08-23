import { Anchor, Box, Button, Exclusivity, Label, Layer, Window } from "../widget.ts"

export type Notice = { id: number; title: string; body: string; created: number }
const notices: Notice[] = []
let seq = 0
let win: any = null
let list: any = null

const fmtTime = (t: number) => {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const row = (n: Notice) => Box({
  className: "notif-center-row",
  vertical: true,
  spacing: 2,
  children: [
    Box({ spacing: 8, children: [
      Label({ className: "notif-center-title", label: n.title.toUpperCase(), xalign: 0 }),
      Label({ className: "notif-center-time", label: fmtTime(n.created), xalign: 1 }),
    ] }),
    Label({ className: "notif-center-body", label: n.body, xalign: 0, wrap: true }),
  ],
})

const render = () => {
  if (!list) return
  list.children = notices.length
    ? notices.slice(0, 20).map(row)
    : [Label({ className: "notif-center-empty", label: "NO STORED MESSAGES" })]
}

export const pushNotice = (title: string, body: string) => {
  notices.unshift({ id: ++seq, title: title || "SYSTEM MESSAGE", body: body || "", created: Date.now() })
  while (notices.length > 50) notices.pop()
  render()
}

export const clearNotices = () => { notices.splice(0); render() }

export const NotificationCenterWindow = () => {
  const clear = Button({ className: "cyber-button", label: "CLEAR LOG" })
  clear.connect("clicked", clearNotices)
  list = Box({ className: "notif-center-list", vertical: true, spacing: 6 })
  render()

  win = Window({
    name: "cyberkali-notification-center",
    className: "cyberkali-notification-center",
    anchor: Anchor.TOP | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    child: Box({
      className: "notif-center-frame cyber-panel",
      vertical: true,
      spacing: 10,
      children: [
        Label({ className: "notif-center-kicker", label: "MESSAGES // EVENT BUFFER", xalign: 0 }),
        Box({ spacing: 8, children: [
          Label({ className: "notif-center-heading", label: "NOTIFICATION CENTER", xalign: 0 }),
          clear,
        ] }),
        list,
      ],
    }),
  })
  return win
}

export const showNotificationCenter = () => { if (win) { win.visible = true; try { win.present() } catch {} } }
export const hideNotificationCenter = () => { if (win) win.visible = false }
export const toggleNotificationCenter = () => win?.visible ? hideNotificationCenter() : showNotificationCenter()
