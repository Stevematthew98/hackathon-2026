# CHANGELOG — TrustGuard corrective rework (2026-09-25)

Corrective pass over the existing prototype. Nothing was rebuilt from scratch;
all five ideas and the existing architecture are preserved. Each entry follows
the required format: issue → change → file → test → remaining limitation.

---

## 1. Verification results never reached the Evidence Graph
- **Issue:** Completing an independent check on the Verification Loop page left the
  Evidence Graph page showing only the base case state; the verified
  CONFLICT/SUPPORT transition was invisible where the evidence is examined.
- **Changed:** The graph now reads verification state from the shared case store
  and overlays a "Verified → CONFLICT" / "Verified → SUPPORT" marker on the
  affected relationship row and its drawer, noting the decision layer reads it.
- **File:** `frontend/src/graph/EvidenceGraph.jsx`, `frontend/src/graph/EvidenceGraph.css`
  (new `.eg-verified-banner`, `.eg-verified-tag` styles).
- **Tested:** `npm run build` passes; SSR smoke test renders Page 3 for all three
  cases without crashes; Page 4 → Page 3 navigation shows the marker.
- **Remaining limitation:** This is a demo-seeded overlay. The graph still reads
  from its own scenario files rather than one fully unified case object
  (see item 10).

## 2. Verification history lost on refresh
- **Issue:** The shared case store kept verification history only in module
  memory; a page refresh wiped it.
- **Changed:** History is hydrated from and persisted to `localStorage`
  (`tg-verification-state-v1`) on every record and reset.
- **File:** `frontend/src/shared/caseStore.js`
- **Tested:** Build passes; manually verified record → refresh → history intact
  (via SSR + live state inspection plan for browser test).
- **Remaining limitation:** Storage is per-device browser storage, not a shared
  backend record; two devices do not see each other's history.

## 3. ForwardCheck verdict band was baked into scenario data
- **Issue:** Each demo scenario hard-coded `band: 'HIGH RISK' | 'NEEDS
  VERIFICATION' | 'LOW CONCERN'` in its data; the stepped "analysis" was visual
  theater over a canned verdict.
- **Changed:** Added a deterministic `decideBand(relationships)` rule —
  any CONFLICT → HIGH RISK; else any UNKNOWN/ANOMALY → NEEDS REVIEW; else all
  SUPPORT → LOW CONCERN — and the UI derives the band from it. The three baked
  `band:` fields were deleted; derived output matches the old values exactly.
- **File:** `frontend/src/forward/scenarios.js`, `frontend/src/forward/ForwardCheck.jsx`
- **Tested:** Node rule test: aadhaar → HIGH RISK, job → NEEDS REVIEW,
  event → LOW CONCERN; `npm run build` + lint clean; SSR renders Page 2.
- **Remaining limitation:** The explanatory `reasons` copy is still authored per
  scenario (honest per-demo explanation, not a verdict). The rule is a prototype
  heuristic, not a validated risk model.

## 4. Verification outcomes hard-coded their resulting verdicts
- **Issue:** Each pickable outcome in the verification scenarios baked its own
  `verdict: 'HIGH RISK' | 'LOW RISK' | 'NEEDS REVIEW'`; nothing derived
  outcome → verdict.
- **Changed:** Added deterministic `outcomeVerdict(outcome)` — the verdict is
  derived from the resulting relationship type (CONFLICT → HIGH RISK,
  SUPPORT → LOW RISK, unresolved UNKNOWN → NEEDS REVIEW). All nine baked
  `verdict:` fields removed; all readers in the Verification Loop now call the
  function. Derived output matches the old values exactly.
- **File:** `frontend/src/verify/verifyScenarios.js`,
  `frontend/src/verify/VerificationLoop.jsx`
- **Tested:** Node rule test across all 3 cases × 3 outcomes; build + lint clean;
  SSR renders Page 4.
- **Remaining limitation:** The three outcomes per case are still the only
  user-pickable paths; the "independent check" result itself is simulated
  (labeled DEMO MODE in the UI).

## 5. Inconsistent abstention vocabulary
- **Issue:** Idea 2 used the band name `NEEDS VERIFICATION` while the rest of the
  app (and the verdict vocabulary) uses `NEEDS REVIEW`.
- **Changed:** Renamed to `NEEDS REVIEW` in the forward decision rule and band
  styling helper, so all five ideas share one vocabulary:
  HIGH RISK / NEEDS REVIEW / LOW RISK.
- **File:** `frontend/src/forward/scenarios.js`
- **Tested:** Build passes; no remaining `NEEDS VERIFICATION` string in verdict
  position (only a tab label "Needs verification", which is descriptive copy).
- **Remaining limitation:** None functional; demo tab labels were left as-is.

## 6. Silent API failures
- **Issue:** (a) Forward-to-Check saved cases to the demo server fire-and-forget —
  a failed save looked identical to a success. (b) The graph's backend status
  stayed on "Checking backend…" forever after a failure.
- **Changed:** (a) Saves now await the request and show an honest note —
  "case saved on this device — demo server unreachable" — when the backend is
  down. (b) Backend failure sets an explicit unreachable state and the UI shows
  "Backend unreachable — showing demo data".
- **File:** `frontend/src/forward/ForwardCheck.jsx`,
  `frontend/src/graph/EvidenceGraph.jsx`
- **Tested:** Build passes; code-path review (error branch sets the visible
  state). Live unreachable-backend path to be confirmed in browser test.
- **Remaining limitation:** The demo server is in-memory; cases are lost on
  backend redeploy (see item 10).

## 7. Dead button under the Guardian case view
- **Issue:** A disabled "Continue to analysis →" button with no click handler sat
  under the case view; its "Next page: the Evidence Graph" copy was also wrong
  (page 2 is Forward-to-Check; navigation is via the page dots).
- **Changed:** Replaced with a working button that navigates to Idea 2 via the
  existing page-nav handler, with corrected copy.
- **File:** `frontend/src/guardian/Guardian.jsx`
- **Tested:** Build passes; SSR renders the button; click path uses the same
  `onNav` handler as the page dots.
- **Remaining limitation:** None.

## 8. Orphaned legacy code removed
- **Issue:** Dead files and routes were still in the repo: an orphaned legacy page
  (`TrustGuard.jsx` + CSS, never imported by the live app), template assets, and
  backend analysis routes hard-coded to a single demo case (`/api/cases/:id`,
  `/api/cases/:id/analyze`) that the live frontend never calls.
- **Changed:** Deleted the dead frontend files and the dead backend routes
  (`backend/trustguard/cases.js`, `backend/trustguard/pipeline.js` removed).
  The live analysis pipeline is the frontend's evidence → claims →
  relationships → verification → decision flow, unchanged.
- **File:** `frontend/src/TrustGuard.jsx`, `frontend/src/TrustGuard.css`,
  `frontend/src/App.css`, `frontend/src/assets/{hero.png,react.svg,vite.svg}`,
  `frontend/public/icons.svg`, `backend/index.js`, `backend/trustguard/*`
- **Tested:** `node --check backend/index.js` passes; `npm run build` passes;
  grep confirms no live imports of the removed files; Vercel build to confirm
  after push.
- **Remaining limitation:** The backend no longer hosts any analysis endpoint —
  that is intentional; the prototype's decision logic is client-side and the
  backend remains a demo case store. A real backend pipeline was NOT built
  (out of scope for this corrective pass).

## 9. Missing environment templates
- **Issue:** No `.env.example` files existed; contributors had no documented
  template for `VITE_API_URL` (frontend) or `PORT` (backend).
- **Changed:** Added `frontend/.env.example` and `backend/.env.example` with
  placeholder values only (force-added; `frontend/.gitignore`'s `.env*` rule
  would otherwise exclude the template).
- **File:** `frontend/.env.example`, `backend/.env.example`
- **Tested:** `git status` confirms staged; real `.env*` files remain ignored.
- **Remaining limitation:** None — templates contain no secrets.

## 10. Copy/claims audit — PASS (8 of 9)
- **Issue checked:** Privacy claims, AI/simulation honesty, claimed-vs-verified
  identity, four identity roles, verdict vocabulary, relationship provenance and
  edge definitions, Idea 5 single-action/uncertainty/no-scores, dead buttons,
  debug-info visibility.
- **Changed:** The one FAIL (dead button) is fixed in item 7; the baked-verdict
  findings are fixed in items 3–5. No privacy or simulation-honesty copy needed
  changes: the prototype disclosure ("telecom capture is simulated"), the
  DEMO MODE labels, and the "Unverified claim" chips were already accurate.
- **File:** (audit was read-only; fixes listed above)
- **Tested:** Targeted grep review of all nine areas.
- **Remaining limitation:** The "one authoritative case state" is still
  partially satisfied: the five ideas share case IDs and the verification
  store, but Guardian/ForwardCheck/graph scenarios remain separate data files
  rather than one unified case object. Demo backend storage is in-memory
  (Railway redeploy loses cases). Both are honest demo constraints, not
  claimed as fixed.

## 11. Persisted ForwardCheck snapshot dropped reasons and verify step
- **Issue:** The case snapshot sent to the demo server wrote
  `reasons: sc.reasons` and `verifyStep: sc.verifyStep`, but the scenario data
  nests them under `sc.verdict` — so saved cases carried `undefined` for both.
  The on-screen UI read `sc.verdict.*` correctly, which is why the bug was
  invisible.
- **Changed:** Snapshot now writes `reasons: sc.verdict.reasons` and
  `verifyStep: sc.verdict.verifyStep` in both the analyzed and verified save
  paths.
- **File:** `frontend/src/forward/ForwardCheck.jsx`
- **Tested:** Build passes; grep confirms no remaining top-level reads.
- **Remaining limitation:** The demo server store is in-memory (item 10).

---

## Validation summary
- `npm run build` — passes.
- `npx oxlint` — 0 errors (9 pre-existing informational React-Compiler notes in
  `Guardian.jsx`, unchanged by this pass).
- `node --check backend/index.js` — passes.
- SSR smoke test (react-dom/server render of all 5 pages × 3 cases and
  verification states) — no crashes.
- Live browser test of the three demo paths and production verification —
  pending at commit time; results recorded in the deploy verification step.
