import GLib from "gi://GLib"
import { interval } from "astal"
import { Anchor, Box, Exclusivity, Label, Layer, Window } from "../widget.ts"
import { iface, ip, vpn } from "./system.ts"

const flavor = () => {
  try {
    const [ok, bytes] = GLib.file_get_contents(`${GLib.get_user_config_dir()}/cyberkali/flavor`)
    return ok ? new TextDecoder().decode(bytes).trim() : "red"
  } catch { return "red" }
}

const clockText = () => GLib.DateTime.new_now_local().format("%H:%M:%S") || "--:--:--"
const dateText = () => GLib.DateTime.new_now_local().format("%Y.%m.%d") || "----.--.--"

export const CornerWidgets = () => {
  const time = Label({ className: "corner-time", label: clockText(), xalign: 1 })
  const date = Label({ className: "corner-date", label: dateText(), xalign: 1 })
  const net = Label({ className: "corner-net", label: "NET // INIT", xalign: 1 })
  const mode = Label({ className: "corner-mode", label: "RED MODE", xalign: 1 })

  interval(1000, () => {
    time.label = clockText()
    date.label = dateText()
    const v = vpn.get()
    net.label = `${iface.get().toUpperCase()} // ${ip.get()} // ${v === "OFFLINE" ? "VPN OFF" : `VPN ${v.toUpperCase()}`}`
    mode.label = `${flavor().toUpperCase()} MODE`
  })

  return Window({
    name: "cyberkali-corner-status",
    className: "cyberkali-corner-status",
    anchor: Anchor.BOTTOM | Anchor.RIGHT,
    layer: Layer.BOTTOM,
    exclusivity: Exclusivity.IGNORE,
    marginBottom: 26,
    marginRight: 28,
    child: Box({
      className: "corner-frame",
      vertical: true,
      children: [mode, time, date, net],
    }),
  })
}
