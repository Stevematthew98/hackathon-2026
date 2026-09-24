# TrustGuard — Page 1: The Case Builds Itself

Prototype page for the hackathon. A simulated incoming scam call is checked live by a
rule-based signal engine; 4+ signals trip the wire and auto-build a case.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build it

```bash
npm run build
```

## Backend (optional)

The page auto-saves built cases to the TrustGuard backend. Locally it falls back to
"Saved on this device" if no backend URL is set. To wire the live backend, create a
`.env` file in this folder:

```
VITE_API_URL=https://hackathon-2026-backend-production.up.railway.app
```

Then restart `npm run dev`.

## What's inside

- `src/guardian/Guardian.jsx` — the whole page (idle / incoming / live / case / discarded)
- `src/guardian/signalEngine.js` — the real rule-based signal engine (regex patterns, tripwire at 4/5)
- `src/guardian/callScript.js` — the simulated scam-call transcript with timings
- `src/guardian/Guardian.css` — all styling
- `src/App.jsx` — mounts the Guardian page

## Demo flow

Idle → "Simulate incoming scam call" → Answer → watch signals fire and the engine
trace → tripwire at the 4th signal (case is created instantly, before any tap) →
"Tap to check" → case tabs: Overview / Signals / Transcript / Data.

No verdicts, no scores — the tripwire only starts an investigation.
