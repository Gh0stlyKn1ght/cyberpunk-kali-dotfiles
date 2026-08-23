import GLib from "gi://GLib"
import { interval } from "astal"
import { Anchor, Box, Exclusivity, Label, Layer, Window } from "../widget.ts"

const read = (path: string) => {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? new TextDecoder().decode(bytes).trim() : ""
  } catch { return "" }
}

const batteryPath = () => {
  try {
    const dir = GLib.Dir.open("/sys/class/power_supply", 0)
    let name: string | null
    while ((name = dir.read_name())) {
      const base = `/sys/class/power_supply/${name}`
      if (read(`${base}/type`) === "Battery") return base
    }
  } catch {}
  return null
}

const bat = batteryPath()
const uptimeText = () => {
  const seconds = Math.floor(parseFloat(read("/proc/uptime").split(" ")[0]) || 0)
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${days}D ${String(hours).padStart(2, "0")}H ${String(mins).padStart(2, "0")}M`
}

export const SystemSidePanel = () => {
  const kernel = Label({ className: "side-value", label: GLib.get_os_info("PRETTY_NAME") || "KALI LINUX", xalign: 0 })
  const uptime = Label({ className: "side-value", label: "UPTIME --", xalign: 0 })
  const load = Label({ className: "side-value", label: "LOAD --", xalign: 0 })
  const battery = Label({ className: "side-value", label: bat ? "BATTERY --" : "BATTERY N/A", xalign: 0 })

  interval(5000, () => {
    uptime.label = `UPTIME ${uptimeText()}`
    load.label = `LOAD ${read("/proc/loadavg").split(" ").slice(0, 3).join(" / ") || "--"}`
    if (bat) {
      const cap = read(`${bat}/capacity`) || "--"
      const state = read(`${bat}/status`) || "UNKNOWN"
      battery.label = `BATTERY ${cap}% // ${state.toUpperCase()}`
    }
  })

  return Window({
    name: "cyberkali-host-sidepanel",
    className: "cyberkali-host-sidepanel",
    anchor: Anchor.LEFT,
    layer: Layer.BOTTOM,
    exclusivity: Exclusivity.IGNORE,
    marginLeft: 28,
    child: Box({
      className: "side-frame",
      vertical: true,
      spacing: 4,
      children: [
        Label({ className: "side-kicker", label: "HOST TELEMETRY // LOCAL", xalign: 0 }),
        kernel,
        uptime,
        load,
        battery,
      ],
    }),
  })
}
