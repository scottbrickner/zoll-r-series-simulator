# ZOLL R Series Simulator — Documentation

**Status:** Permanent project documentation — the project bible
**Last reviewed:** 2026-07-02

> **⚠️ Training simulation only. Not for clinical use.** This is a teaching tool.
> It is not a medical device and must never be used for patient care. Not
> affiliated with or endorsed by ZOLL Medical Corporation.

---

## Read this before making any change

**`/docs` is the authoritative source of intent for this project.** Every future
Claude Code session and every new contributor **must read `/docs` before making a
change** to code, artwork, or behavior. When the code and the docs disagree, treat
it as a defect to reconcile — not license to improvise.

Two rules override everything else:

1. **The device geometry is LOCKED.** React animates state on top of fixed
   artwork; it never redraws the artwork. See
   [ART_DIRECTION.md](ART_DIRECTION.md).
2. **Simulator behavior is illustrative, not clinical.** Nothing here is medical
   data. See [PROJECT_VISION.md](PROJECT_VISION.md).

---

## The documentation set

| Document | What it covers |
|----------|----------------|
| [PROJECT_VISION.md](PROJECT_VISION.md) | Purpose, audience, objectives, scope, simulation philosophy, the training-only disclaimer, and long-term goals. |
| [ROADMAP.md](ROADMAP.md) | Every milestone — implemented, partial, and planned — including the Industrial Design passes. The single place to see where the project stands. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | React architecture: roles, the state/scenario/waveform/report engines, cross-window sync, and data flow. |
| [SIMULATOR_REQUIREMENTS.md](SIMULATOR_REQUIREMENTS.md) | Complete functional specification of simulator behavior (monitoring, defib, sync, pacer, CPR, alarms, scenarios, modes, logging, reports). |
| [ART_DIRECTION.md](ART_DIRECTION.md) | Binding art-direction rules **and** the approved visual language + palette. Governs every change to the device's appearance. |
| [COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md) | Inventory of every SVG asset and rendering component, the SVG structural standards, and the modular part taxonomy — with filenames. |
| [DECISIONS.md](DECISIONS.md) | The decision log: the key architectural and design decisions, why they were made, and their consequences. |
| [CHANGELOG.md](CHANGELOG.md) | Dated history of what has actually shipped. |

Supporting material at the repo root: [`../README.md`](../README.md) (developer
orientation, running, deployment), [`../QA_CHECKLIST.md`](../QA_CHECKLIST.md)
(manual QA), and [`../visual-alignment-report.md`](../visual-alignment-report.md)
(frozen geometry measurements).

---

## Where the project stands (2026-07-02)

Feature development is **paused** to keep this documentation authoritative.

- **Implemented and shipping:** the two-window simulator (launcher, learner,
  facilitator, report), cross-window per-session sync, Monitor / Defib /
  synchronized-cardioversion / Pacer behavior, CPR feedback, alarms, eight
  facilitator scenarios, education/validation modes, event logging, and
  JSON/CSV/print exports. The device is rendered from the **locked master SVG**.
- **Industrial Design Pass 1 — Body: COMPLETE.** The body/chassis has been
  reconstructed as approved modular SVG parts. **Body assets are locked and
  approved.**
- **Next milestone — Industrial Design Pass 2: Controls Library.** Reconstruct
  the interactive controls (buttons, knobs, energy select, mode selector, pacer
  knobs, LEDs, self-test, NIBP) as approved modular parts. **Not yet started.**

See [ROADMAP.md](ROADMAP.md) for the full, honest status of every area — including
what is only partial or planned. Nothing planned is documented here as done.
