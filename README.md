# Moshly Time

A fullscreen clock web app with **5 modes** and **4 swappable skins**.

- **NOW** — current time `hh:mm:ss`
- **TIMER** — countdown from a duration `HH:mm:ss`
- **CHRONO** — stopwatch with milliseconds `HH:mm:ss.ms`
- **COUNTDOWN TO TIME** — counts down to the next occurrence of a wall-clock time `dd:hh:mm:ss`
- **NYE** — countdown to next January 1st, with a customisable "last seconds" fullscreen overlay (10–60 s)

**Skins:** Moshly · Coder · 8Bit · Solari (split-flap inspired)

Digits auto-scale to fill the viewport. In landscape, the UI auto-hides after a couple of seconds — tap to bring it back. No backend, no auth, no telemetry. State persists in `localStorage`.

---

## Stack

- React 19 + Create React App (via [`craco`](https://github.com/dilanx/craco) for the `@/` alias)
- `lucide-react` for icons
- Plain CSS variables for skinning

No backend is needed for the clock. A FastAPI scaffold lives under `backend/` from the original template; you can safely delete it.

---

## Run locally

```bash
cd frontend
yarn install         # or npm install
yarn start           # http://localhost:3000
```

Build for production:

```bash
yarn build           # outputs ./build
```

Host the `build/` directory on any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Nginx, …).

---

## Project layout (only what matters)

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js                       main shell + state
│   ├── index.js                     entry
│   ├── index.css                    skins (CSS variables) + layout + animations
│   ├── components/
│   │   └── FitText.jsx              auto-resizing big text
│   └── hooks/
│       └── useClockModes.js         useNow / useTimer / useChrono /
│                                    useCountdownToTime / useNYE / playBeep
├── package.json
├── craco.config.js
├── jsconfig.json
└── tailwind.config.js               (left over from template, harmless)
```

### Adding a new skin

1. Open `src/index.css`.
2. Add a new block `[data-skin="myskin"] { … }` with the CSS variables (see the existing four for the full list).
3. In `src/App.js`, add an entry to the `SKINS` array with a small preview object.

The skin becomes selectable from the settings sheet.

---

## Clean tree (post-clone)

This codebase has been stripped of the original Emergent runtime:

- `public/index.html` no longer loads the Emergent badge, PostHog, or main script.
- `craco.config.js` no longer wraps with `@emergentbase/visual-edits`.
- The frontend has no `axios` calls and does not need `REACT_APP_BACKEND_URL`.

After cloning you can remove the unused scaffold:

```bash
rm -rf backend tests scripts
```

---

## License

MIT — do whatever you want with it.
