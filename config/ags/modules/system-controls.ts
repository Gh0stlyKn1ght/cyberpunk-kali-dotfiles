import { Anchor, Box, Button, Exclusivity, Label, Layer, Window } from "../widget.ts"
import { execAsync, interval } from "astal"

let win: any = null
let volumeValue: any = null
let micValue: any = null
let brightnessValue: any = null
let wifiValue: any = null
let btValue: any = null
let powerValue: any = null
let batteryValue: any = null

const sh = async (cmd: string) => {
  try { return (await execAsync(["sh", "-lc", cmd])).trim() } catch { return "" }
}

const refresh = async () => {
  if (!win?.visible) return
  const [vol, mic, bri, wifi, bt, power, battery] = await Promise.all([
    sh("wpctl get-volume @DEFAULT_AUDIO_SINK@ | awk '{print int($2*100) \"%\"}'"),
    sh("wpctl get-volume @DEFAULT_AUDIO_SOURCE@ | awk '{print int($2*100) \"%\"}'"),
    sh("brightnessctl -m 2>/dev/null | cut -d, -f4 || echo N/A"),
    sh("nmcli -t -f WIFI g 2>/dev/null || echo unavailable"),
    sh("bluetoothctl show 2>/dev/null | awk -F': ' '/Powered:/ {print $2; exit}' || echo unavailable"),
    sh("powerprofilesctl get 2>/dev/null || echo unavailable"),
    sh("upower -i $(upower -e 2>/dev/null | grep -m1 battery) 2>/dev/null | awk -F': *' '/percentage:/ {p=$2} /state:/ {s=$2} END {if(p) print p \" // \" toupper(s); else print \"N/A\"}'"),
  ])
  volumeValue.label = vol || "N/A"
  micValue.label = mic || "N/A"
  brightnessValue.label = bri || "N/A"
  wifiValue.label = (wifi || "UNKNOWN").toUpperCase()
  btValue.label = (bt || "UNKNOWN").toUpperCase()
  powerValue.label = (power || "N/A").toUpperCase()
  batteryValue.label = battery || "N/A"
}

const ctl = (label: string, cmd: string) => {
  const b = Button({ className: "system-control-button", label })
  b.connect("clicked", () => { sh(cmd).then(refresh) })
  return b
}

const line = (name: string, value: any, controls: any[]) => Box({
  className: "system-control-row",
  spacing: 8,
  children: [Label({ className: "system-control-name", label: name, xalign: 0 }), value, ...controls],
})

export const SystemControlsWindow = () => {
  volumeValue = Label({ className: "system-control-value", label: "N/A" })
  micValue = Label({ className: "system-control-value", label: "N/A" })
  brightnessValue = Label({ className: "system-control-value", label: "N/A" })
  wifiValue = Label({ className: "system-control-value", label: "UNKNOWN" })
  btValue = Label({ className: "system-control-value", label: "UNKNOWN" })
  powerValue = Label({ className: "system-control-value", label: "N/A" })
  batteryValue = Label({ className: "system-control-value", label: "N/A" })

  win = Window({
    name: "cyberkali-system-controls",
    className: "cyberkali-system-controls",
    anchor: Anchor.BOTTOM | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    child: Box({
      className: "system-control-frame cyber-panel",
      vertical: true,
      spacing: 8,
      children: [
        Label({ className: "system-control-kicker", label: "CYBERWARE // SYSTEM CONTROL", xalign: 0 }),
        Label({ className: "system-control-heading", label: "LOCAL HARDWARE MATRIX", xalign: 0 }),
        line("VOLUME", volumeValue, [ctl("-", "wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-"), ctl("+", "wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+")]),
        line("MIC", micValue, [ctl("MUTE", "wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle")]),
        line("BRIGHT", brightnessValue, [ctl("-", "brightnessctl set 5%-"), ctl("+", "brightnessctl set +5%")]),
        line("WIFI", wifiValue, [ctl("TOGGLE", "nmcli radio wifi $( [ \"$(nmcli -t -f WIFI g)\" = enabled ] && echo off || echo on )")]),
        line("BT", btValue, [ctl("TOGGLE", "bluetoothctl power $(bluetoothctl show | grep -q 'Powered: yes' && echo off || echo on)")]),
        line("BATTERY", batteryValue, []),
        line("PROFILE", powerValue, [
          ctl("SAVE", "powerprofilesctl set power-saver"),
          ctl("BAL", "powerprofilesctl set balanced"),
          ctl("PERF", "powerprofilesctl set performance"),
        ]),
      ],
    }),
  })

  interval(2500, refresh)
  return win
}

export const showSystemControls = () => { if (win) { win.visible = true; refresh(); try { win.present() } catch {} } }
export const hideSystemControls = () => { if (win) win.visible = false }
export const toggleSystemControls = () => win?.visible ? hideSystemControls() : showSystemControls()
