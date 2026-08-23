import { interval } from "astal"
import { Anchor, Box, Label, Layer, Exclusivity, Window } from "../widget.ts"
import { cpu, cpuText, ram, ramText, disk, diskText, iface, ip, vpn, workspace } from "./system.ts"

const meter = (value: number, width = 18) => {
  const n = Math.max(0, Math.min(width, Math.round(value * width)))
  return `${"█".repeat(n)}${"░".repeat(width - n)}`
}

const statRow = (title: string) => {
  const name = Label({ className: "hud-stat-name", label: title, xalign: 0 })
  const bar = Label({ className: "hud-meter", label: meter(0), xalign: 0 })
  const value = Label({ className: "hud-stat-value", label: "0%", xalign: 1 })
  return {
    widget: Box({ className: "hud-stat-row", spacing: 10, children: [name, bar, value] }),
    bar,
    value,
  }
}

export const HudWindow = () => {
  const cpuRow = statRow("CPU")
  const ramRow = statRow("RAM")
  const diskRow = statRow("DISK")

  const workspaceValue = Label({ className: "hud-workspace-value", label: "01" })
  const interfaceValue = Label({ className: "hud-net-value", label: "LO" })
  const ipValue = Label({ className: "hud-net-value", label: "NO ADDRESS" })
  const vpnValue = Label({ className: "hud-vpn-offline", label: "OFFLINE" })

  interval(500, () => {
    cpuRow.bar.label = meter(cpu.get())
    cpuRow.value.label = cpuText.get()
    ramRow.bar.label = meter(ram.get())
    ramRow.value.label = ramText.get()
    diskRow.bar.label = meter(disk.get())
    diskRow.value.label = diskText.get()

    workspaceValue.label = String(workspace.get()).padStart(2, "0")
    interfaceValue.label = iface.get().toUpperCase()
    ipValue.label = ip.get()
    const vpnName = vpn.get()
    vpnValue.label = vpnName === "OFFLINE" ? "OFFLINE" : `ONLINE // ${vpnName.toUpperCase()}`
    vpnValue.className = vpnName === "OFFLINE" ? "hud-vpn-offline" : "hud-vpn-online"
  })

  const workspaceBadge = Box({
    className: "hud-workspace",
    vertical: true,
    children: [
      Label({ className: "hud-kicker", label: "LEVEL" }),
      workspaceValue,
    ],
  })

  const telemetry = Box({
    className: "hud-telemetry",
    vertical: true,
    spacing: 5,
    children: [
      Box({ className: "hud-title-row", spacing: 8, children: [
        Label({ className: "hud-title", label: "CYBERKALI // NETWATCH" }),
        Label({ className: "hud-live", label: "● LIVE" }),
      ] }),
      cpuRow.widget,
      ramRow.widget,
      diskRow.widget,
    ],
  })

  const network = Box({
    className: "hud-network",
    vertical: true,
    spacing: 2,
    children: [
      Label({ className: "hud-kicker", label: "NETWORK LINK", xalign: 0 }),
      Box({ spacing: 8, children: [
        Label({ className: "hud-net-label", label: "IFACE" }),
        interfaceValue,
      ] }),
      Box({ spacing: 8, children: [
        Label({ className: "hud-net-label", label: "IP" }),
        ipValue,
      ] }),
      Box({ spacing: 8, children: [
        Label({ className: "hud-net-label", label: "VPN" }),
        vpnValue,
      ] }),
    ],
  })

  const content = Box({
    className: "hud-shell cyber-panel",
    spacing: 18,
    children: [workspaceBadge, telemetry, network],
  })

  return Window({
    name: "cyberkali-hud",
    className: "cyberkali-hud",
    anchor: Anchor.TOP | Anchor.LEFT,
    layer: Layer.TOP,
    exclusivity: Exclusivity.IGNORE,
    marginTop: 24,
    marginLeft: 26,
    child: content,
  })
}
