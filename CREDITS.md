# Nightreign Overlay — CREDITS

> If you see anything missing or incorrectly attributed, please open an issue and I’ll correct it.

---

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

---

## 2) Inspiration & research

- **thefifthmatt's data and pattern sheet:** Used to validate any pattern data/information.
  Site: https://thefifthmatt.github.io/nightreign/
- **Nightreign Router project:** Architectural ideas for organizing map data and coordinate pipelines.
  Repo: https://github.com/NikVince/nightreign-map-router/
- **Artimuz / Nightreign‑Seed‑Finder** — inspiration for parts of the UX and some image/layout references used to match the in‑game look and feel as well as publishing seed data and creating the 28 node design. 
  Repo: https://github.com/Artimuz/Nightreign-Seed-Finder
- **TRC – Nightreign Map Seed Recogniser (Google Apps Script):** Overall UX/flow (Nightlord selection → Map selection → click Churches/Rises → filter down to one seed + side details). Essential for early versions.
  Steam Community Post: https://steamcommunity.com/sharedfiles/filedetails/?id=3522891584

---

## 3) Licenses & notices

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

---

## 4) Thanks

- **thefifthmatt**
- **NikVince**
- **Artimuz**
- **TRC**

---

## 5) Contact / Corrections
- To request attribution changes or asset removal, please open an issue in this repo.