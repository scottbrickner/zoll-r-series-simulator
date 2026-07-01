# Visual Alignment Report — ZOLL R Series learner panel

Status: **LOCKED** (geometry frozen as of this report). The device artwork is a
proportion-matched vector reconstruction of the ZOLL R Series front panel, built
as a master SVG ([`src/components/rseries/RSeriesDevice.jsx`](src/components/rseries/RSeriesDevice.jsx))
whose geometry is the single source of truth. React only drives interactive
attributes; it never regenerates the artwork.

---

## 1. Reference image used

- **Primary target:** the front-facing ZOLL R Series reference image supplied by
  the user (the dimensioned product drawing showing the device in **PACE** mode:
  SpO₂ 58, CO₂ 25 / RR 12, ECG + CO₂ capnogram, "PACE", 62 mA / 72 PPM).
- **Dimensional callouts from the reference drawing:** 13.70 in / 348 mm wide
  (top), 12.20 in / 310 mm (bottom), 10.90 in / 277 mm tall, lower cradle
  1.75 in / 44 mm. Whole-device aspect ratio ≈ **1.263**.
- **Source caveat:** the supplied "vector" PDF (`vector r series pace.pdf`) is a
  flat **raster** image (single embedded PNG, no vector paths, C2PA
  AI-generated provenance). No original vector geometry could be lifted, so all
  coordinates were **measured** from the rasterized reference, not traced.

## 2. Overlay settings

- **Reference raster** rendered from the PDF at matrix scale 1.35 →
  **1429 × 1129 px**, which matches the user's coordinate-grid overlay
  (gridlines every 50 px / 100 px). This pixel space was the measurement frame.
- Element positions in the reference were measured by color-segmentation
  (NumPy/PIL): blue bumper, black LCD, orange SHOCK, teal/green tabs, beige
  buttons, knob discs, etc.
- The generated SVG was measured live in the browser via `getBBox()` in SVG
  user units, then both sets were **normalized to each device's bounding box**
  (x and width as a fraction of device width; y and height as a fraction of
  device height) so the two could be compared independent of absolute scale.

## 3. Measured SVG scale

- **SVG viewBox:** `0 0 1440 1120` (master coordinate space).
- **Rendered device bounding box:** ≈ 1410 × 1102 user units → **aspect ratio
  1.281** (reference 1.263; deviation ≈ 1.4 %).
- **LCD logical content** is authored in a fixed **673 × 515** space
  ([`LcdScreen.jsx`](src/components/rseries/LcdScreen.jsx)) and placed/scaled into
  the physical LCD rect `x 204, y 200, w 697, h 526` via
  `scale(1.0357, 1.0214)`.
- **Display scale** in the learner view: `.rs-panel-wrap { width: min(1320px, 98vw) }`.

## 4. X / Y offsets (reference fraction vs. final SVG fraction)

Normalized to device bounding box. Target = reference; Final = locked SVG.

| Anchor | Axis | Reference | Final | Δ |
|--------|------|-----------|-------|---|
| Screen center | X | 0.379 | 0.378 | −0.001 |
| Screen center | Y | 0.411 | 0.419 | +0.008 |
| SHOCK center | X | 0.847 | 0.847 | 0.000 |
| Mode knob center | X | 0.845 | ~0.845 | ~0 |
| Pacer knob center | Y | 0.696 | 0.698 | +0.002 |
| Keypad column center | X | 0.723 | 0.721 | −0.002 |
| Code-readiness box | X | 0.682–0.792 | ~0.69–0.78 | ≤0.01 |

All anchors are within ≈ 1–2 % of the reference.

## 5. Top 10 mismatches fixed (final alignment pass)

Measured as a fraction of the device bounding box.

| # | Element | Reference | Before | After |
|---|---------|-----------|--------|-------|
| 1 | Device aspect ratio | 1.263 | 1.358 (too wide) | **1.281** |
| 2 | Screen center-x | 0.379 | 0.359 (too left) | **0.378** |
| 3 | Screen height | 0.478 | 0.501 (too tall) | **0.479** |
| 4 | SHOCK center-x | 0.847 | 0.872 (too right) | **0.847** |
| 5 | Pacer knob center-y | 0.696 | 0.771 (too low) | **0.698** |
| 6 | Pacer RATE knob x | 0.891 | ~0.90 | aligned (1276) |
| 7 | Keypad column center-x | 0.723 | 0.675 (too left) | **0.721** |
| 8 | Code-readiness box x | 0.682–0.792 | 0.713–0.796 (right) | **0.69–0.78** |
| 9 | Softkey height | ~0.06 | 0.042 (too short) | **~0.052** |
| 10 | Cradle height | ~0.19 | 0.215 (too tall) | **~0.19** |

### Earlier alignment passes (also fixed and verified < 2 %)
Screen size/position, therapy-column spacing (SHOCK→ANALYZE/CHARGE 118,
ANALYZE/CHARGE→ENERGY 130), softkey pitch (114), blue-bumper wall thickness
(19 px), pacer-knob diameter, SHOCK radius (48). Color system aligned to the
reference legend: ZOLL Blue (Pantone 3005 C), faceplate RAL 7035, ENERGY SELECT
beige (RAL 1015), ANALYZE/CHARGE peach, **teal** PACER + pacer rings + 4:1,
green/yellow status LEDs, dark blue-gray code-readiness window with green check.

## 6. Top remaining mismatches (accepted; not yet corrected)

These are below the threshold that warrants further geometry churn. Address only
in a deliberate future alignment pass (see README lock rule).

1. **Top blue "hump" contour** is a stylized approximation of the molded
   stepped elevation — silhouette is close but not a pixel trace.
2. **Trapezoidal taper** (top 348 mm vs bottom 310 mm) is rendered subtly;
   the real taper may be marginally stronger.
3. **Molded-plastic texture** is conveyed with a single highlight gradient, not
   a true texture/normal map.
4. **Screen center-y** sits ≈ 0.8 % low vs the reference.
5. **Cradle side-supports / feet** are simplified ellipses, not the exact molded
   foot profile.
6. **Mode-knob tab shapes** (OFF/MONITOR/PACER/DEFIB) are approximate polygons
   vs the reference's exact rounded tab geometry.
7. **Sub-pixel details** (screws, seams, button bevels) are reconstructions, as
   no original vector paths exist in the supplied raster source.

---

## 7. Dev-only screenshot capture checklist

Capture each state at a fixed viewport (suggest **980 × 760**, learner route)
for regression comparison against this report. These are **dev-only** QA shots,
not part of the shipped app.

Set state by broadcasting on the `zoll-r-series-sim` channel (or via the
facilitator view), then screenshot `/learner`:

- [ ] **Default monitor mode** — `mode: 'Monitor'`, `rhythm: 'Normal Sinus'`,
      `running: false`, HR 72 / SpO₂ 98 / NIBP 120/80 / EtCO₂ 38.
- [ ] **DEFIB charged mode** — `mode: 'Defib'`, `rhythm: 'Ventricular Fibrillation'`,
      `charged: true`, `energy: 200` → expect SHOCK glow, "DEFIB READY", dial at DEFIB.
- [ ] **PACER mode** — `mode: 'Pacer'`, `pacerOutput: 62`, `pacerRate: 72` →
      expect "PACE", mA/PPM values, dial at PACER, teal rings.
- [ ] **Education mode on** — overlay labels/callouts enabled (behavior backlog).
- [ ] **Validation mode on** — learner-action checks / scoring enabled (behavior backlog).

> Education mode and Validation mode are **planned simulator behaviors** (see
> backlog below); their screenshots become valid once those features land.
