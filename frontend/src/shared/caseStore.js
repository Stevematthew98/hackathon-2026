// TrustGuard · shared case-verification state.
//
// The smallest clean interface between Idea 4 (The Verification Loop, the
// writer) and Idea 5 (Decision-Safe Output, the reader). Idea 4 records every
// completed or stopped independent check here; Idea 5 reads the same store
// and recomputes its verdict live — so returning from the loop always shows
// the current decision. No verdicts or scores are stored, only evidence.
//
// Entry shape (written by VerificationLoop.chooseOutcome / stop):
//   { linkId, relId, question, what, why, sourceType, method, resultText,
//     edgeAfter: 'CONFLICT'|'SUPPORT'|'UNKNOWN'|null, outcomeKey,
//     nextAction, state: 'Completed'|'Inconclusive'|'Stopped' }

const cases = {};

// ---- persistence (#37): verification history survives refresh/navigation.
// localStorage only; the in-memory map stays the runtime source of truth.
const LS_KEY = 'tg-verification-state-v1';

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cases));
  } catch {
    /* storage unavailable — in-memory state still works for the session */
  }
}

(function hydrate() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(data || {}).forEach((k) => { cases[k] = data[k]; });
  } catch {
    /* corrupt cache — start clean */
  }
})();

export function getVerificationState(caseId) {
  if (!cases[caseId]) {
    cases[caseId] = { verifications: [], openedAt: new Date().toISOString() };
  }
  return cases[caseId];
}

export function recordVerification(caseId, entry) {
  const s = getVerificationState(caseId);
  s.verifications.push({
    ...entry,
    at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    iso: new Date().toISOString(),
  });
  persist();
  return s;
}

// Latest check per weakest link — the decision layer always reads the
// freshest state of each checked claim.
export function latestChecks(caseId) {
  const s = getVerificationState(caseId);
  const byLink = {};
  s.verifications.forEach((v) => {
    byLink[v.linkId] = v;
  });
  return Object.values(byLink);
}

export function resetVerificationState(caseId) {
  cases[caseId] = { verifications: [], openedAt: new Date().toISOString() };
  persist();
}
