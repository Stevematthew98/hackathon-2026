// TrustGuard · shared graph state.
//
// ARCHITECTURE (locked):
//   IDEA 3 = SOURCE OF TRUTH (the Evidence Graph)
//   IDEA 4 = VERIFICATION LAYER OVER IDEA 3
//   IDEA 5 = DECISION LAYER OVER IDEA 3 + IDEA 4
//
// This module is the single read layer over the Idea 3 graph. Idea 4 and
// Idea 5 both read through here — neither invents evidence, and neither
// keeps a separate copy of the graph.
//
//   getEffectiveRelationships(caseId)
//     Base Idea 3 relationships with Idea 4 verification results folded
//     into the SAME graph (never a duplicate). Each relationship carries:
//       effectiveType — the current type after verification (or the base type)
//       verification  — provenance of the independent check that moved it,
//                       or null when untouched:
//                       { previousStatus, newStatus, source, method,
//                         result, timestamp, verifiedIndependently: true }
//
//   selectWeakestLink(caseId, excludeIds)
//     Deterministic weakest-link selection over the effective graph.
//     TrustGuard identifies the weakest link — the user never picks it.
//     A candidate must be: currently UNKNOWN, verifiable (the Idea 3 graph
//     carries a verificationSpec for it), and independently checkable.
//     Scoring (documented, no randomness, not "first UNKNOWN"):
//       +3  identity-bearing  — the relationship tests who someone is
//       +3  authority-bearing — the case's authority claim rests on it
//       +1  per affected case aspect (materialScope, capped at 3)
//     Ties break by relationship id, so the result is fully deterministic.
//     Returns { ranked, top } where top = { rel, score, reasons }.

import { CASES } from '../graph/graphScenarios';
import { latestChecks } from './caseStore';

export const CASE_IDS = Object.keys(CASES);

export function getEffectiveRelationships(caseId) {
  const sc = CASES[caseId];
  if (!sc) return [];
  let checks = [];
  try {
    checks = latestChecks(caseId);
  } catch {
    /* store unavailable — the graph shows its base state */
  }
  const byRel = {};
  checks.forEach((c) => {
    const id = c.relId || c.linkId;
    if (id) byRel[id] = c;
  });
  return sc.relationships.map((r) => {
    const v = byRel[r.id];
    if (!v || !v.edgeAfter) return { ...r, effectiveType: r.type, verification: null };
    return {
      ...r,
      effectiveType: v.edgeAfter,
      verification: {
        previousStatus: v.previousStatus || 'UNKNOWN',
        newStatus: v.edgeAfter,
        source: v.sourceType || 'Independent source check',
        method: v.method || 'Independent source check',
        result: v.resultText || '',
        timestamp: v.at || '',
        verifiedIndependently: true,
      },
    };
  });
}

export function selectWeakestLink(caseId, excludeIds = []) {
  const excluded = new Set(excludeIds);
  const ranked = getEffectiveRelationships(caseId)
    .filter(
      (r) =>
        r.effectiveType === 'UNKNOWN' &&
        r.verificationSpec &&
        r.checkable !== false &&
        !excluded.has(r.id)
    )
    .map((r) => {
      let score = 0;
      const reasons = [];
      if (r.identityBearing) {
        score += 3;
        reasons.push('it tests the claimed identity');
      }
      if (r.authorityBearing) {
        score += 3;
        reasons.push('the case’s authority claim rests on it');
      }
      const scope = (r.materialScope || []).slice(0, 3);
      score += scope.length;
      if (scope.length) reasons.push(`resolving it affects ${scope.join(', ')}`);
      return { rel: r, score, reasons };
    })
    .sort((a, b) => b.score - a.score || (a.rel.id < b.rel.id ? -1 : 1));
  return { ranked, top: ranked[0] || null };
}
