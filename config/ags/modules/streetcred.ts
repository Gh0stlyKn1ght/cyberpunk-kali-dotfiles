import { Anchor, Box, Exclusivity, Label, Layer, Window } from "../widget.ts"
import { timeout } from "astal"

let win: any = null
let pkgLabel: any = null
let versionLabel: any = null
let hideTimer: any = null

const clean = (value: string) => value.replace(/[^A-Za-z0-9+_.:@~-]/g, "").slice(0, 80)

export const StreetCredWindow = () => {
  pkgLabel = Label({ className: "streetcred-package", label: "PACKAGE" })
  versionLabel = Label({ className: "streetcred-version", label: "VERSION" })

  win = Window({
    name: "cyberkali-streetcred",
    className: "cyberkali-streetcred",
    anchor: Anchor.TOP | Anchor.RIGHT,
    layer: Layer.OVERLAY,
    exclusivity: Exclusivity.IGNORE,
    visible: false,
    child: Box({
      className: "streetcred-frame",
      vertical: true,
      children: [
        Label({ className: "streetcred-kicker", label: "// SOFTWARE ACQUISITION" }),
        Label({ className: "streetcred-title", label: "+ STREET CRED" }),
        Label({ className: "streetcred-status", label: "PACKAGE INSTALLED" }),
        pkgLabel,
        versionLabel,
      ],
    }),
  })

  return win
}

export const showStreetCred = (pkg: string, version = "") => {
  if (!win) return
  const safePkg = clean(pkg) || "UNKNOWN PACKAGE"
  const safeVersion = clean(version)
  pkgLabel?.set_label?.(safePkg.toUpperCase())
  versionLabel?.set_label?.(safeVersion ? `VERSION ${safeVersion}` : "INSTALL COMPLETE")
  win.visible = true
  try { win.present() } catch {}

  try { hideTimer?.cancel?.() } catch {}
  hideTimer = timeout(4200, () => {
    if (win) win.visible = false
  })
}
