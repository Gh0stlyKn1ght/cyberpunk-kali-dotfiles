import Gio from "gi://Gio"
import Gtk from "gi://Gtk?version=3.0"
import { Anchor, Box, Button, Entry, Exclusivity, Keymode, Label, Layer, Window } from "../widget.ts"

let launcherWindow: any = null

const categoryFor = (app: any) => {
  const haystack = [
    app.get_name?.(),
    app.get_description?.(),
    app.get_executable?.(),
    app.get_id?.(),
  ].filter(Boolean).join(" ").toLowerCase()

  if (/nmap|masscan|recon|osint|whois|dns|amass|theharvester/.test(haystack)) return "RECON"
  if (/burp|zap|sqlmap|nikto|web|http|ffuf|gobuster/.test(haystack)) return "WEB"
  if (/wireshark|tcpdump|ettercap|bettercap|sniff|spoof/.test(haystack)) return "NETWORK"
  if (/john|hashcat|hydra|password|crack/.test(haystack)) return "CREDENTIAL"
  if (/metasploit|exploit|armitage|payload/.test(haystack)) return "EXPLOIT"
  if (/ghidra|radare|cutter|reverse|binary/.test(haystack)) return "REVERSE"
  if (/autopsy|forensic|volatility|sleuth/.test(haystack)) return "FORENSICS"
  if (/aircrack|wifite|wireless|802\.11|kismet/.test(haystack)) return "WIRELESS"
  return "SYSTEM"
}

const allApps = () => Gio.AppInfo.get_all()
  .filter((app: any) => app.should_show?.() !== false)
  .sort((a: any, b: any) => String(a.get_name?.() || "").localeCompare(String(b.get_name?.() || "")))

const matches = (app: any, query: string) => {
  if (!query) return true
  const text = [
    app.get_name?.(), app.get_description?.(), app.get_executable?.(), app.get_id?.(), categoryFor(app),
  ].filter(Boolean).join(" ").toLowerCase()
  return text.includes(query.toLowerCase())
}

const launch = (app: any) => {
  try {
    app.launch([], null)
    hideLauncher()
  } catch (error) {
    print(`[cyberkali] launch failed: ${error}`)
  }
}

const appRow = (app: any) => {
  const name = String(app.get_name?.() || app.get_executable?.() || "UNKNOWN").toUpperCase()
  const executable = String(app.get_executable?.() || "")
  const category = categoryFor(app)
  const row = Button({
    className: "kiroshi-app-row",
    child: Box({
      spacing: 12,
      children: [
        Label({ className: "kiroshi-category", label: category, xalign: 0 }),
        Box({
          className: "kiroshi-app-copy",
          vertical: true,
          children: [
            Label({ className: "kiroshi-app-name", label: name, xalign: 0 }),
            Label({ className: "kiroshi-app-command", label: executable, xalign: 0 }),
          ],
        }),
        Label({ className: "kiroshi-run", label: "EXECUTE  ›" }),
      ],
    }),
  })
  row.connect("clicked", () => launch(app))
  return row
}

export const LauncherWindow = () => {
  const results = Box({ className: "kiroshi-results", vertical: true, spacing: 2 })
  const search = Entry({
    className: "kiroshi-search",
    placeholderText: "SCAN APPLICATION DATABASE...",
  })

  const render = () => {
    const query = search.text?.trim?.() || ""
    const apps = allApps().filter((app: any) => matches(app, query)).slice(0, 12)
    results.children = apps.length
      ? apps.map(appRow)
      : [Label({ className: "kiroshi-empty", label: "NO MATCHING SOFTWARE SIGNATURES" })]
  }

  search.connect("changed", render)
  search.connect("activate", () => {
    const query = search.text?.trim?.() || ""
    const first = allApps().find((app: any) => matches(app, query))
    if (first) launch(first)
  })

  const header = Box({
    className: "kiroshi-header",
    vertical: true,
    children: [
      Label({ className: "kiroshi-eyebrow", label: "KIROSHI OPTICS // CYBERKALI", xalign: 0 }),
      Label({ className: "kiroshi-title", label: "APPLICATION QUICKHACKS", xalign: 0 }),
      Label({ className: "kiroshi-subtitle", label: "LOCAL SOFTWARE INDEX // ENTER TO EXECUTE", xalign: 0 }),
    ],
  })

  launcherWindow = Window({
    name: "cyberkali-launcher",
    className: "cyberkali-launcher",
    anchor: Anchor.TOP | Anchor.BOTTOM | Anchor.LEFT | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    keymode: Keymode.ON_DEMAND,
    visible: false,
    child: Box({
      className: "kiroshi-overlay",
      vertical: true,
      valign: Gtk.Align.CENTER,
      halign: Gtk.Align.CENTER,
      children: [
        Box({
          className: "kiroshi-frame cyber-panel",
          vertical: true,
          spacing: 10,
          children: [header, search, results, Label({ className: "kiroshi-footer", label: "ESC CLOSE // SUPER+SPACE TOGGLE", xalign: 0 })],
        }),
      ],
    }),
  })

  launcherWindow.connect("key-press-event", (_w: any, event: any) => {
    const key = event.get_keyval?.()[1]
    if (key === 65307) {
      hideLauncher()
      return true
    }
    return false
  })

  render()
  return launcherWindow
}

export const showLauncher = () => {
  if (!launcherWindow) return
  launcherWindow.visible = true
  try { launcherWindow.present() } catch {}
}

export const hideLauncher = () => {
  if (!launcherWindow) return
  launcherWindow.visible = false
}

export const toggleLauncher = () => {
  if (!launcherWindow) return
  launcherWindow.visible ? hideLauncher() : showLauncher()
}
