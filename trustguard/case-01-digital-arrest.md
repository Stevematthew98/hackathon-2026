# Case 01 — "Digital Arrest" Scam (Flagship Demo Case)

## The story (60-second pitch version)
A retired teacher receives a WhatsApp voice note from someone claiming to be a
Cyber Crime Branch officer: her Aadhaar has been linked to money laundering, a
warrant has been issued, and she must transfer a "verification amount" immediately
or face arrest within 2 hours. A photo of an "arrest warrant" and threatening
chat messages follow. Everything looks and sounds official.

## Evidence bundle (the "case, not a file")
| # | Evidence | Type | Notes |
|---|----------|------|-------|
| E1 | Voice note (`.mp3`) | Audio | Claimed: senior police officer. Kannada + English mix. |
| E2 | "Arrest warrant" photo | Document image | Letterhead, stamp, signature, case number |
| E3 | Chat screenshots (x2) | Image + text | Threats, urgency, payment instructions (UPI ID) |
| E4 | Claimed identity | Text | "Inspector R. Kumar, Cyber Crime Branch, Bengaluru" |
| E5 | Caller phone number | Metadata | +91-XXXXXXXXXX (unknown, not in official directory) |
| E6 | Message timing | Metadata | Received 11:47 PM (outside official working hours) |

## Expected pipeline behavior
1. **Feature extraction** — audio: transcript + voice characteristics; document: OCR
   text, layout features, creation metadata; chat: text + urgency cues.
2. **Cross-modal analysis** — voice has no reference sample (unverifiable link);
   transcript language matches known scam phrasing patterns; document case number
   format inconsistent with real court numbering.
3. **Identity & consistency checks** — phone number absent from official directory;
   "Inspector R. Kumar" not found in public officer listings; document metadata
   shows creation 20 minutes before it was sent (no official provenance).
4. **Risk assessment** — HIGH RISK. Multiple independent contradictions across
   modalities; no single score hides them.
5. **Explainable result** — evidence graph shows each link and where it breaks;
   uncertainty stated per link; "do this next" actions listed.
6. **Verification loop** — weakest link = caller identity. Proposed challenges:
   call back via the official Cyber Crime helpline (1930), ask the caller to
   repeat a randomized phrase, verify the warrant number at the local station.

## Expected verdict
**HIGH RISK** — do not transfer money; do not share OTPs. Next action: call 1930
(Cyber Crime helpline) from a fresh dial, never from the chat thread.
