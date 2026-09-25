// Idea 4 · The Verification Loop — verification LAYER over Idea 3.
//
// It does NOT own evidence. It reads the Idea 3 Evidence Graph through
// shared/graphState, TrustGuard identifies the single weakest link
// deterministically (never a manual pick), proposes exactly ONE independent
// check, and folds the result back into the SAME graph — never a copy.
//
// Job: IDENTIFY → VERIFY → UPDATE GRAPH. It does not decide the case:
// no verdict is produced here; the decision is recalculated from the
// complete evidence state on Page 5.

import { useMemo, useState } from 'react';
import PageHead from '../PageHead';
import { CASES } from '../graph/graphScenarios';
import { CASE_IDS, selectWeakestLink } from '../shared/graphState';
import { recordVerification, getVerificationState, resetVerificationState } from '../shared/caseStore';
import VerifyChain from './VerifyChain';
import './VerificationLoop.css';

const EC = { UNKNOWN: '#8fa0b8', CONFLICT: '#f87171', SUPPORT: '#34d399' };
const EDGE_AFTER = { confirmed: 'SUPPORT', denied: 'CONFLICT', inconclusive: 'UNKNOWN' };
const OUTCOME_ORDER = ['denied', 'confirmed', 'inconclusive'];

export default function VerificationLoop({ page, onNav, initialCase = 'digital-arrest', onBack }) {
  const [caseId, setCaseId] = useState(initialCase);
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState('identify'); // identify | run | updated | stopped
  const [skipped, setSkipped] = useState([]); // relIds tried-but-inconclusive this session
  const [lastEffect, setLastEffect] = useState(null); // { from, to }
  const [showHist, setShowHist] = useState(false);
  const [showProv, setShowProv] = useState(false);

  const scase = CASES[caseId];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sel = useMemo(() => selectWeakestLink(caseId, skipped), [caseId, tick, skipped]);
  const rel = sel.top ? sel.top.rel : null;
  const spec = rel ? rel.verificationSpec : null;
  const reasons = sel.top ? sel.top.reasons : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = useMemo(() => {
    try {
      return getVerificationState(caseId).verifications;
    } catch {
      return [];
    }
  }, [caseId, tick]); // tick refreshes after each recorded check

  const resetAll = (nextCase) => {
    resetVerificationState(nextCase);
    setCaseId(nextCase);
    setPhase('identify');
    setSkipped([]);
    setLastEffect(null);
    setShowHist(false);
    setShowProv(false);
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
          <div className="vl-eyebrow">Idea 4 · The Verification Loop</div>
          <h1 className="vl-title">The Verification Loop</h1>
          <div className="vl-sub">
            {scase.caseId} · {scase.caseType}
          </div>
          <p className="vl-whyline">Reads the Idea 3 Evidence Graph. Writes the result back into it.</p>
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

            <button className="vl-btn primary" onClick={() => setPhase('run')}>
              Run the check →
            </button>
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
            <div className="vl-outcomes">
              {OUTCOME_ORDER.map((key) => (
                <button key={key} className="vl-btn outcome" onClick={() => chooseOutcome(key)}>
                  <b>{spec.outcomes[key].label}</b>
                  <span className="vl-why-go">▸</span>
                </button>
              ))}
            </div>
            <button className="vl-btn ghost" onClick={stop}>Stop Verification</button>
          </div>
        )}

        {phase === 'updated' && lastEffect && (
          <>
            <div className="vl-card">
              <div className="vl-card-head">Graph updated</div>
              <div className="vl-grapheffect">
                <span className="vl-ge-label">Relationship {rel ? rel.id : ''}</span>
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
              {sel.top && (
                <button className="vl-btn ghost" onClick={() => setPhase('identify')}>
                  Check the next weakest link →
                </button>
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
