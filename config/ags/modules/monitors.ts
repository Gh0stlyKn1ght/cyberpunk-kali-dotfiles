import Gdk from "gi://Gdk?version=3.0"

export type MonitorInfo = {
  index: number
  monitor: any
  primary: boolean
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export const monitors = (): MonitorInfo[] => {
  const display = Gdk.Display.get_default()
  if (!display) return []

  const primary = display.get_primary_monitor?.()
  const out: MonitorInfo[] = []
  const count = display.get_n_monitors?.() || 0

  for (let index = 0; index < count; index++) {
    const monitor = display.get_monitor(index)
    if (!monitor) continue
    const geo = monitor.get_geometry()
    out.push({
      index,
      monitor,
      primary: monitor === primary || (!primary && index === 0),
      x: geo.x,
      y: geo.y,
      width: geo.width,
      height: geo.height,
      scale: monitor.get_scale_factor?.() || 1,
    })
  }

  if (!out.length) {
    const monitor = display.get_monitor?.(0)
    if (monitor) {
      const geo = monitor.get_geometry()
      out.push({ index: 0, monitor, primary: true, x: geo.x, y: geo.y, width: geo.width, height: geo.height, scale: monitor.get_scale_factor?.() || 1 })
    }
  }

  return out
}

export const primaryMonitor = () => monitors().find(m => m.primary) || monitors()[0] || null
