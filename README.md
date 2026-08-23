# Cyberpunk Kali Dotfiles

A Kali Linux / Hyprland desktop shell inspired by cyberpunk HUD interfaces, built around a shared runtime and switchable visual flavors.

## Flavors

- `red` - the default Cyberpunk red theme, matching the visual direction of CyberArch-Dotfiles.
- `cyan` - cold cyan / netrunner edition.
- `amber` - old-school phosphor amber terminal edition.

The flavors share the same components and behavior. Only design tokens change, so fixes and features do not need to be maintained three times.

## Goals

- Kali Rolling first
- Hyprland + Wayland
- AGS/Astal shell
- Quickshell lock screen
- reversible installation
- no GitHub Actions required
- local validation and diagnostics
- Kali-aware launcher and system telemetry

## Early usage

```bash
chmod +x install.sh cyberkali
./install.sh --dry-run
./install.sh

./cyberkali flavor red
./cyberkali flavor cyan
./cyberkali flavor amber
./cyberkali doctor
```

## Layout

```text
cyberpunk-kali-dotfiles/
├── install.sh
├── cyberkali
├── installer/
│   ├── common.sh
│   └── packages.sh
├── config/
│   ├── cyberkali/
│   │   └── flavor
│   └── ags/
│       └── styles/
│           ├── _tokens.scss
│           └── flavors/
│               ├── red.scss
│               ├── cyan.scss
│               └── amber.scss
└── docs/
```

## Status

Foundation phase. The installer, flavor system, diagnostics, and runtime layout are being built before the full HUD is ported.
