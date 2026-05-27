# Big Clock — PRD

## Problem Statement (original)
> Quero uma app que seja um display big clock. Quando deitamos o telefone fica o clock a ocupar todo o ecrã. Deve ter alguns modos:
> - NOW — hh:mm:ss
> - TIMER — HH:mm:ss
> - CHRONO — Hh:mm:ss:ms
> - COUNTDOWN TO TIME — input a real time (e.g. 23:30), counts down → dd:hh:mm:ss
> - NYE COUNTDOWN — dd:hh:mm:ss, with option to show last seconds full-screen
>
> Skin chooser: Moshly (from emptytown/moshly-site-design-tokens), Coder black/green, 8Bit B&W, and one of my own creation.
> UI should take the least possible space from the clock, but can have controls when in landscape.
> Last seconds (NYE) customisable from 60 to 10.

## Architecture
- **Frontend-only** React app (CRA + craco)
- **No backend persistence** — all state in `localStorage`
- **Audio** via Web Audio API (no external assets)
- **Auto-resize** of digits via `ResizeObserver` + dynamic font-size measurement (`FitText` component)
- **Orientation handling** via `matchMedia` + auto-hide of controls after 2.5s in landscape

## File layout
```
/app/frontend/src/
├── App.js                        main shell, state, controls, drawers
├── App.css                       (empty — all styles in index.css)
├── index.css                     skin variables, layout, animations
├── index.js                      entry
├── components/
│   └── FitText.jsx               auto-sizing big text
└── hooks/
    └── useClockModes.js          useNow, useTimer, useChrono,
                                  useCountdownToTime, useNYE, playBeep
```

## Skins
| Skin    | Bg            | Fg            | Font                     |
|---------|--------------|--------------|--------------------------|
| moshly  | #0E0F14       | gradient text | Inter 900                |
| coder   | #000000       | #00FF66 glow  | Share Tech Mono          |
| 8bit    | #000000       | #FFFFFF       | Press Start 2P           |
| solari  | #15110D warm  | #F4D58D       | Anton (split-flap line)  |

## Implemented (2026-05-27)
- [x] 5 modes (NOW / TIMER / CHRONO / COUNTDOWN / NYE) with correct formats
- [x] 4 skins with persistent selection
- [x] Auto-resize big digits to fill screen (FitText)
- [x] Compact bottom control bar (mode tabs + skin chips + transport + sound + fullscreen + hide UI)
- [x] Setup drawer for TIMER (H/M/S inputs), COUNTDOWN (time input), NYE (10–60s slider)
- [x] localStorage persistence: skin, mode, timer duration, countdown target, NYE threshold, sound
- [x] Auto-hide controls in landscape after 2.5s inactivity (tap or key to restore)
- [x] Sound on TIMER finish and COUNTDOWN/NYE zero — toggleable
- [x] NYE last-seconds full-screen overlay (single big SS) when remaining ≤ threshold
- [x] Web Fullscreen API toggle button
- [x] All interactive elements have `data-testid`

## Backlog / Future
- P1 — Custom date input for COUNTDOWN TO TIME (currently picks next occurrence of HH:MM today/tomorrow)
- P1 — Lap times on CHRONO
- P2 — Custom NYE target (any date, not only Jan 1)
- P2 — Wake Lock API to keep screen on
- P2 — PWA install + offline
- P2 — Share / preset URLs (e.g. /timer/00:05:00)

## Notes
- No backend changes made — `/api/*` endpoints untouched
- No third-party integrations / no auth / no DB
