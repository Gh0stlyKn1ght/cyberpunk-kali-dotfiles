import GLib from "gi://GLib"
import { execAsync, interval } from "astal"
import { Anchor, Box, Exclusivity, Label, Layer, Window } from "../widget.ts"
import { iface } from "./system.ts"

const read = (path: string) => {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? new TextDecoder().decode(bytes).trim() : ""
  } catch { return "" }
}

const sh = async (cmd: string) => {
  try { return (await execAsync(["sh", "-lc", cmd])).trim() } catch { return "" }
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

const bytesFor = (name: string) => {
  const line = read("/proc/net/dev").split("\n").find(x => x.trim().startsWith(name + ":"))
  if (!line) return [0, 0]
  const p = line.split(":")[1].trim().split(/\s+/).map(Number)
  return [p[0] || 0, p[8] || 0]
}
const fmtRate = (n: number) => n > 1048576 ? `${(n / 1048576).toFixed(1)}MB/s` : `${(n / 1024).toFixed(1)}KB/s`

export const SystemSidePanel = () => {
  const kernel = Label({ className: "side-value", label: GLib.get_os_info("PRETTY_NAME") || "KALI LINUX", xalign: 0 })
  const uptime = Label({ className: "side-value", label: "UPTIME --", xalign: 0 })
  const load = Label({ className: "side-value", label: "LOAD --", xalign: 0 })
  const battery = Label({ className: "side-value", label: bat ? "BATTERY --" : "BATTERY N/A", xalign: 0 })
  const profile = Label({ className: "side-value", label: "PROFILE --", xalign: 0 })
  const traffic = Label({ className: "side-value", label: "TRAFFIC --", xalign: 0 })
  const media = Label({ className: "side-value", label: "MEDIA --", xalign: 0 })

  let currentIface = iface.get()
  let [prevRx, prevTx] = bytesFor(currentIface)
  let prevTime = GLib.get_monotonic_time()

  interval(2000, async () => {
    uptime.label = `UPTIME ${uptimeText()}`
    load.label = `LOAD ${read("/proc/loadavg").split(" ").slice(0, 3).join(" / ") || "--"}`
    if (bat) {
      const cap = read(`${bat}/capacity`) || "--"
      const state = read(`${bat}/status`) || "UNKNOWN"
      battery.label = `BATTERY ${cap}% // ${state.toUpperCase()}`
    }

    const nextIface = iface.get()
    if (nextIface !== currentIface) {
      currentIface = nextIface
      ;[prevRx, prevTx] = bytesFor(currentIface)
      prevTime = GLib.get_monotonic_time()
    }
    const now = GLib.get_monotonic_time()
    const dt = Math.max(0.1, (now - prevTime) / 1e6)
    const [rx, tx] = bytesFor(currentIface)
    traffic.label = `TRAFFIC ${currentIface.toUpperCase()} // ↓ ${fmtRate(Math.max(0, (rx - prevRx) / dt))} ↑ ${fmtRate(Math.max(0, (tx - prevTx) / dt))}`
    prevRx = rx; prevTx = tx; prevTime = now

    const [pp, track] = await Promise.all([
      sh("powerprofilesctl get 2>/dev/null || echo unavailable"),
      sh("playerctl metadata --format '{{artist}} // {{title}}' 2>/dev/null | head -c 70"),
    ])
    profile.label = `PROFILE ${(pp || "N/A").toUpperCase()}`
    media.label = track ? `MEDIA ${track}` : "MEDIA IDLE"
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
        kernel, uptime, load, battery, profile, traffic, media,
      ],
    }),
  })
}
