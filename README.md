# Nightreign Overlay — Seed Finder + In‑Game Overlay

An Electron-based **seed finder** and **overlay** for *Elden Ring Nightreign*. It lets you quickly narrow seeds/patterns and renders labels on top of the game’s map.

---

## Highlights

- 🔎 **Seed Finder**: fast pruning with slot icons (Spawn / Churches / Sorcerer’s Rise / Township, etc.), per‑slot pickers, and smart “ghost” hints when only two options remain.
- 🗺️ **Overlay**: transparent, always‑on‑top; category toggles, per‑category colors, font size / scale, global offset.
- 🎮 **Controller support**: DualSense **and** Xbox .
- ⌨️ **Hotkeys**: F7–F10 by default, fully customizable (UI or `config/hotkeys.json`).
- 🌐 **Languages**: per‑language JSON bundles (UI + domain labels).
- 🔒 **Safe with EAC**: never touches the game process; just keyboard/gamepad input and an overlay window.
- 🧩 **Deep of the Night mode friendly**: when POIs are hidden in‑game, you can still identify the seed by placing your **Spawn** and other early visibile icons.

---

## Install & Run

### Requirements
- **Windows 10/11**
- **Node.js 20+** (or 22 LTS) and npm

## 📦 Downloads

Grab the latest Windows portable build from the **[Releases]** page.

[Releases]: https://github.com/shahf215/Nightreign-Overlay/releases


## Quick Start (Developer Mode)
- Ideal for debugging and UI tweaks
```bash
npm install
npm start
```

## 🚀 Build a Windows .exe
- Produces a directory that contains an executable and it's dependencies.
- Output goes to `dist/win-unpacked`
```bash
npm install   # skip if already installed
npm run dist:win
```

## 🚀 Build a Windows .exe (Portable but slower)
- Produces a single-file executable you can copy anywhere and run.
- Output goes to `dist/`
```bash
npm install   # skip if already installed
npm run dist:dir
```

---

## Using Seed Finder

1. **Open Seed Finder** and bring it into focus (F7) and choose a **Shifting Earth** type (you can click the buttons in the side bar or the thumbnails).
2. Click icons on the map to **pick per‑slot** values (Spawn, Churches, Township, etc.).  
   - The slot picker appears on click; unavailable/invalid options are hidden.  
   - If the logic narrows to two options and one is empty, you’ll see a **ghost icon** on the map as a hint.
3. Continue placing icons until the **candidate count** converges.
4. When one seed is left it will automatically display.

### Deep of the Night (hidden POIs)
When the game hides POIs, you can still narrow the seed by setting **Spawn** (in cases where you spawn at a church use the **Church Spawn** combined icon). Supplement with other early POIs to narrow down your seed.

---

### POI Settings (visibility + color)
In **Seed Finder → Overlay Options → POI Settings** you can toggle categories and pick colors:
- Night Bosses, Evergaol, Field Boss, Events, Sorcerer’s Rise, Castle, Ruins, Great Churches, Churches, Townships, Forts, Camps, Caravans.

Each category has an independent color swatch.

### Overlay Settings
Also under **Overlay Options**:
- **Font Size** — label font size.  
- **Offset X / Offset Y** — nudges every label globally (useful for personal HUD layouts).  
- **Scale** — scales label size and paddings (DPI‑aware).

> All settings persist on restart.

---

## Hotkeys

### Defaults
| Action                | Default |
|----------------------|---------|
| Toggle Seed Finder   | **F7**  |
| Send to Overlay      | **F8**  |
| Toggle Overlay       | **F9**  |
| Reset Overlay        | **F10** |

---

## Controller Support (DualSense & Xbox)

I use the standard **Gamepad API** and auto‑detect common controllers.

- **Toggle Overlay**  
  - **DualSense**: *Touchpad click*  
  - **Xbox**: *View/Back button*

- **Hide Overlay**  
  - **B / Circle**  
  - **LB / L1**, **RB / R1**  
  - **Start / Options**

---

## Languages & Translations
  
- Some phrasing may be off. Please open an issue if you find an error so I can update it.

---

## Troubleshooting

- **Overlay doesn’t appear**  
  - If you have multiple monitors, the overlay attaches to your **primary display**. Move the game window there or change the primary monitor.
- **Hotkey doesn’t work**  
  - Another app may have registered that global shortcut. Change your hotkey in **Hotkey Settings**.
- **Controller toggle doesn’t work**  
  - Disable or reconfigure **Steam Input** so the pad reports standard buttons.
- **Wrong language/labels**  
  - Switch language in the Finder dropdown.

---

## Safety

- Runs as a normal desktop app.  
- No game memory reads/writes, no DLL injection, no kernel drivers.  
- Safe to use with **Easy Anti‑Cheat enabled**.
- Still use at your own risk.

---

## 🙏 Credits
Attributions are listed in **credits.md**.

---

## License

Personal, non‑commercial use.