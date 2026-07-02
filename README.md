# ZOLL R Series Simulator

> **⚠️ Training simulation only. Not for clinical use.** This is a teaching tool.
> It is not a medical device and must never be used for patient care. Not
> affiliated with or endorsed by ZOLL Medical Corporation.

A browser-based training simulator for the ZOLL R Series monitor/defibrillator,
built with React + Vite (JavaScript). It runs entirely locally and is designed
to be used as **two windows on the same device**:

## 📚 Project documentation — read `/docs` first

**`/docs` is the permanent project bible.** Future Claude Code sessions and new
contributors must read it **before making any change**. It is the authoritative
source of intent; when code and docs disagree, reconcile — don't improvise.

| Document | What it covers |
|----------|----------------|
| [README.md](docs/README.md) | Documentation index and the "read `/docs` first" mandate. |
| [PROJECT_VISION.md](docs/PROJECT_VISION.md) | Purpose, audience, objectives, scope, philosophy, training-only disclaimer, long-term goals. |
| [ROADMAP.md](docs/ROADMAP.md) | Every milestone — implemented, partial, and planned — including the Industrial Design passes. |
| [SIMULATOR_REQUIREMENTS.md](docs/SIMULATOR_REQUIREMENTS.md) | Complete functional specification (defib, sync, pacer, CPR, monitoring, scenarios, modes, reports, logging). |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | React architecture: roles, state/scenario/waveform/report engines, component + asset libraries. |
| [COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) | Every SVG asset and component, the SVG structural standards, and the modular part taxonomy — with filenames. |
| [ART_DIRECTION.md](docs/ART_DIRECTION.md) | Binding art-direction rules **and** the approved visual language + palette. |
| [DECISIONS.md](docs/DECISIONS.md) | The decision log: key architectural/design decisions, why, and their consequences. |
| [CHANGELOG.md](docs/CHANGELOG.md) | Dated history of what has actually shipped. |

**Golden rule:** the device **geometry is LOCKED**. React animates state; it
never redraws the artwork. See ART_DIRECTION.md and COMPONENT_LIBRARY.md.

- **`/facilitator`** — the instructor console. Set the rhythm, vitals, device
  mode, defib energy, charge/shock, and pacer settings.
- **`/learner`** — the device screen the trainee watches. It mirrors whatever
  the facilitator configures, in real time.
- **`/`** — a landing page with links into both roles.

## Sessions (independent, multi-user)

Every run is scoped by a **session id** carried in the URL query string:

```
/facilitator?session=abc123
/learner?session=abc123
```

The landing page (`/`) is a **launcher**: create or enter a session id, then
open the facilitator and learner windows or copy their links. Windows that
share the same `session` stay in sync; **different sessions never cross-sync**,
so multiple instructors can run independent sessions on one machine or one
deployment at the same time.

## How the two windows stay in sync

State is shared across same-session windows via the
[`BroadcastChannel`](https://developer.mozilla.org/docs/Web/API/BroadcastChannel)
API, mirrored into `localStorage`, both **keyed by session id**
(`zoll-r-series-sim:<id>` / `zoll-r-series-sim:state:<id>`). A window opened or
reloaded later hydrates from that session's last known state. No server or
backend is required — it's all client-side. See
[`src/sync/SimulatorContext.jsx`](src/sync/SimulatorContext.jsx).

Event logs, scenario data, and validation reports are therefore **per session**.
The facilitator can **Reset Session** (clear the current session's run) or
**Duplicate → New Session** (copy the current scenario/config into a fresh
session id).

## Project structure

```
src/
  main.jsx                       # entry; wraps app in <BrowserRouter>
  App.jsx                        # routes: / , /learner , /facilitator
  sync/SimulatorContext.jsx      # cross-window shared state (BroadcastChannel + localStorage)
  views/
    Home.jsx                     # landing page
    Learner.jsx                  # learner stage (hosts the device, elapsed clock, shock flash)
    Facilitator.jsx              # instructor controls
  components/rseries/
    RSeriesDevice.jsx            # master SVG device — LOCKED geometry (see below)
    LcdScreen.jsx                # live LCD content (SVG, driven by state)
    waveforms.js                 # ECG / pleth / capnogram path data
    rseries.css                  # device + LCD styling (colors/animation only)
  index.css                      # global + learner-stage styles
```

## Master artwork is LOCKED (RSeries_Master.svg)

The learner device is the permanent master artwork **`RSeries_Master.svg`**
(viewBox `0 0 1440 1120`). The authored source is
[`src/components/rseries/RSeriesDevice.jsx`](src/components/rseries/RSeriesDevice.jsx)
(the master SVG, inlined so React can animate individual layers); a frozen
static export is committed at [`public/RSeries_Master.svg`](public/RSeries_Master.svg).

**Layers (locked):** `01_Bumper`, `02_Faceplate`, `03_ScreenBezel`,
`04_LCD_Window`, `05_LCD_Glass`, `06_LCD_Background` (empty), `07_Softkeys`,
`08_FunctionButtons`, `09_TherapyButtons`, `10_EnergySelect`,
`11_ModeSelector_Back`, `12_ModeSelector_Arcs` (never rotate),
`13_ModeSelector_Knob`, `14_ModeSelector_Dots` (single white dot),
`15_PacerKnobs`, `16_LEDIndicators`, `17_SelfTestWindow` (blank/X/check),
`18_BP_Button` (NIBP arm+cuff), `19_Handle`, `20_Labels`, `21_Shadows`,
`22_Highlights`.

> **The artwork geometry is now permanently locked.** React must **never
> redraw the artwork.** React only animates these layers via attributes/props:
> **LCD contents** (the separate `#LCD_Content` overlay — the LCD opening in the
> artwork is empty), **LEDs** (`16_LEDIndicators`), **Self-test window**
> (`17_SelfTestWindow`), **Buttons** (fill/glow state), **Knob rotation**
> (`13`/`14` transforms; the printed arcs `12` never rotate), **Softkey labels**
> (rendered in the LCD), and **Waveforms** (rendered in the LCD). No geometry,
> coordinate, viewBox, or path changes after this milestone.

Measurements and earlier alignment history remain in
[`visual-alignment-report.md`](visual-alignment-report.md).

## Running locally

```bash
npm install      # first time only
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

> **Note:** Node.js was not present on this machine, so a standalone Node v22
> runtime was installed at `~/.local/node-v22.14.0-darwin-arm64/`. If `node`
> isn't on your `PATH`, prefix it for this shell:
>
> ```bash
> export PATH="$HOME/.local/node-v22.14.0-darwin-arm64/bin:$PATH"
> ```
>
> Or install Node system-wide (e.g. via Homebrew or nvm) and remove the local
> copy.

## Deployment

The app is a fully static client-side build — `npm run build` emits `dist/`,
which can be served by any static host. No backend or database is required.

**Local use (two screens):**
1. `npm run build && npm run preview` (or `npm run dev`).
2. Open `/` (the launcher), create a session, and click **Open Facilitator**
   and **Open Learner** — drag each window to a separate screen/monitor.
3. Both windows carry the same `?session=` id and stay in sync.

**Static web hosting (any CDN / S3 / nginx):** serve `dist/` and configure a
**SPA fallback** so unknown paths return `index.html` (the app uses client-side
routing for `/learner`, `/facilitator`, `/report`). Examples:
- nginx: `try_files $uri /index.html;`
- Netlify: add `_redirects` with `/*  /index.html  200`.
- Vercel: a rewrite of `/(.*)` → `/index.html` (static framework preset).

**Netlify / Vercel:** point the project at this repo, build command
`npm run build`, publish/output directory `dist/`. Deploys at the domain root,
so no extra config beyond the SPA fallback above.

**GitHub Pages (project subpath, e.g. `/your-repo/`):** build with a matching
base so asset and link paths resolve under the subpath:

```bash
npm run build -- --base=/your-repo/
```

The router reads `import.meta.env.BASE_URL`, and learner/facilitator links are
built from it, so session links work under a subpath. For SPA deep links on
GitHub Pages, copy `dist/index.html` to `dist/404.html` (Pages serves `404.html`
for unknown routes). Run the learner on a separate device by sharing the copied
**learner link** (same session id) — it syncs via that device's own browser
storage only if on the same origin; for cross-device, both must point at the
same deployment and the same session id.

> Sync uses `BroadcastChannel` + `localStorage`, which are **per-browser/origin**.
> Two windows on the **same machine + browser** sync live. Cross-device live sync
> would need a small relay server (out of scope); the per-session URL scheme is
> already in place for when that is added.

## Testing & QA

```bash
npm run build     # production build (also acts as a route/compile check)
npm run smoke     # node logic smoke tests (scripts/smoke.mjs)
npm test          # build + smoke together
```

**Automated smoke tests** (`npm run smoke`) verify the browser-independent
logic: session-scope keying (shared by id, isolated across ids), default
session keys, scenario presets, the waveform library, and the JSON/CSV export
functions. They exit non-zero on failure (CI-friendly).

**Manual QA** — work through [`QA_CHECKLIST.md`](QA_CHECKLIST.md) in two windows
(facilitator + learner, same session) plus a second session for isolation tests.
It covers every device mode, alarms, scenarios, education/validation modes,
exports, the printable report, and error handling.

**Dev debug tools** (development build only):
- A **Debug (dev only)** panel on the facilitator: reset session, dump state,
  load the VF test scenario, simulate a shock / pacing capture / alarm.
- Console helper `window.__sim` — `dump()`, `reset()`, `loadScenario(id)`,
  `simulateShock()`, `simulatePacingCapture()`, `simulateAlarm()`, `get(key)`.

## Known limitations

- **Live sync is per-browser/origin.** `BroadcastChannel` + `localStorage` sync
  two windows on the same machine/browser. True cross-device live sync needs a
  relay server (not included); the per-session URL scheme is ready for it.
- If `BroadcastChannel` is unavailable, the app falls back to `localStorage`
  `storage`-event sync (same-origin tabs only).
- Waveforms and vital ranges are **illustrative for training**, not clinically
  exact.
- Corrupted or private-mode storage degrades gracefully (fresh state / recovery
  screen) but a session's history may be lost.

## Safety

Every view shows a fixed label: **“Training simulation only. Not for clinical
use.”** This is a teaching tool and must never be used for patient care.

## Next

The full, honest status of every area is in [`docs/ROADMAP.md`](docs/ROADMAP.md).
In short:

- **Already implemented and shipping:** Monitor / Defib / synchronized
  cardioversion / Pacer behavior, CPR feedback, alarms, eight facilitator
  scenarios, education/validation modes, event logging, and JSON/CSV/print
  exports.
- **Industrial Design Pass 1 — Body:** complete. **Body assets are locked and
  approved.**
- **Next milestone — Industrial Design Pass 2: Controls Library:** reconstruct
  the interactive controls (buttons, knobs, energy select, mode selector, pacer
  knobs, LEDs, self-test, NIBP) as approved modular parts. Not started.
- **Still partial:** waveform-library expansion (more rhythms + rate coupling),
  typography tokens, and automated testing/CI.

No remaining work may alter the locked device geometry — behavior and modular
reconstruction only.

## Notes

- The ECG/pleth/capnogram waveforms and vital ranges are **illustrative for
  training**, not clinically exact.
- Device geometry is **locked** — see "Device geometry is LOCKED" above and
  [`visual-alignment-report.md`](visual-alignment-report.md). Do not change
  visual geometry except in a deliberate, documented alignment pass.
