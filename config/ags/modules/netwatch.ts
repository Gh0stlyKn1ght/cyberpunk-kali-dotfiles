import { Anchor, Box, Exclusivity, Label, Layer, Window } from "../widget.ts"
import { execAsync, interval } from "astal"

let win: any = null
let ifaceLabel: any = null
let ipLabel: any = null
let routeLabel: any = null
let dnsLabel: any = null
let vpnLabel: any = null
let wifiLabel: any = null
let updating = false

const line = (name: string, value: any, valueClass = "netwatch-value") => Box({
  className: "netwatch-row",
  children: [
    Label({ className: "netwatch-key", label: name, xalign: 0 }),
    value,
  ],
})

const set = (label: any, value: string) => label?.set_label?.(value || "—")

const shell = async (command: string) => {
  try { return (await execAsync(["sh", "-c", command])).trim() } catch { return "" }
}

export const refreshNetwatch = async () => {
  if (updating) return
  updating = true
  try {
    const [iface, ip, route, dns, vpn, wifi] = await Promise.all([
      shell("ip route show default 2>/dev/null | awk 'NR==1 {print $5}'"),
      shell("ip -4 route get 1.1.1.1 2>/dev/null | awk 'NR==1 {for(i=1;i<=NF;i++) if($i==\"src\") print $(i+1)}'"),
      shell("ip route show default 2>/dev/null | awk 'NR==1 {print $3}'"),
      shell("resolvectl dns 2>/dev/null | awk 'NR==1 {$1=$2=\"\"; sub(/^  */,\"\"); print}' || awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf"),
      shell("ip -brief link 2>/dev/null | awk '$1 ~ /^(tun|tap|wg)[0-9]*/ && $2==\"UP\" {print $1; exit}'"),
      shell("nmcli -t -f active,ssid dev wifi 2>/dev/null | awk -F: '$1==\"yes\" {sub(/^yes:/,\"\"); print; exit}'"),
    ])

    set(ifaceLabel, iface.toUpperCase() || "OFFLINE")
    set(ipLabel, ip || "NO IPV4")
    set(routeLabel, route || "NO DEFAULT ROUTE")
    set(dnsLabel, dns || "UNRESOLVED")
    set(vpnLabel, vpn ? `${vpn.toUpperCase()} // ONLINE` : "OFFLINE")
    set(wifiLabel, wifi || "WIRED / UNKNOWN")
    vpnLabel?.get_style_context?.().remove_class("netwatch-offline")
    vpnLabel?.get_style_context?.().remove_class("netwatch-online")
    vpnLabel?.get_style_context?.().add_class(vpn ? "netwatch-online" : "netwatch-offline")
  } finally {
    updating = false
  }
}

export const NetwatchWindow = () => {
  ifaceLabel = Label({ className: "netwatch-value", label: "SCANNING...", xalign: 0 })
  ipLabel = Label({ className: "netwatch-value", label: "SCANNING...", xalign: 0 })
  routeLabel = Label({ className: "netwatch-value", label: "SCANNING...", xalign: 0 })
  dnsLabel = Label({ className: "netwatch-value", label: "SCANNING...", xalign: 0 })
  vpnLabel = Label({ className: "netwatch-value netwatch-offline", label: "OFFLINE", xalign: 0 })
  wifiLabel = Label({ className: "netwatch-value", label: "SCANNING...", xalign: 0 })

  win = Window({
    name: "cyberkali-netwatch",
    className: "cyberkali-netwatch",
    anchor: Anchor.TOP | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    child: Box({
      className: "netwatch-frame",
      vertical: true,
      spacing: 5,
      children: [
        Label({ className: "netwatch-kicker", label: "NETWATCH // LOCAL LINK", xalign: 0 }),
        Label({ className: "netwatch-title", label: "NETWORK INTELLIGENCE", xalign: 0 }),
        line("IFACE", ifaceLabel),
        line("IPV4", ipLabel),
        line("GATEWAY", routeLabel),
        line("DNS", dnsLabel),
        line("WIFI", wifiLabel),
        line("VPN", vpnLabel),
        Label({ className: "netwatch-footer", label: "LOCAL TELEMETRY ONLY // NO ACTIVE SCANNING", xalign: 0 }),
      ],
    }),
  })

  interval(5000, () => { if (win?.visible) refreshNetwatch() })
  return win
}

export const showNetwatch = () => {
  if (!win) return
  win.visible = true
  refreshNetwatch()
  try { win.present() } catch {}
}

export const hideNetwatch = () => { if (win) win.visible = false }
export const toggleNetwatch = () => win?.visible ? hideNetwatch() : showNetwatch()
