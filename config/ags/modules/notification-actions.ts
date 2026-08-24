import { Anchor, Box, Button, Exclusivity, Label, Layer, Window } from "../widget.ts"

let win: any = null
let title: any = null
let actionsBox: any = null
let current: any = null

const listActions = (notification: any) => {
  const out: any[] = []
  try {
    const actions = notification?.actions
    if (!actions) return out
    const len = Number(actions.length?.() ?? 0)
    for (let i = 0; i < len; i++) {
      const action = actions.nth_data?.(i)
      if (action) out.push(action)
    }
  } catch (error) {
    print(`[cyberkali] notification action enumeration failed: ${error}`)
  }
  return out
}

const render = () => {
  if (!actionsBox || !title) return
  const actions = listActions(current)
  title.label = current ? String(current.summary || current.app_name || "NOTIFICATION").toUpperCase() : "NO ACTIONABLE NOTIFICATION"
  actionsBox.children = actions.length
    ? actions.map((action: any) => {
        const button = Button({ className: "notification-action-button", label: String(action.label || action.id || "ACTION").toUpperCase() })
        button.connect("clicked", () => {
          try { action.invoke() } catch (error) { print(`[cyberkali] notification action failed: ${error}`) }
          hideNotificationActions()
        })
        return button
      })
    : [Label({ className: "notification-action-empty", label: "NO APP-PROVIDED ACTIONS" })]
}

export const NotificationActionsWindow = () => {
  title = Label({ className: "notification-action-title", label: "NO ACTIONABLE NOTIFICATION", xalign: 0 })
  actionsBox = Box({ className: "notification-action-buttons", spacing: 6 })
  win = Window({
    name: "cyberkali-notification-actions",
    className: "cyberkali-notification-actions",
    anchor: Anchor.TOP | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    child: Box({
      className: "notification-action-frame cyber-panel",
      vertical: true,
      spacing: 8,
      children: [
        Label({ className: "notification-action-kicker", label: "FREEDESKTOP // APP ACTIONS", xalign: 0 }),
        title,
        actionsBox,
        Button({ className: "notification-action-close", label: "CLOSE", onClicked: () => hideNotificationActions() }),
      ],
    }),
  })
  return win
}

export const setActionableNotification = (notification: any) => {
  current = notification
  render()
}

export const showNotificationActions = () => { if (win) { render(); win.visible = true; try { win.present() } catch {} } }
export const hideNotificationActions = () => { if (win) win.visible = false }
export const toggleNotificationActions = () => win?.visible ? hideNotificationActions() : showNotificationActions()
