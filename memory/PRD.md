# Big Clock — PRD

## Problem Statement (original, PT)
> Quero uma app que seja um display big clock. Quando deitamos o telefone fica o clock a ocupar todo o ecrã.
> Modos: NOW (hh:mm:ss), TIMER (HH:mm:ss), CHRONO (HH:mm:ss.ms), COUNTDOWN TO TIME (input HH:MM → dd:hh:mm:ss),
> NYE COUNTDOWN (dd:hh:mm:ss + last seconds fullscreen 10–60s customizável).
> Skins: Moshly (emptytown/Moshly-Site-Design-Tokens), Coder black/green, 8Bit B&W, one of my creation.
> UI deve ocupar o mínimo, sem auth, sem dependências Emergent — quero criar repo fora daqui.

## Architecture
- **Frontend-only** React app (CRA + craco, alias `@/` → `src/`)
- **No backend / no auth / no telemetry**
- **localStorage** for persistence (skin, mode, timer duration, countdown target, NYE threshold, sound)
- **Audio** via Web Audio API (no external assets)
- **Auto-resize digits** via ResizeObserver + dynamic font-size (`FitText`)

## File layout
```
/app/
├── README.md                    portable run/deploy instructions
└── frontend/
    ├── public/index.html        no Emergent scripts, no badge, no PostHog
    ├── craco.config.js          cleaned (no visual-edits)
    ├── package.json             axios + @emergentbase/visual-edits removed
    └── src/
        ├── App.js               main shell, state, dock, settings sheet
        ├── App.css              (empty)
        ├── index.css            skin variables, layout, animations
        ├── index.js             entry
        ├── components/
        │   └── FitText.jsx      auto-resizing big text
        └── hooks/
            └── useClockModes.js useNow / useTimer / useChrono /
                                 useCountdownToTime / useNYE / playBeep
```

## Skins (CSS variables on `[data-skin="…"]`)
| Skin    | Bg            | Fg            | Font                     |
|---------|--------------|--------------|--------------------------|
| moshly  | #0E0F14       | gradient text | Inter 900                |
| coder   | #000000       | #00FF66 glow  | Share Tech Mono          |
| 8bit    | #000000       | #FFFFFF       | Press Start 2P           |
| solari  | #15110D warm  | #F4D58D       | Anton (split-flap line)  |

## Implemented
### v0.1 (2026-05-27)
- 5 modes (NOW / TIMER / CHRONO / COUNTDOWN / NYE)
- 4 skins, skin picker pills on bottom bar
- Auto-resize big digits, controls auto-hide in landscape
- Sound on timer/countdown finish, fullscreen API, NYE last-seconds overlay (10–60s)

### v0.2 (2026-05-27) — UI redesign + Emergent cleanup
- **UI redesign**: bottom dock is now minimal (mode tabs centered with text+underline style, no pills; right side only transport-when-relevant + fullscreen + hide-UI + settings cog)
- **Settings sheet** (right side, slide-in): skin cards with per-skin preview, sound toggle, NYE threshold slider
- **Setup drawer** (timer H/M/S, countdown target, NYE threshold) opens above the dock when mode needs it
- **Removed all Emergent dependencies**:
  - `public/index.html`: no badge, no PostHog, no `emergent-main.js`, no error-event handler
  - `craco.config.js`: no `@emergentbase/visual-edits/craco` wrapper
  - `package.json`: removed `axios` and `@emergentbase/visual-edits`
- **README** rewritten for standalone use, build, deploy, skin extension

## Backlog / Future
- P1 — COUNTDOWN with date + time (not only HH:MM)
- P1 — Lap times on CHRONO
- P2 — NYE with custom target date (not only Jan 1)
- P2 — Wake Lock to keep screen on
- P2 — PWA (manifest + service worker) for installable offline use
- P2 — Share URLs (`/timer/00:05:00?skin=solari`)

## Notes for taking the repo outside Emergent
- Inside Emergent UI: use the **"Save to GitHub"** button (chat input) to create a repo and push.
- Locally: `cd frontend && yarn install && yarn start`
- Builds with `yarn build` → static `build/` directory, deploy on Vercel/Netlify/Cloudflare Pages/GitHub Pages/etc.
- `backend/` folder is unused by the clock and can be deleted.
