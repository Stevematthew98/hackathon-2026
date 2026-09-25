// Idea 4 · The Verification Loop — verification LAYER over Idea 3.
//
// It does NOT own evidence. It reads the Idea 3 Evidence Graph through
// shared/graphState, TrustGuard identifies the single weakest link
// deterministically (never a manual pick), runs exactly ONE independent
// check, and folds the result back into the SAME graph — never a copy.
//
// The loop runs BY ITSELF, like Ideas 1 and 2: on entry it identifies the
// weakest link, runs the check, and updates the graph — then moves to the
// next weakest link until no checkable claim remains. The outcome it plays
// is the relationship's own verificationSpec.scriptedOutcome (the canonical
// demo outcome for that claim), always under the DEMO MODE label — the live
// product would perform the real check. The user can take over at any
// moment; the manual controls (run the check, choose the outcome, stop,
// next link) are unchanged and appear once taken over.
//
// Job: IDENTIFY → VERIFY → UPDATE GRAPH. It does not decide the case:
// no verdict is produced here; the decision is recalculated from the
// complete evidence state on Page 5.

import { useEffect, useMemo, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { CASES } from '../graph/graphScenarios';
import { CASE_IDS, selectWeakestLink } from '../shared/graphState';
import { recordVerification, getVerificationState, resetVerificationState } from '../shared/caseStore';
import VerifyChain from './VerifyChain';
import './VerificationLoop.css';

const EC = { UNKNOWN: '#8fa0b8', CONFLICT: '#f87171', SUPPORT: '#34d399' };
const EDGE_AFTER = { confirmed: 'SUPPORT', denied: 'CONFLICT', inconclusive: 'UNKNOWN' };
const OUTCOME_ORDER = ['denied', 'confirmed', 'inconclusive'];

// Auto-run pacing (ms). The loop plays itself the way the Idea 1 call
// simulation does: each stage is visible long enough to follow, then moves.
const T_IDENTIFY = 3500; // weakest-link card on screen before the check starts
const T_RUN = 3200; // simulated independent check duration
const T_NEXT = 5000; // graph effect on screen before the next weakest link

export default function VerificationLoop({ page, onNav, initialCase = 'digital-arrest', onBack }) {
  const [caseId, setCaseId] = useState(initialCase);
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState('identify'); // identify | run | updated | stopped
  const [skipped, setSkipped] = useState([]); // relIds tried-but-inconclusive this session
  const [lastEffect, setLastEffect] = useState(null); // { from, to }
  const [lastCheckedId, setLastCheckedId] = useState(null); // rel just resolved
  const [showHist, setShowHist] = useState(false);
  const [showProv, setShowProv] = useState(false);
  const [manual, setManual] = useState(false); // user took over — auto-run stands down
  const autoFired = useRef(new Set()); // each auto step fires once per case+link per session

  const scase = CASES[caseId];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = useMemo(() => {
    try {
      return getVerificationState(caseId).verifications;
    } catch {
      return [];
    }
  }, [caseId, tick]); // tick refreshes after each recorded check

  // Links already resolved in an earlier session stay resolved — the loop
  // resumes from the next unchecked link instead of re-running a check.
  // (Stopped checks have no edgeAfter, so they stay checkable.)
  const storeCheckedIds = useMemo(
    () => history.filter((h) => h.edgeAfter).map((h) => h.relId || h.linkId).filter(Boolean),
    [history]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sel = useMemo(
    () => selectWeakestLink(caseId, [...new Set([...skipped, ...storeCheckedIds])]),
    [caseId, tick, skipped, storeCheckedIds]
  );
  const rel = sel.top ? sel.top.rel : null;
  const spec = rel ? rel.verificationSpec : null;
  const reasons = sel.top ? sel.top.reasons : [];

  const resetAll = (nextCase) => {
    resetVerificationState(nextCase);
    setCaseId(nextCase);
    setPhase('identify');
    setSkipped([]);
    setLastEffect(null);
    setLastCheckedId(null);
    setShowHist(false);
    setShowProv(false);
    setManual(false);
  };

  const chooseOutcome = (key) => {
    const o = spec.outcomes[key];
    const edgeAfter = EDGE_AFTER[key];
    recordVerification(caseId, {
      relId: rel.id,
      question: spec.question,
      what: rel.title,
      why: spec.whyMatters,
      sourceType: o.sourceType,
      method: 'Independent source check',
      resultText: o.resultText,
      previousStatus: 'UNKNOWN',
      edgeAfter,
      outcomeKey: key,
      nextAction: o.nextAction,
      state: key === 'inconclusive' ? 'Inconclusive' : 'Completed',
      verifiedIndependently: true,
    });
    if (key === 'inconclusive') setSkipped((s) => [...s, rel.id]);
    setLastEffect({ from: 'UNKNOWN', to: edgeAfter });
    setLastCheckedId(rel.id);
    setPhase('updated');
    setTick((t) => t + 1);
  };

  const stop = () => {
    recordVerification(caseId, {
      relId: rel.id,
      question: spec.question,
      what: rel.title,
      why: spec.whyMatters,
      sourceType: null,
      method: 'Independent source check',
      resultText: 'Verification stopped by the user before any result.',
      previousStatus: 'UNKNOWN',
      edgeAfter: null,
      outcomeKey: 'stopped',
      nextAction: null,
      state: 'Stopped',
      verifiedIndependently: false,
    });
    setPhase('stopped');
    setTick((t) => t + 1);
  };

  // ---- auto-run: the loop plays itself ----
  // identify → run
  useEffect(() => {
    if (manual || phase !== 'identify' || !rel) return;
    const key = `start:${caseId}:${rel.id}`;
    if (autoFired.current.has(key)) return;
    const t = setTimeout(() => {
      autoFired.current.add(key);
      setPhase('run');
    }, T_IDENTIFY);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, phase, caseId, rel && rel.id]);

  // run → resolve with the spec's scripted (canonical demo) outcome
  useEffect(() => {
    if (manual || phase !== 'run' || !rel || !spec) return;
    const key = `resolve:${caseId}:${rel.id}`;
    if (autoFired.current.has(key)) return;
    const t = setTimeout(() => {
      autoFired.current.add(key);
      const scripted = spec.scriptedOutcome && spec.outcomes[spec.scriptedOutcome]
        ? spec.scriptedOutcome
        : 'inconclusive'; // honest default: abstain when no scripted outcome
      chooseOutcome(scripted);
    }, T_RUN);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, phase, caseId, rel && rel.id]);

  // updated → next weakest link (the loop keeps going by itself)
  useEffect(() => {
    if (manual || phase !== 'updated' || !sel.top || !lastCheckedId) return;
    const key = `next:${caseId}:${lastCheckedId}`;
    if (autoFired.current.has(key)) return;
    const t = setTimeout(() => {
      autoFired.current.add(key);
      setPhase('identify');
    }, T_NEXT);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, phase, caseId, sel.top && sel.top.rel.id, lastCheckedId]);

  const steps = [
    { label: 'Weakest link identified', state: rel || phase === 'updated' ? 'done' : 'now' },
    { label: 'Check running', state: phase === 'run' ? 'now' : phase === 'updated' ? 'done' : '' },
    { label: 'Graph updated', state: phase === 'updated' ? 'done' : '' },
  ];

  return (
    <div className="vl-screen app-screen">
      <PageHead page={page} onNav={onNav} kicker="LIVE PROTOTYPE" title="Page 4 of 5 · The Verification Loop" />
      <div className="app-body">
        <div className="vl-head">
          <div className="vl-eyebrow">The Verification Loop</div>
          <h1 className="vl-title">The Verification Loop</h1>
          <div className="vl-sub">
            {scase.caseId} · {scase.caseType}
          </div>
          <p className="vl-whyline">Reads the Evidence Graph. Writes the result back into it.</p>
          <div className="vl-progress">
            {steps.map((s, i) => (
              <div key={i} className={`vl-step ${s.state}`}>
                <span className="vl-step-dot" />
                <span className="vl-step-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="vl-caseswitch">
            {CASE_IDS.map((id) => (
              <button
                key={id}
                className={`vl-casebtn${id === caseId ? ' on' : ''}`}
                onClick={() => id !== caseId && resetAll(id)}
              >
                {CASES[id].tabLabel}
              </button>
            ))}
          </div>
        </div>

        {phase === 'identify' && rel && (
          <>
            <div className="vl-card">
              <div className="vl-card-head">Weakest link — identified by TrustGuard</div>
              <VerifyChain chain={spec.chain} edgeType="UNKNOWN" compact />
              <p className="vl-question">“{spec.question}”</p>
              <div className="vl-panel">
                <div className="vl-panel-head">Why this claim matters</div>
                <p className="vl-note">{spec.whyMatters}</p>
                <div className="vl-panel-head">Why it is the weakest link</div>
                <ul className="vl-list">
                  {reasons.map((r) => (
                    <li key={r}>TrustGuard picked this claim because {r}.</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="vl-card">
              <div className="vl-card-head">From the Evidence Graph · {rel.id}</div>
              <div className="vl-resline">
                <span>Claim A</span>
                <b>“{rel.claimA}” · {rel.sourceA}</b>
              </div>
              <div className="vl-resline">
                <span>Claim B</span>
                <b>“{rel.claimB}” · {rel.sourceB}</b>
              </div>
              <div className="vl-resline">
                <span>Relationship</span>
                <b>
                  <span className="vl-typebadge" style={{ background: EC.UNKNOWN }}>UNKNOWN</span>
                  {' '}{rel.title}
                </b>
              </div>
              <div className="vl-resline">
                <span>Provenance</span>
                <b>{rel.check} · {rel.method}</b>
              </div>
              <p className="vl-note"><b>Why unresolved:</b> {spec.unresolvedNote}</p>
              <button className="vl-linkbtn" onClick={() => (onBack ? onBack() : onNav(3))}>
                View in Evidence Graph →
              </button>
            </div>

            {manual ? (
              <button className="vl-btn primary" onClick={() => setPhase('run')}>
                Run the check →
              </button>
            ) : (
              <div className="vl-auto">
                <div className="vl-auto-row">
                  <span className="vl-auto-pulse" />
                  <span>Starting the independent check automatically…</span>
                  <button className="vl-takeover" onClick={() => setManual(true)}>Take over</button>
                </div>
                <div className="vl-autobar"><span /></div>
              </div>
            )}
          </>
        )}

        {phase === 'identify' && !rel && (
          <div className="vl-card">
            <div className="vl-card-head">No unresolved checkable claims</div>
            <p className="vl-note">
              Every claim that can be independently checked has been checked.
              The decision reflects the complete evidence state.
            </p>
            <button className="vl-btn primary" onClick={() => onNav(5)}>
              See the decision →
            </button>
          </div>
        )}

        {phase === 'run' && rel && (
          <div className="vl-card vl-stepcard">
            <div className="vl-stepnum">One independent check</div>
            <p className="vl-note dim" style={{ marginTop: 0 }}>Checking: “{spec.question}”</p>
            <p className="vl-action">{spec.action}</p>
            <div className="vl-donot">
              <div className="vl-donot-head">DO NOT</div>
              <ul className="vl-list">
                {spec.doNot.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            <p className="vl-indep">{spec.independentLine}</p>
            <div className="vl-demo-tag">DEMO MODE — simulated independent verification. In the live product this would be the real answer.</div>
            {manual ? (
              <>
                <div className="vl-outcomes">
                  {OUTCOME_ORDER.map((key) => (
                    <button key={key} className="vl-btn outcome" onClick={() => chooseOutcome(key)}>
                      <b>{spec.outcomes[key].label}</b>
                      <span className="vl-why-go">▸</span>
                    </button>
                  ))}
                </div>
                <button className="vl-btn ghost" onClick={stop}>Stop Verification</button>
              </>
            ) : (
              <div className="vl-auto in-card">
                <div className="vl-auto-row">
                  <span className="vl-auto-pulse" />
                  <span>Check running — resolving automatically…</span>
                  <button className="vl-takeover" onClick={() => setManual(true)}>Take over</button>
                </div>
                <div className="vl-autobar slow"><span /></div>
              </div>
            )}
          </div>
        )}

        {phase === 'updated' && lastEffect && (
          <>
            <div className="vl-card">
              <div className="vl-card-head">Graph updated</div>
              <div className="vl-grapheffect">
                <span className="vl-ge-label">Relationship {lastCheckedId || ''}</span>
                <span className="vl-ge-flow">
                  <span className="vl-typebadge" style={{ background: EC[lastEffect.from] }}>{lastEffect.from}</span>
                  <span className="vl-ge-arrow">→</span>
                  <span className="vl-typebadge" style={{ background: EC[lastEffect.to] }}>{lastEffect.to}</span>
                </span>
              </div>
              <p className="vl-note">
                The result is folded into the same Evidence Graph — with verification provenance.
                No verdict is set here: the decision is recalculated from the complete evidence state on Page 5.
              </p>
              <button className="vl-btn primary" onClick={() => onNav(5)}>
                See the decision →
              </button>
              {manual && sel.top && (
                <button className="vl-btn ghost" onClick={() => setPhase('identify')}>
                  Check the next weakest link →
                </button>
              )}
              {!manual && sel.top && (
                <div className="vl-auto in-card">
                  <div className="vl-auto-row">
                    <span className="vl-auto-pulse" />
                    <span>Moving to the next weakest link automatically…</span>
                    <button className="vl-takeover" onClick={() => setManual(true)}>Take over</button>
                  </div>
                  <div className="vl-autobar slower"><span /></div>
                </div>
              )}
              {!manual && !sel.top && (
                <p className="vl-note">The loop is complete — every claim that can be independently checked has been checked.</p>
              )}
            </div>

            <div className="vl-card">
              <button className="vl-secbtn" onClick={() => setShowHist((v) => !v)}>
                VERIFICATION HISTORY · {history.length} <span>{showHist ? '▾' : '▸'}</span>
              </button>
              {showHist && (
                <div className="vl-hist">
                  {history.map((h, i) => (
                    <div key={i} className="vl-hist-item">
                      <div className="vl-hist-head">{h.what}</div>
                      {h.edgeAfter && (
                        <div className="vl-ge-flow">
                          <span className="vl-typebadge" style={{ background: EC[h.previousStatus || 'UNKNOWN'] }}>{h.previousStatus || 'UNKNOWN'}</span>
                          <span className="vl-ge-arrow">→</span>
                          <span className="vl-typebadge" style={{ background: EC[h.edgeAfter] }}>{h.edgeAfter}</span>
                        </div>
                      )}
                      <div className="vl-hist-meta">
                        {h.state} · {h.at} · {scase.caseId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="vl-card">
              <button className="vl-secbtn" onClick={() => setShowProv((v) => !v)}>
                View evidence provenance <span>{showProv ? '▾' : '▸'}</span>
              </button>
              {showProv && history.length > 0 && (
                <div className="vl-prov">
                  {[
                    ['Claim', `“${history[history.length - 1].question}”`],
                    ['Verification', history[history.length - 1].method],
                    ['Source', history[history.length - 1].sourceType || '—'],
                    ['Result', history[history.length - 1].resultText],
                    ['Graph effect', `${history[history.length - 1].previousStatus || 'UNKNOWN'} → ${history[history.length - 1].edgeAfter || '—'}`],
                    ['Independently verified', history[history.length - 1].verifiedIndependently ? 'Yes' : 'No'],
                  ].map(([k, v]) => (
                    <div key={k} className="vl-prov-row">
                      <span>{k}</span>
                      <p>{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {phase === 'stopped' && (
          <div className="vl-card vl-stepcard">
            <div className="vl-stepnum">Verification stopped</div>
            <p className="vl-note">No conclusion was forced because independent evidence was not obtained.</p>
            <button className="vl-btn primary" onClick={() => { setSkipped([]); setPhase('identify'); }}>
              Back to the weakest link
            </button>
            <button className="vl-btn ghost" onClick={() => onNav(5)}>
              See the decision →
            </button>
          </div>
        )}

        <div className="vl-foot">
          Prototype · DEMO MODE — simulated independent verification · no scores are computed
        </div>
      </div>
    </div>
  );
}
