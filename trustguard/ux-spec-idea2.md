# TrustGuard — UX Spec · Idea 2: Forward-to-Check

> Page 2 of 5. Zero-effort intake for calm cases. LOCKED 2026-09-24 after an
> 8-doubt challenge. Rebuilt to the full interactive spec 2026-09-24 (commit TBD).

## The idea in one line

"A case, not a file." Any suspicious message can be forwarded to TrustGuard like
forwarding a message to a friend. The entire forwarded bundle immediately becomes
ONE investigation case — never analyzed piece-by-piece.

## Demo journey (60–90 seconds)

Simulated WhatsApp-style family group → suspicious message arrives → long-press
→ context menu (Reply / Forward / Copy / More) → Forward screen (bundle checklist
+ TrustGuard contact) → Send to TrustGuard → "Received — analyzing your
forward…" → CASE #2841 created → 6-stage analysis pipeline → identity context →
claims → evidence relationships → evidence graph → HIGH RISK verdict card →
independent verification → forward the assessment back to the family group
("defense propagates at the speed of the attack").

## The three demo states

A subtle Demo control switches scenarios and resets:

1. **Aadhaar order → HIGH RISK.** "GOVERNMENT ORDER: Link Aadhaar to all bank
   accounts by Friday or accounts will be frozen." Message + PDF + shortened
   link + unknown sender. Verdict explains 3 key relationships, "Assessment, not
   proof.", next safest action, case ID + timestamp.
2. **Job message → NEEDS VERIFICATION.** "The available evidence is not enough
   to settle this case." + "One check would settle the main uncertainty." +
   exactly ONE independent verification action. Simulated verification resolves
   the unknown relationship to SUPPORT and the band recomputes to LOW CONCERN.
3. **College event reminder → LOW CONCERN.** "No significant conflicts found."
   "No action needed." Calm green, no frightening red.

## Locked rules (unchanged)

- Four identities structurally separate: Forwarded by (KNOWN), Original sender
  (UNKNOWN when unavailable, never guessed), Claimed identity (CLAIM),
  Verified identity (NOT ESTABLISHED). Never convert a claim into a verified
  identity.
- Two-beat reply: instant acknowledgment, then the assessment — or an honest
  "needs verification". No "verdict in seconds" promise.
- Every verdict card is redistribution-safe: band, reasons, "Assessment, not
  proof.", one independent verification step, case ID + timestamp.
- Relationship model: CONFLICT / ANOMALY / UNKNOWN / SUPPORT. SUPPORT only
  when real supporting evidence exists. Every relationship opens an evidence
  drawer: Claim A, Claim B, check performed, result, confidence, uncertainty,
  source.
- Verification: TrustGuard never recommends verifying via the contact or link
  in the suspicious message. "Mark verification complete" simulates the result
  (clearly labeled) and the case state recomputes.
- No numeric scam scores, no "100% scam", no "AI says fake".
- Privacy: "Nothing is analyzed until you forward it to TrustGuard." No false
  local-processing claims.
- Prototype seam: "The prototype simulates the messaging interface; the
  TrustGuard case engine is the core product."

## Data flow

FORWARD → CASE CREATED → EVIDENCE BUNDLE → CLAIMS → IDENTITIES →
RELATIONSHIPS → RISK INTERPRETATION → VERIFICATION LOOP → DECISION-SAFE OUTPUT

## Implementation notes

- `src/forward/ForwardCheck.jsx` — screen state machine
  (family → forward → sending → tg), drawers, interactive SVG graph.
- `src/forward/scenarios.js` — scenario data + relationship/graph definitions.
  Bands are relationship-pattern rules, not scores.
- Reuses: shared `PageHead` + `shell.css` phone frame, backend
  `POST /api/guardian/cases` (`kind: 'forward'`), localStorage stats.
- Idea 1 untouched. Ideas 3–5 not started.
