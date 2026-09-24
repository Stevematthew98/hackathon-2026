# UX Specification — Idea 1: The Case Builds Itself (Page 1)
Status: SPEC (not built). Covers the LIVE INCOMING CALL experience only.
Constraints: no numeric scores, no "genuine/fake/scam" verdict language, no Ideas 2–5.

## Design context
The user is frightened, confused, under time pressure, and mid-call. The phone may be
at their ear; screen glances are brief. Core principle: **calm vigilance** — the system
works hard, the user does almost nothing. Zero typing required anywhere on this page.

## Flow (four states, one page)

### State A — Incoming call (simulated in prototype)
- Standard incoming-call UI: unknown number, Answer / Decline.
- Small TrustGuard pill at top: "TrustGuard is on — this call will be checked."
- Nothing to configure; permission was granted once, earlier.

### State B — Live call, monitoring
- Normal call screen (timer, mute, speaker, end-call).
- Persistent quiet indicator: "Checking this call…" with a soft pulsing dot.
  Neutral blue/grey. Never red. Never the word "scam".
- Signal tracker: five labeled slots —
  Unknown number / Authority claim / Threat language / Urgency / Demand.
  Empty = grey outline. Fired = filled amber + timestamp. Tap a fired slot to see
  the exact triggering phrase.
- Signals appear SILENTLY: no sound, no vibration per signal. The user is talking;
  any interruption could alert the scammer or spike panic.
- One-line privacy note: "Only this call is being checked. Nothing is captured
  between calls."

### State C — Tripwire fires (4th signal)
- ONE gentle haptic tap. No alarm sound, no siren, no red flash.
- Calm bottom sheet slides up (300ms ease-out) OVER the call screen.
  Call controls stay reachable; the call is never interrupted.
- Copy (exact):
  - Headline: "Suspicious pattern detected"
  - Subline: "We've saved everything so far. Check when you're ready — or keep listening."
  - Microcopy: "This is not a verdict. It's the start of a check."
- Buttons: primary "View case" · secondary "Not now" (dismisses; case stays saved;
  card reappears as a notification after the call ends).
- Accent color: amber (investigation). Never red.

### State D — The Case (auto-built)
Reached via "View case", or after the call ends through the persistent notification.
1. Header: "Case #1042" + date/time + duration + status chip "Under review" (amber).
2. Call audio: player with scrubber. NEVER autoplayed.
3. Transcript: collapsed by default ("Show transcript"); speaker-labeled with timestamps.
4. Phone number: masked by default (+91 98•••••21), tap to reveal.
5. Claimed identity card: "Caller claimed to be: Inspector Ravi Kumar, Cyber Crime
   Branch" with a visible "UNVERIFIED CLAIM" chip. Never stated as fact.
6. Signals that fired: list of 4–5, each with triggering quote + timestamp.
   E.g. "Authority claim — 'I am Inspector Ravi Kumar from Cyber Crime Branch' (0:42)".
7. Transparency box: "Captured in this case: audio, transcript, number, time.
   Nothing else. Deleting the case removes everything."
8. Actions: "Delete case" (with confirm) · "Continue to analysis →"
   (placeholder to Idea 3 in this phase).
9. Footer line (persistent): "No verdict yet — analysis continues."

## What the user must NOT see on this page
- No verdict, no band, no score, no percentage.
- No "scam / fake / genuine / fraudster" language anywhere.
- No evidence graph, no verification checklist (Ideas 3–4 live elsewhere).
- No accusation against the caller ("this caller is a criminal").
- No autoplay, no alarms, no forced immediate action.
- No forms, no typing, no technical internals (model names, confidence values).

## Visual language: investigating, not declaring
- Motif: magnifying glass / document. Never: shield-with-X, handcuffs, sirens.
- Status chip "Under review" — a state, not a judgment.
- Copy pattern: "pattern detected" / "we're looking into this" / "not a verdict yet".
- Progress language: "Building case…" → "Case ready".
- Claimed identity always wears its "UNVERIFIED CLAIM" chip.

## Anti-patterns (what would make this confusing, alarming, or unsafe)
1. Red alert styling or alarm sounds → panic; user may confront the scammer or freeze.
2. Declaring "SCAM DETECTED" → false certainty; a real bank team can trip the wire.
3. Interrupting the call UI → fumbled phone, scammer notices the reaction.
4. Autoplaying the captured audio → re-traumatizes; scammer's voice plays aloud unexpectedly.
5. Meter-style "4 of 5" progress bar → reads as a score; use a checklist, not a meter.
6. "Act now!" pressure → replicates the scammer's own tactic; we must be the calm party.
7. Burying delete/dismiss → trust killer; the off-switch stays visible.
8. Presenting the claimed identity as fact → defamation risk and breaks our own rule.
9. Asking the user to type a description → panic-proof means zero typing.
10. Showing confidence numbers (0.87) → invites misreading; internals stay internal.

## Prototype demo notes (for the jury walkthrough)
- Demo control: "Simulate incoming scam call" button on the idle screen.
- Scripted scam dialogue plays with timed transcript; signals fire at scripted timestamps.
- Simulated: telecom/phone integration (no real call interception).
- Real in prototype: timed transcript, signal detection logic, case-object creation,
  all four UI states, card → case handoff.
- Idle screen (pre-call) shows: protection ON, permission status, manage/revoke,
  and the demo trigger. This is part of Page 1.
