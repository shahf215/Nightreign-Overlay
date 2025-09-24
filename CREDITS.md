# Nightreign Overlay — CREDITS

This document lists the third‑party code, data, images, ideas, and references used in this project, with a clear separation between **directly incorporated** material, **adaptations/derivatives**, **inspiration/research sources**, and **original work**.

> If you see anything missing or incorrectly attributed, please open an issue and I’ll correct it.

---

## 1) Directly incorporated files/assets (verbatim or near‑verbatim)

### A. POI coordinate dataset (derived from Nightreign Router)
- **File in this repo:** `assets/data/poi_coordinates_with_ids.json`
- **Upstream origin:** `nightreign-map-router` → `public/assets/maps/poi_coordinates_with_ids.json`
- **License of upstream:** MIT (© 2025 Nikolas (Daniel) Vincenti)
- **Modifications made here:**
  - Retained the same JSON structure (`[{ id, coordinates: [x,y] }]`).
  - Adjusted a few coordinates for better on‑screen alignment in the overlay:
    - POI **23**: `(1291.88, 915.88) → (1291.88, 917)`
    - POI **92**: `(1811.67, 826) → (1811.67, 860)`
    - POI **158**: `(1245.82, 916.36) → (1245.82, 873)`
    - POI **159**: `(1237.45, 832.36) → (1237.45, 895)`
  - Added **POI 214** to place special events: `(700, 1390)`.
- **Attribution notice:** This repository includes data derived from *Nightreign Router* under the MIT License. See §4 for license notices.

### B. Seed Finder map backgrounds (from TRC’s public web app)
- **Files in this repo:**
  - `assets/images/seedfinderMapBackgrounds/Default.png`
  - `assets/images/seedfinderMapBackgrounds/Mountaintop.png`
  - `assets/images/seedfinderMapBackgrounds/Crater.png`
  - `assets/images/seedfinderMapBackgrounds/RottedWoods.png`
  - `assets/images/seedfinderMapBackgrounds/Noklateo.png`
- **Upstream origin:** TRC’s *Nightreign Map Seed Recogniser* web app. These images are included so the Electron overlay works offline and avoids hotlinking.

### C. Seed Finder icons (from TRC’s public web app)
- **Files in this repo:**
  - `assets/images/seedfinderIcons/church-icon.png`
  - `assets/images/seedfinderIcons/sorcerers-rise-icon.png`
- **Upstream origin:** TRC’s *Nightreign Map Seed Recogniser* web app. Included locally for the same reasons as map backgrounds (offline use/no hotlinking).

### D. Screen‑space POI dot positions per map (TRC parity)
- **File in this repo:** `renderer/seedfinder.constants.js` → `window.POIS_BY_MAP` and `window.MAP_BACKGROUNDS`
- **What was incorporated:** The **screen‑space dot positions** and the **one‑to‑one mapping of map names** reflect TRC’s UI so the Seed Finder behaves identically (left‑click = Church, right‑click = Sorcerer’s Rise, middle‑click = “?”; initial candidate counts of **20** on `Default` and **5** on each Shifting Earth variant).
- **Implementation note:** The code in this repository is a re‑implementation; only the **numerical POI positions and UX semantics** are mirrored.

---

## 2) Adapted/derived material (re‑structured or extended)

### A. Pattern data by Nightlord
- **Files in this repo:** `assets/data/patterns_by_nightlord/*.json` (Adel, Caligo, Fulghor, Gladius, Gnoster, Heolstor, Libra, Maris)
- **Source of truth:** thefifthmatt’s published Nightreign pattern listings (site & spreadsheet). Each Nightlord has **40** patterns (20 Default + 5×4 Shifting Earths).
- **Adaptations here:** Nightreign Router listed 320 json files (one for each layout/pattern) in `nightreign-map-router` → `reference_material/pattern_layouts`. Combined and edited the data to fit the data used by the overlay and drop unused/not required fields/data.

### B. Normalized UVs for POI alignment
- **File in this repo:** `assets/data/poi_uv_with_ids.json`
- **How produced:** Computed from the coordinate dataset to provide **resolution‑independent** overlay placement. The math follows the same principles described in Nightreign Router’s POI scaling documentation.

---

## 3) Inspiration & research

- **TRC – Nightreign Map Seed Recogniser (Google Apps Script):** Overall UX/flow (Nightlord selection → Map selection → click Churches/Rises → filter down to one seed + side details). 
- **Nightreign Router project:** Architectural ideas for organizing map data, coordinate pipelines, and POI nomenclature. No Next.js/Prisma/tRPC code was copied; only the public POI dataset and documentation concepts were used.
- **thefifthmatt's data and pattern sheet:** Used to validate any pattern data/information.

---

## 4) Licenses & notices

### Nightreign Router (MIT)
This project includes data adapted from **Nightreign Router** by **Nikolas (Daniel) Vincenti**, licensed under the **MIT License**. Original copyright and license notices:

```
MIT License

Copyright (c) 2025 Nikolas (Daniel) Vincenti

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### TRC assets (map backgrounds & icons)
- These are **visual assets** used to faithfully reproduce TRC’s Seed Finder look/feel in an offline Electron overlay. They are **not** distributed for re‑use beyond this tool.

### thefifthmatt (patterns)
- Pattern listings and map pattern indices are credited to **thefifthmatt**. Data were formatted for programmatic use in this repository.

### Elden Ring / Nightreign
- *Elden Ring* and *Elden Ring Nightreign* are properties of FromSoftware, Inc. / Bandai Namco. This project is an unofficial fan utility and is not affiliated with, endorsed by, or sponsored by those companies.

---

## 6) Thanks

- **thefifthmatt** — for compiling map pattern knowledge for the community.
- **Nightreign Router** — for a clean, MIT‑licensed public data set on POI mapping.
- **TRC (The Reaper CooL)** — for the original Seed Recogniser concept and clear UI that made parity possible.

---

## 7) Contact / Corrections
- To request attribution changes or asset removal, please open an issue in this repo.