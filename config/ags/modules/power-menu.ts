import { Anchor, Box, Button, Exclusivity, Label, Layer, Window } from "../widget.ts"
import { execAsync } from "astal"

let win: any = null

const action = (label: string, command: string[]) => {
  const button = Button({ className: "power-action", label })
  button.connect("clicked", () => {
    hidePowerMenu()
    execAsync(command).catch(error => print(`[cyberkali] power action failed: ${error}`))
  })
  return button
}

export const PowerMenuWindow = () => {
  win = Window({
    name: "cyberkali-power-menu",
    className: "cyberkali-power-menu",
    anchor: Anchor.BOTTOM | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    child: Box({
      className: "power-frame cyber-panel",
      vertical: true,
      spacing: 8,
      children: [
        Label({ className: "power-kicker", label: "SESSION CONTROL // LOCAL HOST", xalign: 0 }),
        Label({ className: "power-heading", label: "POWER MATRIX", xalign: 0 }),
        action("LOCK", ["loginctl", "lock-session"]),
        action("LOG OUT", ["hyprctl", "dispatch", "exit"]),
        action("SUSPEND", ["systemctl", "suspend"]),
        action("REBOOT", ["systemctl", "reboot"]),
        action("POWER OFF", ["systemctl", "poweroff"]),
        Button({ className: "power-cancel", label: "CANCEL", onClicked: () => hidePowerMenu() }),
      ],
    }),
  })
  return win
}

export const showPowerMenu = () => { if (win) { win.visible = true; try { win.present() } catch {} } }
export const hidePowerMenu = () => { if (win) win.visible = false }
export const togglePowerMenu = () => win?.visible ? hidePowerMenu() : showPowerMenu()
