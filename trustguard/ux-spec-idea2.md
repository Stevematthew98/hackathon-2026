# TrustGuard — UX Spec · Idea 2: Forward-to-Check

> Page 2 of 5. Zero-effort intake for calm cases. LOCKED 2026-09-24 after an 8-doubt challenge.

## The idea in one line

When something feels off but there's no panic, the user forwards the suspicious
message to TrustGuard the way they'd forward it to a friend. **Zero typing, zero
forms, zero learning curve** — for anyone under uncertainty.

## Non-negotiables (from the lock)

1. **One bundle = one case, immediately.** The forwarded content becomes a single
   case the moment it arrives. It is never analyzed piece-by-piece.
2. **Four identities, structurally separate.** Forwarded-by (known: the user),
   original sender (captured if provided, marked *unknown* when not, never
   guessed), claimed identity (labeled as a claim), verified identity (established
   only later — shows "Not established" here).
3. **Two-beat reply.** Beat 1: instant acknowledgment ("Got it.") with no time
   promise. Beat 2: the assessment when ready — or an honest "needs
   verification". The "verdict in seconds" promise was deliberately dropped.
4. **Every verdict card is redistribution-safe.** It carries: the band, the
   reasons, the line "Assessment, not proof.", one independent verification
   step, and a case ID with timestamp — so it stays truthful even when forwarded
   onward without context.
5. **One engine, eight families.** The prototype proves the engine on three
   demo forwards (fake government order, deepfake KYC video, harmless bank
   alert); the classifier covers eight scam families.
6. **Harmless forwards get a calm LOW CONCERN reply.** No alarm where there is
   no signal.
7. **No elderly-specific framing.** The rationale is "zero-learning-curve
   interaction for anyone under uncertainty".

## Bands (rule-based, never scores)

- 3+ signals → **HIGH RISK**
- 1–2 signals → **NEEDS REVIEW**
- 0 signals → **LOW CONCERN**

Family classification is keyword-scoring over the bundle text; a family is named
only with ≥2 keyword hits (one incidental word is not a pattern).

## Prototype scope

- Forwarding is **simulated** with three demo bundles (`src/forward/forwards.js`).
- Chat UI simulates the real forward-to-a-contact interaction.
- Cases POST to the same backend case store (`/api/guardian/cases`, `kind: 'forward'`).
- Ideas 3–5 stay off this page: no evidence graph, no verification loop, no
  police-report export. The verdict card is an assessment card, not the
  decision-safe output of Idea 5.
