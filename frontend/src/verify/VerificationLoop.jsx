import { useMemo, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { VERIFY_CASES, VERIFY_IDS } from './verifyScenarios';
import { recordVerification, resetVerificationState } from '../shared/caseStore';
import VerifyChain from './VerifyChain';
import './VerificationLoop.css';

const VC = {
  HIGH_RISK: '#f87171',
  'NEEDS REVIEW': '#f0a832',
  'LOW RISK': '#34d399',
  UNRESOLVED: '#8fa0b8',
};
const EC = { UNKNOWN: '#8fa0b8', CONFLICT: '#f87171', SUPPORT: '#34d399' };

export default function VerificationLoop({ page, onNav, initialCase = 'digital-arrest', onBack }) {
  const [caseId, setCaseId] = useState(initialCase);
  const [part, setPart] = useState(1);
  const scase = VERIFY_CASES[caseId];

  // part 1 state
  const [pickedId, setPickedId] = useState(null);
  const [candOpen, setCandOpen] = useState(null); // candidate being inspected
  const [quizPick, setQuizPick] = useState(null); // index
  const [quizDone, setQuizDone] = useState(false);
  const [showWhyMatters, setShowWhyMatters] = useState(false);
  const [whyOpen, setWhyOpen] = useState(null);

  // part 2 state
  const [phase, setPhase] = useState('prep'); // prep | ask | received | folded | done | stopped
  const [outcomeKey, setOutcomeKey] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [prevVerdict, setPrevVerdict] = useState(null);
  const [flipKey, setFlipKey] = useState(0);
  const [history, setHistory] = useState([]);
  const [showProv, setShowProv] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const timers = useRef([]);

  const link = useMemo(
    () => scase.links.find((l) => l.id === pickedId) || scase.links[0],
    [scase, pickedId]
  );
  const edgeState = useMemo(() => {
    if (outcome && (phase === 'folded' || phase === 'done')) return outcome.edgeAfter;
    return 'UNKNOWN';
  }, [outcome, phase]);
  const verdictNow = useMemo(() => {
    if (phase === 'stopped') return 'UNRESOLVED';
    if (outcome && (phase === 'folded' || phase === 'done' || phase === 'received')) return outcome.verdict;
    return scase.initialVerdict;
  }, [outcome, phase, scase]);

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  const resetAll = (nextCase) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    resetVerificationState(nextCase);
    setCaseId(nextCase);
    setPart(1);
    setPickedId(null);
    setCandOpen(null);
    setQuizPick(null);
    setQuizDone(false);
    setShowWhyMatters(false);
    setWhyOpen(null);
    setPhase('prep');
    setOutcomeKey(null);
    setOutcome(null);
    setPrevVerdict(null);
    setHistory([]);
    setShowProv(false);
    setShowHist(false);
  };

  const pickCandidate = (id) => {
    setPickedId(id);
    setQuizPick(null);
    setQuizDone(false);
    setWhyOpen(null);
  };

  const answerQuiz = (idx) => {
    setQuizPick(idx);
    if (scase.quiz.options[idx].correct) {
      later(() => setQuizDone(true), 650);
    }
  };

  const chooseOutcome = (key) => {
    const o = link.outcomes[key];
    setPrevVerdict(verdictNow === 'UNRESOLVED' ? scase.initialVerdict : verdictNow);
    setOutcomeKey(key);
    setOutcome(o);
    setPhase('received');
    const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory((h) => [
      ...h,
      {
        what: link.historyWhat,
        why: link.historyWhy,
        effect: { from: 'UNKNOWN', to: o.edgeAfter },
        verdict: { from: scase.initialVerdict, to: o.verdict },
        result: o.resultText,
        state: key === 'inconclusive' ? 'Inconclusive' : 'Completed',
        at,
        caseId: scase.caseId,
      },
    ]);
    // shared with Idea 5 (Decision-Safe Output)
    recordVerification(scase.id, {
      linkId: link.id,
      relId: link.graphRelId,
      question: link.question,
      what: link.historyWhat,
      why: link.historyWhy,
      sourceType: o.sourceType,
      method: 'Independent source check',
      resultText: o.resultText,
      edgeAfter: o.edgeAfter,
      outcomeKey: key,
      verdict: o.verdict,
      nextAction: o.nextAction,
      state: key === 'inconclusive' ? 'Inconclusive' : 'Completed',
    });
    later(() => setShowHist(true), 400);
  };

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory((h) => [
      ...h,
      { what: link.historyWhat, why: link.historyWhy, effect: null, verdict: null, result: 'Verification stopped by the user before any result.', state: 'Stopped', at, caseId: scase.caseId },
    ]);
    recordVerification(scase.id, {
      linkId: link.id,
      relId: link.graphRelId,
      question: link.question,
      what: link.historyWhat,
      why: link.historyWhy,
      sourceType: null,
      method: 'Independent source check',
      resultText: 'Verification stopped by the user before any result.',
      edgeAfter: null,
      outcomeKey: 'stopped',
      verdict: null,
      nextAction: null,
      state: 'Stopped',
    });
    setPhase('stopped');
  };

  const tryAnother = () => {
    const next = scase.links.find((l) => l.id !== link.id);
    if (!next) return;
    setPickedId(next.id);
    setOutcomeKey(null);
    setOutcome(null);
    setPrevVerdict(null);
    setFlipKey((k) => k + 1);
    setShowProv(false);
    setPhase('prep');
  };

  const goPart2 = () => setPart(2);

  const steps = [
    { label: 'Evidence analyzed', state: 'done' },
    { label: 'Weakest link picked', state: pickedId ? 'done' : part === 1 ? 'now' : '' },
    { label: 'Check running', state: phase === 'prep' || phase === 'ask' ? 'now' : outcome ? 'done' : '' },
    { label: 'Result folded in', state: phase === 'done' ? 'done' : phase === 'folded' || phase === 'received' ? 'now' : '' },
  ];

  const quiz = scase.quiz;
  const inspected = scase.links.find((l) => l.id === candOpen);
  const part2Locked = !quizDone && phase !== 'done';

  return (
    <div className="vl-screen app-screen">
      <PageHead page={page} onNav={onNav} kicker="LIVE PROTOTYPE" title={`Page 4 of 5 · ${scase.pageTitle}`} />
      <div className="app-body">
        <div className="vl-head">
          <div className="vl-eyebrow">Idea 4 · The Verification Loop</div>
          <h1 className="vl-title">The Verification Loop</h1>
          <div className="vl-sub">
            {scase.caseId} · {scase.caseType}
          </div>
          <p className="vl-whyline">{scase.whyHere}</p>
          <div className="vl-statusrow">
            <span className="vl-status-label">Case status</span>
            <span className="vl-verdict" style={{ color: VC[verdictNow], borderColor: VC[verdictNow] }}>
              {verdictNow}
            </span>
          </div>
          <div className="vl-progress">
            {steps.map((s, i) => (
              <div key={i} className={`vl-step ${s.state}`}>
                <span className="vl-step-dot" />
                <span className="vl-step-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="vl-pager">
            <button className={`vl-partbtn${part === 1 ? ' on' : ''}`} onClick={() => setPart(1)}>
              <span className="vl-partnum">1</span> The weak link
            </button>
            <button
              className={`vl-partbtn${part === 2 ? ' on' : ''}`}
              disabled={part2Locked && part !== 2}
              onClick={() => !part2Locked && setPart(2)}
              title={part2Locked ? 'Pick a link and pass the independence test first' : 'Run the check'}
            >
              <span className="vl-partnum">2</span> Run the check
            </button>
          </div>
          <div className="vl-caseswitch">
            {VERIFY_IDS.map((id) => (
              <button
                key={id}
                className={`vl-casebtn${id === caseId ? ' on' : ''}`}
                onClick={() => id !== caseId && resetAll(id)}
              >
                {VERIFY_CASES[id].tabLabel}
              </button>
            ))}
          </div>
        </div>

        {part === 1 && (
          <>
            <div className="vl-card">
              <div className="vl-card-head">Why verification is needed</div>
              <VerifyChain
                chain={link.chain}
                edgeType="UNKNOWN"
                onEdgeClick={() => setShowWhyMatters((v) => !v)}
              />
              {showWhyMatters && (
                <div className="vl-panel">
                  <div className="vl-panel-head">Why this matters</div>
                  <p className="vl-note">{link.whyMatters}</p>
                  <div className="vl-ev2">
                    <div>
                      <div className="vl-ev-head">Evidence available</div>
                      <ul className="vl-list">
                        {link.evidenceAvailable.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="vl-ev-head">Evidence missing</div>
                      <ul className="vl-list">
                        {link.evidenceMissing.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="vl-card">
              <div className="vl-card-head">Find the weakest link</div>
              <p className="vl-note">The graph holds several claims. Tap the one you think is the weakest — the claim the case can least afford to leave unverified.</p>
              <div className="vl-cands">
                {scase.links.map((l) => (
                  <button
                    key={l.id}
                    className={`vl-cand${candOpen === l.id ? ' open' : ''}${pickedId === l.id ? ' picked' : ''}`}
                    onClick={() => setCandOpen(candOpen === l.id ? null : l.id)}
                  >
                    <span className="vl-cand-q">“{l.question}”</span>
                    <span className="vl-cand-go">{candOpen === l.id ? '▾' : '▸'}</span>
                  </button>
                ))}
              </div>
              {inspected && (
                <div className="vl-panel">
                  <p className="vl-note">{inspected.whyWeakest}</p>
                  <div className="vl-panel-head">This claim affects</div>
                  <div className="vl-chips">
                    {inspected.affects.map((a) => (
                      <span key={a} className="vl-chip">{a}</span>
                    ))}
                  </div>
                  <div className="vl-panel-head">Connected evidence relationships</div>
                  {(scase.relatedRels || []).map((rid) => {
                    const rm = scase.relMeta[rid];
                    return (
                      <div key={rid} className="vl-relrow">
                        <span className="vl-reldot" style={{ background: rm.color }} />
                        <span className="vl-relmain">
                          <span className="vl-reltitle">{rid}</span>
                          <span className="vl-relid">{rm.label} · from the Evidence Graph</span>
                        </span>
                        <span className="vl-typebadge" style={{ background: rm.color }}>{rm.type}</span>
                      </div>
                    );
                  })}
                  {pickedId === inspected.id ? (
                    <div className="vl-panel">
                      <p className="vl-note" style={{ margin: 0 }}>✓ Weakest link selected — continue below.</p>
                    </div>
                  ) : inspected.n === 1 ? (
                    <button className="vl-btn primary" onClick={() => pickCandidate(inspected.id)}>
                      This is the weakest link →
                    </button>
                  ) : (
                    <>
                      <p className="vl-note dim">Unknown too — but it hangs off the first link. Even a genuine-looking case number proves nothing if the officer himself is fake.</p>
                      <button className="vl-btn primary" onClick={() => pickCandidate(scase.links[0].id)}>
                        Verify the officer first (recommended) →
                      </button>
                      <button className="vl-btn ghost" onClick={() => pickCandidate(inspected.id)}>
                        Verify this one anyway
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {pickedId && (
              <div className="vl-card">
                <div className="vl-card-head">Independence test</div>
                <p className="vl-note">{quiz.prompt}</p>
                <div className="vl-quiz">
                  {quiz.options.map((opt, i) => {
                    const chosen = quizPick === i;
                    const cls = chosen ? (opt.correct ? ' right' : ' wrong') : quizDone && opt.correct ? ' right-dim' : '';
                    return (
                      <button
                        key={i}
                        className={`vl-quiz-opt${cls}`}
                        disabled={quizDone}
                        onClick={() => answerQuiz(i)}
                      >
                        <span className="vl-quiz-label">{opt.label}</span>
                        {chosen && <span className="vl-quiz-why">{opt.why}</span>}
                      </button>
                    );
                  })}
                </div>
                {quizDone && (
                  <div className="vl-panel">
                    <div className="vl-panel-head">Correct</div>
                    <p className="vl-note">{quiz.options.find((o) => o.correct).why}</p>
                    <p className="vl-note dim">That is exactly what the check below does — one verification, through a source the claimant cannot control.</p>
                  </div>
                )}
              </div>
            )}

            {quizDone && (
              <div className="vl-card vl-rec">
                <div className="vl-card-head">{link.recommendation.title}</div>
                <p className="vl-action">{link.recommendation.action}</p>
                <div className="vl-donot">
                  <div className="vl-donot-head">DO NOT</div>
                  <ul className="vl-list">
                    {link.recommendation.doNot.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <p className="vl-indep">{link.recommendation.independentLine}</p>
                {[
                  ['Why independent?', link.recommendation.whyIndependent],
                  ['Why this check?', link.recommendation.whyThisCheck],
                  ['Why only one check?', link.recommendation.whyOne],
                ].map(([q, a]) => (
                  <div key={q} className="vl-exp">
                    <button className="vl-why" onClick={() => setWhyOpen(whyOpen === q ? null : q)}>
                      {q} <span className="vl-why-go">{whyOpen === q ? '▾' : '▸'}</span>
                    </button>
                    {whyOpen === q && <p className="vl-note">{a}</p>}
                  </div>
                ))}
                <button className="vl-btn primary" onClick={goPart2}>
                  Continue to the check →
                </button>
              </div>
            )}
          </>
        )}

        {part === 2 && (
          <>
            <div className="vl-card">
              <div className="vl-card-head">Check in progress</div>
              <p className="vl-note dim" style={{ marginTop: 0 }}>
                Weakest link: “{link.question}”
                {(phase === 'prep' || phase === 'ask') && (
                  <button className="vl-linkbtn" onClick={() => setPart(1)}> change</button>
                )}
              </p>
              <VerifyChain
                chain={link.chain}
                edgeType={edgeState}
                animating={phase === 'folded' || phase === 'done'}
                compact
              />
            </div>

            {phase === 'prep' && (
              <div className="vl-card vl-stepcard">
                <div className="vl-stepnum">Step 1 · Prepare</div>
                <p className="vl-note">Use a source the caller doesn’t control.</p>
                <div className="vl-panel">
                  <div className="vl-panel-head">Independent source</div>
                  <p className="vl-note">{link.recommendation.action}</p>
                  <div className="vl-panel-head">Ask exactly this</div>
                  <p className="vl-question">“{link.question}”</p>
                </div>
                <button className="vl-btn primary" onClick={() => setPhase('ask')}>
                  I’m ready — make the check
                </button>
                <button className="vl-btn ghost" onClick={stop}>Stop Verification</button>
              </div>
            )}

            {phase === 'ask' && (
              <div className="vl-card vl-stepcard">
                <div className="vl-stepnum">Step 2 · Ask &amp; record</div>
                <p className="vl-note">Ask the question through the independent source, then record what came back.</p>
                <div className="vl-demo-tag">DEMO MODE — the external result is simulated. In the live product this would be the real answer.</div>
                <div className="vl-outcomes">
                  {Object.entries(link.outcomes).map(([key, o]) => (
                    <button key={key} className="vl-btn outcome" onClick={() => chooseOutcome(key)}>
                      <b>{o.label}</b>
                      <span className="vl-why-go">▸</span>
                    </button>
                  ))}
                </div>
                <button className="vl-btn ghost" onClick={stop}>Stop Verification</button>
              </div>
            )}

            {phase === 'received' && outcome && (
              <div className="vl-card vl-stepcard">
                <div className="vl-stepnum">Step 3 · Fold it in</div>
                <div className="vl-resline">
                  <span>Source</span>
                  <b>{outcome.sourceType}</b>
                </div>
                <div className="vl-resline">
                  <span>Result</span>
                  <b>{outcome.resultText}</b>
                </div>
                <p className="vl-note">This is new evidence. Fold it into the graph to update the relationship.</p>
                <button className="vl-btn primary" onClick={() => { setFlipKey((k) => k + 1); setPhase('folded'); }}>
                  Fold into the evidence graph →
                </button>
              </div>
            )}

            {phase === 'folded' && outcome && (
              <div className="vl-card vl-stepcard">
                <div className="vl-stepnum">Step 4 · Recompute</div>
                <div className="vl-grapheffect">
                  <span className="vl-ge-label">Graph effect</span>
                  <span className="vl-ge-flow">
                    <span className="vl-typebadge" style={{ background: EC.UNKNOWN }}>UNKNOWN</span>
                    <span className="vl-ge-arrow">→</span>
                    <span className="vl-typebadge" style={{ background: EC[outcome.edgeAfter] }}>{outcome.edgeAfter}</span>
                  </span>
                </div>
                <p className="vl-note">The relationship is updated. Now recompute what the case means.</p>
                <button className="vl-btn primary" onClick={() => setPhase('done')}>
                  Recompute the verdict →
                </button>
              </div>
            )}

            {phase === 'done' && outcome && (
              <>
                <div className="vl-card">
                  <div className="vl-recomputed">CASE RECOMPUTED</div>
                  <div className="vl-statusrow big">
                    <span className="vl-status-label">Verdict</span>
                    <span className="vl-verdict" style={{ color: VC[outcome.verdict], borderColor: VC[outcome.verdict] }}>
                      {outcome.verdict}
                    </span>
                  </div>
                  <p className="vl-note">{outcome.verdictNote}</p>
                  <div className="vl-nextaction">
                    <div className="vl-panel-head">Next safest action</div>
                    <p className="vl-note" style={{ margin: 0 }}>{outcome.nextAction}</p>
                  </div>
                  {outcomeKey === 'inconclusive' && scase.links.length > 1 && link.n === 1 && (
                    <button className="vl-btn primary" onClick={tryAnother}>
                      Try another verification →
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
                          {h.effect && (
                            <div className="vl-ge-flow">
                              <span className="vl-typebadge" style={{ background: EC[h.effect.from] }}>{h.effect.from}</span>
                              <span className="vl-ge-arrow">→</span>
                              <span className="vl-typebadge" style={{ background: EC[h.effect.to] }}>{h.effect.to}</span>
                            </div>
                          )}
                          <div className="vl-hist-meta">
                            {h.state} · {h.at} · {h.caseId}
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
                  {showProv && (
                    <div className="vl-prov">
                      {[
                        ['Claim', `Caller claims: ${link.chain.nodes[1]} — ${link.chain.edgeLabel.toLowerCase()} ${'unknown'}`],
                        ['Question', link.question],
                        ['Verification', link.recommendation.action],
                        ['Result', `${outcome.sourceType} — ${outcome.resultText}`],
                        ['Graph effect', `${link.chain.edgeLabel}: ${'UNKNOWN'} → ${outcome.edgeAfter}`],
                        ['Verdict effect', `${prevVerdict || scase.initialVerdict} → ${outcome.verdict}`],
                      ].map(([k, v]) => (
                        <div key={k} className="vl-prov-row">
                          <span>{k}</span>
                          <p>{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="vl-card">
                  <div className="vl-card-head">Case status</div>
                  <div className="vl-statusrow">
                    <span className="vl-verdict" style={{ color: VC[outcome.verdict], borderColor: VC[outcome.verdict] }}>
                      {outcome.verdict}
                    </span>
                  </div>
                  <div className="vl-statusgrid">
                    <div>
                      <span>Evidence</span>
                      <p>{history.length + 2} items on record · {history.filter((h) => h.state === 'Completed').length} independent verification added</p>
                    </div>
                    <div>
                      <span>Uncertainty</span>
                      <p>{outcomeKey === 'inconclusive' ? 'Unresolved — further verification needed.' : `Resolved via independent verification (${outcome.edgeAfter}).`}</p>
                    </div>
                    <div>
                      <span>Independent verification</span>
                      <p>{outcome.sourceType} · {history.length ? history[history.length - 1].at : ''}</p>
                    </div>
                    <div>
                      <span>Next safest action</span>
                      <p>{outcome.nextAction}</p>
                    </div>
                  </div>
                  <p className="vl-note dim">The loop is complete — the new independent evidence is folded into the case above.</p>
                  <button className="vl-btn primary" onClick={() => onNav(5)}>
                    See the decision →
                  </button>
                  <button className="vl-btn ghost" onClick={() => (onBack ? onBack() : onNav(3))}>
                    ← Back to Evidence Graph
                  </button>
                </div>
              </>
            )}

            {phase === 'stopped' && (
              <div className="vl-card vl-stepcard">
                <div className="vl-stepnum">Verification stopped</div>
                <div className="vl-statusrow big">
                  <span className="vl-status-label">Case status</span>
                  <span className="vl-verdict" style={{ color: VC.UNRESOLVED, borderColor: VC.UNRESOLVED }}>UNRESOLVED</span>
                </div>
                <p className="vl-note">No conclusion was forced because independent evidence was not obtained.</p>
                <button className="vl-btn primary" onClick={() => { setPart(1); setPhase('prep'); setOutcome(null); setOutcomeKey(null); }}>
                  Back to the weakest link
                </button>
                <button className="vl-btn ghost" onClick={() => onNav(5)}>
                  See the decision →
                </button>
              </div>
            )}
          </>
        )}

        <div className="vl-foot">
          Prototype · simulated verification results are labeled DEMO MODE · no scores are computed
        </div>
      </div>
    </div>
  );
}
