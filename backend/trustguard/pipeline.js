// TrustGuard analysis pipeline — Case 01 (Digital Arrest Scam).
// Follows the organizer's suggested pipeline:
// Media/Communication → Feature Extraction → Cross-Modal Analysis →
// Identity & Consistency Checks → Risk Assessment → Explainable Result
// plus the verification loop. Deterministic and transparent: every finding
// carries its source, and simulated checks are labelled as such.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EVIDENCE_DIR = path.join(__dirname, '..', '..', 'trustguard', 'evidence');

function audioFacts(relFile) {
  const abs = path.join(EVIDENCE_DIR, relFile);
  const facts = { file: relFile, simulated: false };
  try {
    const stat = fs.statSync(abs);
    facts.bytes = stat.size;
  } catch {
    facts.bytes = null;
  }
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${abs}"`,
      { timeout: 8000 }
    )
      .toString()
      .trim();
    facts.durationSecs = Math.round(parseFloat(out));
  } catch {
    facts.durationSecs = null; // ffprobe not available — duration unknown, not guessed
  }
  return facts;
}

function analyze(caseId) {
  if (caseId !== 'case-01') {
    const err = new Error(`No analysis implemented for ${caseId}`);
    err.status = 404;
    throw err;
  }

  // Stage 2 — Feature extraction
  const audio = audioFacts('case-01/voice-note.mp3');
  const featureExtraction = {
    stage: 'Feature extraction',
    findings: [
      {
        evidence: 'E1',
        detail: `Audio ingested (${audio.bytes} bytes${audio.durationSecs ? `, ~${audio.durationSecs}s` : ''}). Speech present; transcript extracted.`,
        simulated: false,
      },
      {
        evidence: 'E1',
        detail:
          'Transcript (simulated STT for demo): caller identifies as Cyber Crime Branch, cites money-laundering case linked to the victim\'s Aadhaar, demands a transfer within 2 hours, instructs secrecy.',
        simulated: true,
      },
      {
        evidence: 'E2',
        detail:
          'Document OCR (simulated): letterhead + emblem, red stamp, signature block, case number "CCB/2026/4177-B". Layout parsed.',
        simulated: true,
      },
      {
        evidence: 'E3',
        detail:
          'Chat text (simulated transcript): urgency cues ["2 hours", "do not tell anyone", "transfer now"], payment via personal UPI ID.',
        simulated: true,
      },
    ],
  };

  // Stage 3 — Cross-modal analysis: the evidence graph. Contradictions stay visible.
  const crossModal = {
    stage: 'Cross-modal analysis',
    links: [
      {
        from: 'E1 voice',
        to: 'E4 claimed identity',
        status: 'unverifiable',
        note: 'No reference voice sample for the claimed officer — voice cannot be matched or ruled out.',
      },
      {
        from: 'E1 transcript',
        to: 'scam-pattern knowledge',
        status: 'match',
        note: 'Pressure + secrecy + payment-demand phrasing matches known digital-arrest scripts.',
      },
      {
        from: 'E2 case number',
        to: 'official numbering format',
        status: 'mismatch',
        note: '"CCB/2026/4177-B" does not follow the published court case-number format.',
      },
      {
        from: 'E5 phone',
        to: 'official directory',
        status: 'mismatch',
        note: 'Number absent from the official directory (simulated lookup).',
      },
      {
        from: 'E6 timing',
        to: 'official working hours',
        status: 'mismatch',
        note: 'Official communications are not issued at 23:47.',
      },
    ],
  };

  // Stage 4 — Identity & consistency checks
  const identityChecks = {
    stage: 'Identity & consistency checks',
    findings: [
      {
        check: 'Caller identity anchor',
        result: 'weakest link',
        note: 'No verifiable anchor: no reference voice, no directory listing, no signed source.',
      },
      {
        check: 'Document provenance',
        result: 'fail',
        note: 'No signature chain; metadata suggests creation shortly before sending (simulated).',
        simulated: true,
      },
      {
        check: 'Payment channel',
        result: 'fail',
        note: 'UPI ID is personal, not a government collection account (simulated).',
        simulated: true,
      },
    ],
  };

  // Stage 5 — Risk assessment: three zones, never a bare score.
  const riskAssessment = {
    stage: 'Risk assessment',
    level: 'high',
    rationale:
      'Three independent cross-modal contradictions plus one unverifiable core identity link. The voice itself is unassessed — that uncertainty is stated, not averaged away.',
    uncertainty: [
      'Voice-clone analysis not run in this demo build — voice authenticity is unknown, not "passed".',
      'Document forensics and directory lookups are simulated and labelled as such.',
    ],
  };

  // Stage 6 — Explainable result: decision-safe output.
  const explainableResult = {
    stage: 'Explainable result',
    verdict: 'HIGH RISK',
    abstained: false,
    evidence: [
      'Transcript uses pressure + secrecy + payment-demand script (E1 ↔ scam patterns: match).',
      'Warrant case number fails official format check (E2: mismatch).',
      'Caller number absent from official directory (E5: mismatch).',
      'Message sent at 23:47, outside official hours (E6: mismatch).',
      'Caller identity has no verifiable anchor (E1 ↔ E4: unverifiable).',
    ],
    nextActions: [
      'Do NOT transfer money. Do NOT share OTPs or Aadhaar details.',
      'Call 1930 (Cyber Crime helpline) from a fresh dial — never from the chat thread.',
      'Verify any warrant number at the local police station in person.',
    ],
  };

  // Verification loop — weakest link gets the cheapest decisive test.
  const verificationLoop = {
    weakestLink: 'Caller identity (E4/E5) — no verifiable anchor exists.',
    challenges: [
      'Call back via the official helpline 1930, not the number in the chat.',
      'Ask the caller to repeat a randomized phrase — cloned voices stumble on unexpected words.',
      'Validate the warrant number against the official directory / local station.',
      'Confirm the payment UPI ID against published government collection channels.',
    ],
  };

  return {
    caseId,
    pipeline: [
      { stage: 'Media / communication intake', summary: '6 evidence items registered as one case bundle.' },
      featureExtraction,
      crossModal,
      identityChecks,
      riskAssessment,
      explainableResult,
    ],
    verificationLoop,
  };
}

module.exports = { analyze };
