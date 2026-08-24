import Gio from "gi://Gio"
import Gtk from "gi://Gtk?version=3.0"
import { Anchor, Box, Button, Entry, Exclusivity, Keymode, Label, Layer, Window } from "../widget.ts"
import { metadataFor, recordLaunch, sortApps } from "./kali-tools.ts"

let launcherWindow: any = null

const allApps = () => Gio.AppInfo.get_all()
  .filter((app: any) => app.should_show?.() !== false)

const searchableText = (app: any) => {
  const meta = metadataFor(app)
  return [
    app.get_name?.(), app.get_description?.(), app.get_executable?.(), app.get_id?.(),
    meta.category, meta.packageName, meta.packageVersion, meta.path,
  ].filter(Boolean).join(" ").toLowerCase()
}

const matches = (app: any, query: string) => !query || searchableText(app).includes(query.toLowerCase())

const launch = (app: any) => {
  try {
    recordLaunch(app)
    app.launch([], null)
    hideLauncher()
  } catch (error) {
    print(`[cyberkali] launch failed: ${error}`)
  }
}

const appRow = (app: any) => {
  const name = String(app.get_name?.() || app.get_executable?.() || "UNKNOWN").toUpperCase()
  const meta = metadataFor(app)
  const status = meta.favorite ? "★ FAVORITE" : meta.recentRank >= 0 ? `RECENT ${meta.recentRank + 1}` : "READY"
  const pkg = meta.packageName
    ? `${meta.packageName}${meta.packageVersion ? ` // ${meta.packageVersion}` : ""}`
    : "PACKAGE UNKNOWN"
  const path = meta.path || meta.executable || "NO EXECUTABLE PATH"

  const row = Button({
    className: "kiroshi-app-row",
    child: Box({
      spacing: 12,
      children: [
        Box({
          className: "kiroshi-category-block",
          vertical: true,
          children: [
            Label({ className: "kiroshi-category", label: meta.category, xalign: 0 }),
            Label({ className: "kiroshi-status", label: status, xalign: 0 }),
          ],
        }),
        Box({
          className: "kiroshi-app-copy",
          vertical: true,
          children: [
            Label({ className: "kiroshi-app-name", label: name, xalign: 0 }),
            Label({ className: "kiroshi-app-command", label: path, xalign: 0 }),
            Label({ className: "kiroshi-package", label: pkg, xalign: 0 }),
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
  const search = Entry({ className: "kiroshi-search", placeholderText: "SEARCH TOOL / PACKAGE / KALI CATEGORY..." })

  const render = () => {
    const query = search.text?.trim?.() || ""
    const apps = sortApps(allApps().filter((app: any) => matches(app, query))).slice(0, 12)
    results.children = apps.length
      ? apps.map(appRow)
      : [Label({ className: "kiroshi-empty", label: "NO MATCHING SOFTWARE SIGNATURES" })]
  }

  search.connect("changed", render)
  search.connect("activate", () => {
    const query = search.text?.trim?.() || ""
    const first = sortApps(allApps().filter((app: any) => matches(app, query)))[0]
    if (first) launch(first)
  })

  const header = Box({
    className: "kiroshi-header",
    vertical: true,
    children: [
      Label({ className: "kiroshi-eyebrow", label: "KIROSHI OPTICS // KALI SOFTWARE INTELLIGENCE", xalign: 0 }),
      Label({ className: "kiroshi-title", label: "APPLICATION QUICKHACKS", xalign: 0 }),
      Label({ className: "kiroshi-subtitle", label: "FAVORITES → RECENT → KALI CATEGORY // LOCAL METADATA ONLY", xalign: 0 }),
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
      children: [Box({
        className: "kiroshi-frame cyber-panel",
        vertical: true,
        spacing: 10,
        children: [header, search, results, Label({ className: "kiroshi-footer", label: "ESC CLOSE // SEARCH NAME, BINARY, PACKAGE, CATEGORY", xalign: 0 })],
      })],
    }),
  })

  launcherWindow.connect("key-press-event", (_w: any, event: any) => {
    const key = event.get_keyval?.()[1]
    if (key === 65307) { hideLauncher(); return true }
    return false
  })

  render()
  return launcherWindow
}

export const showLauncher = () => { if (launcherWindow) { launcherWindow.visible = true; try { launcherWindow.present() } catch {} } }
export const hideLauncher = () => { if (launcherWindow) launcherWindow.visible = false }
export const toggleLauncher = () => { if (launcherWindow) launcherWindow.visible ? hideLauncher() : showLauncher() }
