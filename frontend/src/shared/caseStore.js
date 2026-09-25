// TrustGuard · shared case-verification state.
//
// The interface between Idea 4 (The Verification Loop, the writer) and the
// graph/decision layers (the readers). Idea 4 records every completed or
// stopped independent check here; the SAME Idea 3 graph is read back with
// the result folded in (see shared/graphState.js), and Idea 5 recomputes
// its verdict live — so returning from the loop always shows the current
// decision.
//
// Idea 4 does NOT decide the case: no verdicts and no scores are stored,
// only evidence. Each entry carries verification provenance:
//   previousStatus -> edgeAfter, sourceType, method, resultText, timestamp,
//   verifiedIndependently: true.
//
// Entry shape (written by VerificationLoop.chooseOutcome / stop):
//   { relId, question, what, why, sourceType, method, resultText,
//     previousStatus: 'UNKNOWN', edgeAfter: 'CONFLICT'|'SUPPORT'|'UNKNOWN'|null,
//     outcomeKey: 'confirmed'|'denied'|'inconclusive'|'stopped',
//     nextAction, state: 'Completed'|'Inconclusive'|'Stopped',
//     verifiedIndependently: true }

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

// Latest check per verified relationship — readers always see the freshest
// state of each checked claim. Keyed by relId (legacy entries keyed by
// linkId are honored too).
export function latestChecks(caseId) {
  const s = getVerificationState(caseId);
  const byRel = {};
  s.verifications.forEach((v) => {
    const id = v.relId || v.linkId;
    if (id) byRel[id] = v;
  });
  return Object.values(byRel);
}

export function resetVerificationState(caseId) {
  cases[caseId] = { verifications: [], openedAt: new Date().toISOString() };
  persist();
}

// ---- cross-model runs (Page 6, optional lab) -------------------------------
// One recorded run per case: the latest set of model findings for the
// featured evidence item. Persisted separately from verification state.
// A run NEVER moves an existing relationship and NEVER decides anything —
// readers (graphState) append each finding as a base relationship with
// cross-model provenance.
//
// Run shape:
//   { evidenceLabel, at, iso,
//     findings: [{ modelId, name, method, finding: 'SUPPORT'|'CONFLICT'|'UNKNOWN',
//                   claimA, sourceA, claimB, sourceB, check, result,
//                   uncertainty, why }] }
const xcases = {};
const X_LS_KEY = 'tg-crossmodel-state-v1';

function xpersist() {
  try {
    localStorage.setItem(X_LS_KEY, JSON.stringify(xcases));
  } catch {
    /* storage unavailable — in-memory state still works for the session */
  }
}

(function xhydrate() {
  try {
    const raw = localStorage.getItem(X_LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(data || {}).forEach((k) => { xcases[k] = data[k]; });
  } catch {
    /* corrupt cache — start clean */
  }
})();

export function getCrossModelState(caseId) {
  if (!xcases[caseId]) xcases[caseId] = { run: null };
  return xcases[caseId];
}

export function recordCrossModelRun(caseId, run) {
  const s = getCrossModelState(caseId);
  s.run = {
    ...run,
    at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    iso: new Date().toISOString(),
  };
  xpersist();
  return s;
}

export function clearCrossModelState(caseId) {
  xcases[caseId] = { run: null };
  xpersist();
}
