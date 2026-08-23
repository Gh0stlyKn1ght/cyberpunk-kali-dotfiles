import { Widget, App, Astal } from "astal/gtk3"
import Gdk from "gi://Gdk?version=3.0"

const W = Widget

export { App, Astal }

export const Anchor = Astal.WindowAnchor
export const Layer = Astal.Layer
export const Exclusivity = Astal.Exclusivity
export const Keymode = Astal.Keymode

export const Box = (props: any) => new W.Box(props)
export const Label = (props: any) => new W.Label(props)
export const Button = (props: any) => new W.Button(props)
export const EventBox = (props: any) => new W.EventBox(props)
export const Overlay = (props: any) => new W.Overlay(props)
export const Window = (props: any) => new W.Window({ application: App, ...props })

export const activeMonitor = () => {
  try {
    const display = Gdk.Display.get_default()
    const [, x, y] = display.get_default_seat().get_pointer().get_position()
    return display.get_monitor_at_point(x, y)
  } catch {
    return null
  }
}
