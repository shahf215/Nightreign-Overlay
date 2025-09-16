# Nightreign Overlay

An Electron-based **seed finder** and **overlay** for *Elden Ring Nightreign*. It lets you quickly narrow seeds/patterns and renders labels on top of the game’s map.


## ✨ Features
- Seed Finder allows user to quickly narrow down to the correct pattern
- Each label is anchored to its in game location
- Always-on-top, transparent overlay window positioned over the game’s map
- Keyboard and DualSense shortcuts
- No memory reads, code injection, DLLs, drivers, or patching. The overlay is a separate window and **does not** modify or interact with the game process, making it safe to use with Easy Anti-Cheat enabled.

## 🧰 Prerequisites
- **Node.js 20+** (or 22 LTS)
- **Windows 10/11**
- **Elden Ring Nightreign in Borderless Window mode**

## 🚀 Run
```bash
npm install
npm start
```


## ⌨️ Keyboard Shortcuts
- **F8**: Toggle Seed Finder
- **F9**: Toggle Overlay
- **F10**: Reset Overlay

## DualSense Shortcuts
- **TouchPad**: Toggle Overlay (The default button to bring up the map in game, connecting the two so the overlay hides when map is hidden)
- **L1, R1, Circle, Start**: Hide Overlay (When the overlay is open, pressing any of these buttons will hide it)

## 🙏 Credits
Attributions are listed in **credits.md**.
