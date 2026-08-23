import AstalNotifd from "gi://AstalNotifd"
import { pushNotice } from "./notification-center.ts"
import { showNotification } from "./notifications.ts"

let wired = false

const stripMarkup = (value: string) => String(value || "")
  .replace(/<br\s*\/?\s*>/gi, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .trim()

export const startDesktopNotificationBridge = () => {
  if (wired) return
  wired = true

  try {
    const daemon = AstalNotifd.get_default()
    daemon.connect("notified", (_self: any, id: number) => {
      try {
        const notification = daemon.get_notification(id)
        if (!notification) return
        const app = String(notification.app_name || "SYSTEM").trim()
        const summary = stripMarkup(notification.summary || "NOTIFICATION")
        const body = stripMarkup(notification.body || "")
        const title = app && app.toUpperCase() !== summary.toUpperCase() ? `${app} // ${summary}` : summary
        pushNotice(title, body)
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
