# PROJECT VISION

**Project:** ZOLL R Series Simulator
**Status:** Permanent project documentation — the project bible
**Last reviewed:** 2026-07-02

> **Read this first.** This document, and everything in `/docs`, is the
> authoritative source of intent for the project. Future Claude Code sessions and
> new contributors must read `/docs` before making changes. When the code and the
> docs disagree, treat it as a defect to reconcile — not license to improvise.

---

## Purpose

The ZOLL R Series Simulator is a **browser-based, offline training tool** that
faithfully reconstructs the front panel and operating behavior of the ZOLL
R Series monitor/defibrillator for **resuscitation and code-team education**.

It exists so instructors can run realistic, hands-on device scenarios — rhythm
recognition, defibrillation, synchronized cardioversion, transcutaneous pacing,
CPR feedback, and monitoring — **without needing the physical device**, on any
machine with a modern browser, with no server, account, or network dependency.

The device face is not a generic "medical monitor." It is a proportion-matched,
industrial reconstruction of a specific instrument so the muscle memory a learner
builds here transfers to the real hardware.

## Audience

- **Learners** — nursing, EMS, medical, and code-team trainees who operate the
  simulated device through the **Learner** view (the device screen) exactly as
  they would touch the real panel.
- **Facilitators / Instructors** — educators who drive scenarios, set rhythms and
  vitals, control the device, score performance, and debrief through the
  **Facilitator** console.
- **Course / simulation-lab coordinators** — who deploy the tool to classrooms,
  skills stations, or a static web host and manage sessions.
- **Contributors** — engineers and designers extending the simulator, who must
  honor the locked artwork and the art-direction rules in this documentation set.

## Objectives

1. **Fidelity of appearance** — reproduce the R Series front panel accurately
   enough that controls, layout, and readouts match the real device.
2. **Fidelity of behavior** — model defib charge/shock sequencing, sync
   cardioversion, pacing capture/non-capture, CPR quality, monitoring, and alarms
   with training-appropriate realism.
3. **Two-role, single-device teaching** — a facilitator window and a learner
   window on the same machine, kept in live sync, so one instructor can run a
   station with no infrastructure.
4. **Independent, concurrent sessions** — multiple instructors run isolated
   sessions on one deployment without cross-talk.
5. **Assessable outcomes** — education mode for teaching, validation mode for
   scoring, a timestamped event log, and exportable JSON/CSV plus a printable
   report for debrief and records.
6. **Zero-friction deployment** — a fully static build that runs from any CDN,
   file host, or locally, with no backend.

## Scope

**In scope**

- The R Series **front-panel device** (locked master artwork) and its live LCD.
- Device **operating modes**: Monitor, Defib (incl. synchronized cardioversion),
  Pacer.
- **CPR feedback**, **alarms**, **lead/pad connection** states, and a library of
  training rhythms and waveforms.
- **Facilitator-driven scenarios**, education/validation modes, event logging,
  reports, and exports.
- **Client-side, per-session synchronization** between two windows on one origin.
- **Industrial reconstruction of the device in approved modular passes** — see
  the "Industrial design direction" section below.

**Out of scope (by design)**

- Clinical use of any kind — see the disclaimer below.
- Cross-device live sync over a network (the per-session URL scheme is prepared
  for a future relay server, but no backend ships).
- Redesigning, modernizing, or restyling the device beyond the locked reference —
  see [`ART_DIRECTION.md`](ART_DIRECTION.md).
- Clinically exact waveforms, energies, or vital-sign physiology beyond what is
  useful and safe for training.

## Simulation philosophy

- **Illustrative, not diagnostic.** Waveforms, vital ranges, and energies are
  chosen to *teach* recognition and workflow, not to be clinically exact
  reference data. They must never be presented as clinical truth.
- **Faithful reconstruction, not reinterpretation.** The device is rebuilt to
  match manufacturer reference material. We reconstruct; we do not design.
- **Facilitator-authoritative.** The instructor is the source of truth for the
  scenario. The simulator models the device honestly and lets the facilitator
  drive the patient. Automatic behaviors (auto-convert, capture, alarms) exist to
  reduce instructor burden, never to override instructor intent.
- **Deterministic and inspectable.** Every meaningful action is logged with a
  timestamp and context so a session can be reviewed, exported, and reproduced.
- **Graceful degradation.** Missing storage, private mode, corrupt state, or an
  absent `BroadcastChannel` degrade to a safe fresh state or a recovery screen —
  never a crash mid-session.

## Industrial design direction

The device appearance is being rebuilt from a single locked monolithic master
into an approved **modular SVG library**, one deliberate **Industrial Design
Pass** at a time. This lets the artwork be reviewed and frozen part-by-part
instead of as an ever-edited monolith. Two rules never change across passes: the
**geometry stays locked** to the manufacturer reference, and **React only
animates state** — it never redraws artwork.

- **Pass 1 — Body: complete.** The housing/chassis (bumper, faceplate, screen
  bezels, LCD frame/glass, lower cradle, connector bump, screw covers) has been
  reconstructed as modular parts and reviewed. **These body assets are locked and
  approved.**
- **Pass 2 — Controls Library: the next milestone (not started).** Reconstruct
  the interactive controls — softkeys, function/therapy buttons, energy select,
  mode selector, pacer knobs, LED indicators, self-test window, and NIBP button —
  as approved, reusable modular parts.

See [`ROADMAP.md`](ROADMAP.md) for pass status and
[`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md) for the part taxonomy.

## Training-only disclaimer

> **This is a training simulation only. It is NOT for clinical use.**
>
> The ZOLL R Series Simulator must never be used to guide, inform, or substitute
> for the care of a real patient. Its rhythms, vital signs, energies, and device
> responses are illustrative teaching approximations, not medical data. It is not
> a medical device, is not FDA/CE cleared, and carries no warranty of clinical
> accuracy. Every view displays a fixed label — **"Training simulation only. Not
> for clinical use."** — and that label must remain present in every user-facing
> screen. This project is **not affiliated with or endorsed by ZOLL Medical
> Corporation**; "ZOLL" and "R Series" are used only to identify the device being
> simulated for education.

## Long-term goals

- **Complete the modular SVG asset library** — finish the part-by-part
  reconstruction after Pass 2 (Controls), then LCD/icons/labels groups, as
  described in [`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md).
- **Broader waveform and rhythm library** — more rhythms, artifacts, blocks, and
  rate-coupled traces for richer recognition training.
- **Deeper scenario engine** — scripted, timed, branching scenarios with a
  scenario timeline the facilitator can start/pause/reset.
- **Cross-device live sync** — an optional small relay server so learner and
  facilitator can run on separate devices (the per-session URL scheme already
  anticipates this).
- **Assessment and analytics** — richer validation scoring, rubric alignment, and
  aggregate reporting for courses.
- **Release-candidate hardening** — the roadmap's final milestone: a stable,
  documented, QA'd 1.0 suitable for classroom adoption.

See [`ROADMAP.md`](ROADMAP.md) for milestone status and
[`SIMULATOR_REQUIREMENTS.md`](SIMULATOR_REQUIREMENTS.md) for the functional spec.
