import { Variable, interval, execAsync } from "astal"
import GLib from "gi://GLib"

const read = (path: string) => {
  try {
    const [ok, data] = GLib.file_get_contents(path)
    return ok ? new TextDecoder().decode(data) : ""
  } catch {
    return ""
  }
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))
const pct = (n: number) => `${Math.round(clamp(n) * 100)}%`

let prevIdle = 0
let prevTotal = 0

const readCpu = () => {
  const line = read("/proc/stat").split("\n")[0]
  const parts = line.split(/\s+/).slice(1).map(Number)
  if (parts.length < 4) return 0
  const idle = parts[3] + (parts[4] || 0)
  const total = parts.reduce((sum, value) => sum + (value || 0), 0)
  const deltaIdle = idle - prevIdle
  const deltaTotal = total - prevTotal
  prevIdle = idle
  prevTotal = total
  return deltaTotal > 0 ? clamp(1 - deltaIdle / deltaTotal) : 0
}

const memValue = (key: string) => {
  const line = read("/proc/meminfo").split("\n").find((item) => item.startsWith(`${key}:`))
  return line ? parseInt(line.split(/\s+/)[1]) || 0 : 0
}

const readRam = () => {
  const total = memValue("MemTotal")
  const available = memValue("MemAvailable")
  return total > 0 ? clamp((total - available) / total) : 0
}

const readDisk = async () => {
  try {
    const output = await execAsync(["sh", "-c", "df -P / | awk 'NR==2 {print $5}' | tr -d '%' "])
    return clamp((parseInt(output.trim()) || 0) / 100)
  } catch {
    return 0
  }
}

const defaultInterface = () => {
  const route = read("/proc/net/route").split("\n").slice(1)
  for (const line of route) {
    const fields = line.trim().split(/\s+/)
    if (fields[1] === "00000000" && fields[0]) return fields[0]
  }
  return "lo"
}

const ipFor = async (iface: string) => {
  try {
    const output = await execAsync(["sh", "-c", `ip -4 -o addr show dev ${iface} | awk '{print $4}' | cut -d/ -f1 | head -1`])
    return output.trim() || "NO ADDRESS"
  } catch {
    return "NO ADDRESS"
  }
}

const vpnState = async () => {
  try {
    const output = await execAsync(["sh", "-c", "ip -o link show | awk -F': ' '{print $2}' | grep -E '^(tun|tap|wg)[0-9]+' | head -1"])
    return output.trim() || "OFFLINE"
  } catch {
    return "OFFLINE"
  }
}

export const cpu = Variable(0)
export const cpuText = Variable("0%")
export const ram = Variable(0)
export const ramText = Variable("0%")
export const disk = Variable(0)
export const diskText = Variable("0%")
export const iface = Variable(defaultInterface())
export const ip = Variable("NO ADDRESS")
export const vpn = Variable("OFFLINE")
export const workspace = Variable("1")

readCpu()

interval(1000, () => {
  const nextCpu = readCpu()
  const nextRam = readRam()
  cpu.set(nextCpu)
  cpuText.set(pct(nextCpu))
  ram.set(nextRam)
  ramText.set(pct(nextRam))
})

interval(5000, async () => {
  const nextDisk = await readDisk()
  const nextIface = defaultInterface()
  disk.set(nextDisk)
  diskText.set(pct(nextDisk))
  iface.set(nextIface)
  ip.set(await ipFor(nextIface))
  vpn.set(await vpnState())
})

export const refreshWorkspace = async () => {
  try {
    const output = await execAsync(["hyprctl", "activeworkspace", "-j"])
    const data = JSON.parse(output)
    workspace.set(String(data?.id ?? 1))
  } catch {
    workspace.set("1")
  }
}

refreshWorkspace()
interval(1500, refreshWorkspace)
