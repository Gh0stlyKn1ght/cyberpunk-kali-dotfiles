import AstalNotifd from "gi://AstalNotifd"
import { pushNotice } from "./notification-center.ts"
import { showNotification } from "./notifications.ts"
import { setActionableNotification } from "./notification-actions.ts"

let wired = false
let daemonRef: any = null

const stripMarkup = (value: string) => String(value || "")
  .replace(/<br\s*\/?\s*>/gi, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .trim()

export const notificationDnd = () => {
  try { return !!(daemonRef || AstalNotifd.get_default()).dont_disturb } catch { return false }
}

export const toggleNotificationDnd = () => {
  try {
    const daemon = daemonRef || AstalNotifd.get_default()
    daemon.dont_disturb = !daemon.dont_disturb
    return daemon.dont_disturb ? "DND ON" : "DND OFF"
  } catch (error) {
    print(`[cyberkali] DND toggle failed: ${error}`)
    return "DND UNAVAILABLE"
  }
}

export const startDesktopNotificationBridge = () => {
  if (wired) return
  wired = true

  try {
    const daemon = AstalNotifd.get_default()
    daemonRef = daemon
    daemon.connect("notified", (_self: any, id: number) => {
      try {
        const notification = daemon.get_notification(id)
        if (!notification) return
        const app = String(notification.app_name || "SYSTEM").trim()
        const summary = stripMarkup(notification.summary || "NOTIFICATION")
        const body = stripMarkup(notification.body || "")
        const title = app && app.toUpperCase() !== summary.toUpperCase() ? `${app} // ${summary}` : summary
        pushNotice(title, body)
        setActionableNotification(notification)
        if (!daemon.dont_disturb) showNotification(title, body)
      } catch (error) {
        print(`[cyberkali] notification ingest failed: ${error}`)
      }
    })
    print("[cyberkali] freedesktop notification bridge active")
  } catch (error) {
    print(`[cyberkali] AstalNotifd unavailable: ${error}`)
  }
}
