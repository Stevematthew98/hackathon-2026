// Idea 5 · Decision-Safe Output — verdict engine.
//
// Pure logic, no UI. The decision is a DETERMINISTIC function of the
// structured case state (Idea 3 relationships + Idea 4 verification records).
// No numeric scores, no percentages, no invented certainty.
//
// Rules (locked):
//   HIGH RISK    — an INDEPENDENT check conflicts with a load-bearing claim.
//                  Claim-vs-claim contradictions alone are suspicion, not proof.
//   LOW RISK     — an independent check SUPPORTS the load-bearing claim and no
//                  verified conflict exists. Never "genuine" / "100% safe".
//   NEEDS REVIEW — a material claim is still UNKNOWN (unverified). Never forced.

import { CASES } from '../graph/graphScenarios';
import { VERIFY_CASES } from '../verify/verifyScenarios';
import { getVerificationState, latestChecks } from '../shared/caseStore';

export const VERDICTS = {
  'HIGH RISK': {
    color: '#f87171',
    note: 'Independent evidence conflicts with a load-bearing claim.',
    card: 'Strong signs of fraud are present.',
    cardBody: 'Do not pay, share OTPs, transfer money, or continue the suspicious interaction.',
  },
  'NEEDS REVIEW': {
    color: '#f0a832',
    note: 'Available evidence does not yet settle this case.',
    card: 'Available evidence does not settle this case.',
    cardBody: 'One independent verification step is recommended.',
  },
  'LOW RISK': {
    color: '#34d399',
    note: 'Consistent with available evidence.',
    card: 'The available evidence is consistent with the claimed context.',
    cardBody: 'No immediate action is required.',
  },
};

// Base-graph relationships whose UNKNOWN state materially blocks a decision.
const MATERIAL_RELS = {
  'digital-arrest': ['R4'], // caller voice vs reference voice — identity-bearing
  'legit-bank': [],
  'customs-sms': ['R1', 'R2'], // sender identity + parcel reference — both load-bearing
};

export function buildDecision(caseId) {
  const g = CASES[caseId];
  const v = VERIFY_CASES[caseId];
  if (!g || !v) return null;
  const store = getVerificationState(caseId);
  const checks = latestChecks(caseId); // freshest check per weakest link

  // ---- standing edges: one per weakest link, UNKNOWN until independently checked
  const standing = v.links.map((link) => {
    const check = checks.find((c) => c.linkId === link.id && c.state !== 'Stopped') || null;
    const type = check ? check.edgeAfter : 'UNKNOWN';
    return {
      linkId: link.id,
      graphRelId: link.graphRelId,
      title: link.question,
      stake: link.stake,
      type,
      verified: !!check && type !== 'UNKNOWN',
      check,
      material: true,
      evidenceAvailable: link.evidenceAvailable,
      evidenceMissing: link.evidenceMissing,
      recommendation: link.recommendation,
    };
  });

  const verifiedConflicts = standing.filter((s) => s.verified && s.type === 'CONFLICT');
  const verifiedSupports = standing.filter((s) => s.verified && s.type === 'SUPPORT');
  const materialUnknownRels = (MATERIAL_RELS[caseId] || [])
    .map((id) => g.relationships.find((r) => r.id === id))
    .filter((r) => r && r.type === 'UNKNOWN');
  const unresolvedStanding = standing.filter((s) => !s.verified);

  // ---- verdict
  let verdict;
  if (verifiedConflicts.length > 0) verdict = 'HIGH RISK';
  else if (verifiedSupports.length > 0) verdict = 'LOW RISK';
  else if (materialUnknownRels.length > 0 || unresolvedStanding.length > 0) verdict = 'NEEDS REVIEW';
  else verdict = 'NEEDS REVIEW'; // never force HIGH/LOW on thin evidence

  // ---- why this decision (2–3 most important, ordered)
  const reasons = [];
  if (verdict === 'HIGH RISK') {
    verifiedConflicts.forEach((s) => reasons.push({ kind: 'check', standing: s }));
    const r1 = g.relationships.find((r) => r.type === 'CONFLICT');
    if (r1) reasons.push({ kind: 'rel', rel: r1 });
    const an = g.relationships.find((r) => r.type === 'ANOMALY');
    if (an && reasons.length < 3) reasons.push({ kind: 'rel', rel: an });
  } else if (verdict === 'LOW RISK') {
    verifiedSupports.forEach((s) => reasons.push({ kind: 'check', standing: s }));
    g.relationships
      .filter((r) => r.type === 'SUPPORT')
      .slice(0, 2)
      .forEach((r) => reasons.push({ kind: 'rel', rel: r }));
  } else {
    unresolvedStanding.slice(0, 1).forEach((s) => reasons.push({ kind: 'standing', standing: s }));
    materialUnknownRels.slice(0, 1).forEach((r) => reasons.push({ kind: 'rel', rel: r }));
    const susp =
      g.relationships.find((r) => r.type === 'CONFLICT') ||
      g.relationships.find((r) => r.type === 'ANOMALY');
    if (susp && reasons.length < 3) reasons.push({ kind: 'rel', rel: susp });
  }

  // ---- uncertainty: prioritized, never fabricated
  const uncertainties = [];
  unresolvedStanding.forEach((s) => {
    uncertainties.push({
      label: `Unverified — ${s.title}`,
      text: `This claim has not been independently checked. Still unknown: ${(s.evidenceMissing || []).join('; ')}.`,
    });
  });
  materialUnknownRels.forEach((r) => {
    uncertainties.push({ label: `${r.id} · ${r.title}`, text: r.uncertainty });
  });
  store.verifications
    .filter((c) => c.state === 'Inconclusive')
    .forEach((c) => {
      uncertainties.push({
        label: `Inconclusive check — ${c.what}`,
        text: `The independent source could neither confirm nor deny. ${c.resultText}`,
      });
    });
  if (verdict === 'LOW RISK') {
    uncertainties.push({
      label: 'Consistency is not proof',
      text: 'The available evidence is consistent, but authenticity cannot be established with certainty. New evidence could change this assessment.',
    });
    g.relationships
      .filter((r) => r.type === 'SUPPORT' && r.uncertainty)
      .slice(0, 1)
      .forEach((r) => uncertainties.push({ label: `${r.id} · caveat`, text: r.uncertainty }));
  }
  const uncertaintiesView = uncertainties.slice(0, 3);
  const noUncertainty = uncertaintiesView.length === 0;

  // ---- exactly one safest next action
  const lastDone = [...store.verifications].reverse().find((c) => c.state !== 'Stopped');
  const nextAction = lastDone
    ? lastDone.nextAction
    : verdict === 'NEEDS REVIEW'
      ? v.links[0].recommendation.action
      : VERDICTS[verdict].cardBody;

  // ---- decision trace
  const relCounts = { CONFLICT: 0, ANOMALY: 0, UNKNOWN: 0, SUPPORT: 0 };
  g.relationships.forEach((r) => {
    if (relCounts[r.type] !== undefined) relCounts[r.type] += 1;
  });
  const trace = {
    evidenceItems: g.evidence.length,
    claims: g.claims.length,
    relCounts,
    unresolved: materialUnknownRels.length + unresolvedStanding.length,
    checksDone: store.verifications.filter((c) => c.state !== 'Stopped').length,
    checksTotal: store.verifications.length,
    decision: verdict,
  };

  return {
    caseId,
    caseType: g.caseType,
    caseLabel: v.caseId,
    verdict,
    verdictMeta: VERDICTS[verdict],
    reasons: reasons.slice(0, 3),
    standing,
    baseRels: g.relationships,
    uncertainties: uncertaintiesView,
    noUncertainty,
    nextAction,
    checks: store.verifications,
    openedAt: store.openedAt,
    trace,
    weakestLink: v.links[0],
    graphCase: g,
    verifyCase: v,
  };
}

export const DECISION_IDS = ['digital-arrest', 'legit-bank', 'customs-sms'];
