// Idea 5 · Decision-Safe Output — verdict engine.
//
// Pure logic, no UI. The decision is a DETERMINISTIC function of the
// effective Idea 3 graph state: base relationships with Idea 4 verification
// results folded in (shared/graphState). Idea 5 invents no evidence.
//
// No numeric scores, no percentages, no invented certainty.
//
// Rules (locked):
//   HIGH RISK    — an INDEPENDENT check conflicts with a load-bearing claim.
//   LOW RISK     — an independent check SUPPORTS the load-bearing claim, no
//                  conflict or anomaly remains, and no material UNKNOWN is
//                  unresolved. Never "genuine" / "100% safe".
//   NEEDS REVIEW — anything else. A genuine abstention; never forced.

import { CASES } from '../graph/graphScenarios';
import { getEffectiveRelationships, selectWeakestLink, CASE_IDS } from '../shared/graphState';
import { getVerificationState } from '../shared/caseStore';

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

// A material UNKNOWN: an unresolved relationship about claimed identity or
// authority, or one carrying an open independent check. Unresolved material
// unknowns block a definitive LOW RISK — the system abstains instead.
const isMaterialUnknown = (r) =>
  r.effectiveType === 'UNKNOWN' && (r.identityBearing || r.authorityBearing || !!r.verificationSpec);

export function buildDecision(caseId) {
  const g = CASES[caseId];
  if (!g) return null;
  const store = getVerificationState(caseId);
  const rels = getEffectiveRelationships(caseId);

  const verified = rels.filter((r) => r.verification);
  const verifiedConflicts = verified.filter((r) => r.verification.newStatus === 'CONFLICT');
  const verifiedSupports = verified.filter((r) => r.verification.newStatus === 'SUPPORT');
  const baseConflicts = rels.filter((r) => !r.verification && r.effectiveType === 'CONFLICT');
  const anomalies = rels.filter((r) => r.effectiveType === 'ANOMALY');
  const materialUnknowns = rels.filter(isMaterialUnknown);
  const weakest = selectWeakestLink(caseId).top;

  // ---- verdict, derived from the complete relationship state
  let verdict;
  if (verifiedConflicts.length > 0) verdict = 'HIGH RISK';
  else if (
    verifiedSupports.length > 0 &&
    baseConflicts.length === 0 &&
    anomalies.length === 0 &&
    materialUnknowns.length === 0
  )
    verdict = 'LOW RISK';
  else verdict = 'NEEDS REVIEW'; // never force HIGH/LOW on unsettled evidence

  // ---- why this decision (2–3 most important, ordered)
  const reasons = [];
  const asRel = (r) => ({ kind: 'rel', rel: r });
  const asVerified = (r) => ({ kind: 'verified', rel: r, record: r.verification });
  if (verdict === 'HIGH RISK') {
    verifiedConflicts.forEach((r) => reasons.push(asVerified(r)));
    baseConflicts.slice(0, 1).forEach((r) => reasons.push(asRel(r)));
    if (reasons.length < 3) anomalies.slice(0, 1).forEach((r) => reasons.push(asRel(r)));
  } else if (verdict === 'LOW RISK') {
    verifiedSupports.forEach((r) => reasons.push(asVerified(r)));
    rels
      .filter((r) => r.effectiveType === 'SUPPORT')
      .slice(0, 2)
      .forEach((r) => reasons.push(asRel(r)));
  } else {
    if (weakest) reasons.push({ kind: 'rel', rel: weakest.rel });
    else materialUnknowns.slice(0, 1).forEach((r) => reasons.push(asRel(r)));
    const susp = baseConflicts[0] || anomalies[0];
    if (susp && reasons.length < 3) reasons.push(asRel(susp));
  }

  // ---- uncertainty: prioritized, never fabricated — read from the graph
  const uncertainties = [];
  materialUnknowns.forEach((r) => {
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
    rels
      .filter((r) => r.effectiveType === 'SUPPORT' && r.uncertainty)
      .slice(0, 1)
      .forEach((r) => uncertainties.push({ label: `${r.id} · caveat`, text: r.uncertainty }));
  }
  const uncertaintiesView = uncertainties.slice(0, 3);
  const noUncertainty = uncertaintiesView.length === 0;

  // ---- exactly one safest next action
  const lastDone = [...store.verifications].reverse().find((c) => c.state !== 'Stopped');
  const nextAction = lastDone
    ? lastDone.nextAction
    : verdict === 'NEEDS REVIEW' && weakest
      ? weakest.rel.verificationSpec.action
      : VERDICTS[verdict].cardBody;

  // ---- decision trace
  const relCounts = { CONFLICT: 0, ANOMALY: 0, UNKNOWN: 0, SUPPORT: 0 };
  rels.forEach((r) => {
    if (relCounts[r.effectiveType] !== undefined) relCounts[r.effectiveType] += 1;
  });
  const trace = {
    evidenceItems: g.evidence.length,
    claims: g.claims.length,
    relCounts,
    unresolved: materialUnknowns.length,
    checksDone: store.verifications.filter((c) => c.state !== 'Stopped').length,
    checksTotal: store.verifications.length,
    decision: verdict,
  };

  return {
    caseId,
    caseType: g.caseType,
    caseLabel: g.caseId,
    verdict,
    verdictMeta: VERDICTS[verdict],
    reasons: reasons.slice(0, 3),
    baseRels: rels, // effective relationships — the report groups by current type
    uncertainties: uncertaintiesView,
    noUncertainty,
    nextAction,
    checks: store.verifications,
    openedAt: store.openedAt,
    trace,
    weakestLink: weakest ? weakest.rel : null,
    graphCase: g,
  };
}

export const DECISION_IDS = CASE_IDS;
