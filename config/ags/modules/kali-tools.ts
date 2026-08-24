import GLib from "gi://GLib"
import Gio from "gi://Gio"

export type KaliToolMeta = {
  category: string
  executable: string
  path: string
  packageName: string
  packageVersion: string
  terminal: boolean
  favorite: boolean
  recentRank: number
}

const cache = new Map<string, KaliToolMeta>()
const stateDir = `${GLib.get_user_config_dir()}/cyberkali`
const favoritesFile = `${stateDir}/favorites`
const recentFile = `${stateDir}/recent-tools`

const readLines = (path: string) => {
  try {
    const [ok, data] = GLib.file_get_contents(path)
    if (!ok) return []
    return new TextDecoder().decode(data).split("\n").map(x => x.trim()).filter(Boolean)
  } catch { return [] }
}

const favorites = () => new Set(readLines(favoritesFile))
const recent = () => readLines(recentFile)

const shell = (cmd: string) => {
  try {
    const [ok, out] = GLib.spawn_command_line_sync(cmd)
    return ok ? new TextDecoder().decode(out).trim() : ""
  } catch { return "" }
}

export const categoryForText = (value: string) => {
  const v = value.toLowerCase()
  if (/nmap|masscan|amass|recon|osint|whois|dns|theharvester|maltego/.test(v)) return "INFORMATION GATHERING"
  if (/nessus|openvas|gvm|nikto|nuclei|vulnerability|scanner/.test(v)) return "VULNERABILITY ANALYSIS"
  if (/burp|zap|sqlmap|ffuf|gobuster|ferox|web|http/.test(v)) return "WEB APPLICATIONS"
  if (/john|hashcat|hydra|medusa|password|crack/.test(v)) return "PASSWORD ATTACKS"
  if (/aircrack|wifite|kismet|wireless|802\.11|reaver/.test(v)) return "WIRELESS ATTACKS"
  if (/metasploit|msfconsole|exploit|armitage|payload/.test(v)) return "EXPLOITATION TOOLS"
  if (/wireshark|tcpdump|ettercap|bettercap|sniff|spoof|mitmproxy/.test(v)) return "SNIFFING & SPOOFING"
  if (/mimikatz|empire|post.?exploit|bloodhound|covenant/.test(v)) return "POST EXPLOITATION"
  if (/ghidra|radare|rizin|cutter|reverse|binary|gdb/.test(v)) return "REVERSE ENGINEERING"
  if (/autopsy|volatility|sleuth|forensic|binwalk/.test(v)) return "FORENSICS"
  if (/cherrytree|faraday|dradis|report/.test(v)) return "REPORTING"
  return "SYSTEM"
}

const executableFor = (app: any) => String(app.get_executable?.() || "").trim().split(/\s+/)[0]

export const metadataFor = (app: any): KaliToolMeta => {
  const key = String(app.get_id?.() || app.get_name?.() || executableFor(app))
  const saved = cache.get(key)
  if (saved) return saved

  const executable = executableFor(app)
  const path = executable ? (GLib.find_program_in_path(executable) || "") : ""
  const haystack = [app.get_name?.(), app.get_description?.(), executable, app.get_id?.()].filter(Boolean).join(" ")
  const favs = favorites()
  const recents = recent()
  let packageName = ""
  let packageVersion = ""
  if (path) {
    const owner = shell(`sh -lc 'dpkg-query -S "${path.replace(/'/g, "'\\''")}" 2>/dev/null | head -n1 | cut -d: -f1'`)
    packageName = owner.split(":")[0]
    if (packageName) packageVersion = shell(`sh -lc 'dpkg-query -W -f="\${Version}" "${packageName.replace(/'/g, "'\\''")}" 2>/dev/null'`)
  }

  const meta: KaliToolMeta = {
    category: categoryForText(haystack),
    executable,
    path,
    packageName,
    packageVersion,
    terminal: !!executable && !app.get_id?.()?.endsWith?.(".desktop") ? true : /terminal=true/i.test(haystack),
    favorite: favs.has(executable) || favs.has(key),
    recentRank: recents.indexOf(executable || key),
  }
  cache.set(key, meta)
  return meta
}

export const recordLaunch = (app: any) => {
  try {
    GLib.mkdir_with_parents(stateDir, 0o755)
    const meta = metadataFor(app)
    const key = meta.executable || String(app.get_id?.() || app.get_name?.() || "")
    const next = [key, ...recent().filter(x => x !== key)].slice(0, 20)
    GLib.file_set_contents(recentFile, next.join("\n") + "\n")
  } catch {}
}

export const sortApps = (apps: any[]) => apps.sort((a, b) => {
  const ma = metadataFor(a), mb = metadataFor(b)
  if (ma.favorite !== mb.favorite) return ma.favorite ? -1 : 1
  const ar = ma.recentRank < 0 ? 999 : ma.recentRank
  const br = mb.recentRank < 0 ? 999 : mb.recentRank
  if (ar !== br) return ar - br
  if (ma.category !== mb.category) return ma.category.localeCompare(mb.category)
  return String(a.get_name?.() || "").localeCompare(String(b.get_name?.() || ""))
})
