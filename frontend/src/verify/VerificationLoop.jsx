// Idea 4 · The Verification Loop.
//
// UNCERTAINTY → WEAKEST LINK → ONE INDEPENDENT CHECK → VERIFICATION
// → NEW EVIDENCE → GRAPH UPDATE → VERDICT RECOMPUTED
//
// Consumes Idea 3 case data read-only (graphScenarios). Verification results
// are DEMO MODE simulations — the UI state machine is real, the external
// result is honestly labeled as simulated. No scores, no "genuine", no
// verdicts beyond HIGH RISK / NEEDS REVIEW / LOW RISK.
import { useEffect, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { CASES, REL_META } from '../graph/graphScenarios';
import { VERIFY_CASES, VERIFY_IDS, VERDICT_META } from './verifyScenarios';
import VerifyChain from './VerifyChain';
import './VerificationLoop.css';

const PROGRESS = ['Evidence analyzed', 'Weakest link identified', 'Verification required', 'Result pending'];

function later(timers, ms, fn) {
  const t = setTimeout(fn, ms);
  timers.current.push(() => clearTimeout(t));
}

function Expander({ label, children, open, onToggle }) {
  return (
    <div className="vl-exp">
      <button className="vl-why" onClick={onToggle} aria-expanded={!!open}>
        {label}<span className="vl-why-go">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="vl-panel">{children}</div>}
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const m = VERDICT_META[verdict] || VERDICT_META['NEEDS REVIEW'];
  return (
    <span className="vl-verdict" style={{ borderColor: m.color, color: m.color }}>
      {verdict}
    </span>
  );
}

export default function VerificationLoop({ page, onNav, initialCase }) {
  const [caseId, setCaseId] = useState(initialCase || 'digital-arrest');
  const [linkIdx, setLinkIdx] = useState(0);
  const [stage, setStage] = useState('link'); // link|running|awaiting|received|updated|done|stopped
  const [edgeType, setEdgeType] = useState('UNKNOWN');
  const [verdict, setVerdict] = useState(null);
  const [prevVerdict, setPrevVerdict] = useState(null);
  const [outcomeKey, setOutcomeKey] = useState(null);
  const [edgeFlip, setEdgeFlip] = useState(false);
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState({}); // expander toggles
  const timers = useRef([]);

  const vc = VERIFY_CASES[caseId];
  const sc = CASES[caseId];
  const link = vc.links[linkIdx];
  const outcome = outcomeKey ? link.outcomes[outcomeKey] : null;
  const hasNextLink = linkIdx < vc.links.length - 1;

  const reset = (id) => {
    timers.current.forEach((c) => c()); timers.current = [];
    setCaseId(id);
    setLinkIdx(0);
    setStage('link');
    setEdgeType('UNKNOWN');
    setVerdict(VERIFY_CASES[id].initialVerdict);
    setPrevVerdict(null);
    setOutcomeKey(null);
    setEdgeFlip(false);
    setHistory([]);
    setOpen({});
  };

  useEffect(() => {
    setVerdict(vc.initialVerdict);
    return () => timers.current.forEach((c) => c());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialCase && initialCase !== caseId) reset(initialCase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCase]);

  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const progressState = (i) => {
    if (stage === 'done') return 'done';
    if (stage === 'stopped') return i < 3 ? 'done' : 'todo';
    const nowAt = stage === 'link' ? 1 : stage === 'running' || stage === 'awaiting' ? 2 : 3;
    if (i < nowAt) return 'done';
    return i === nowAt ? 'now' : 'todo';
  };

  // ---- state machine ----
  const startVerification = () => {
    setStage('running');
    later(timers, 1300, () => setStage('awaiting'));
  };

  const stopVerification = () => {
    timers.current.forEach((c) => c()); timers.current = [];
    setStage('stopped');
    setPrevVerdict(verdict);
    setVerdict('UNRESOLVED');
  };

  const chooseOutcome = (key) => {
    timers.current.forEach((c) => c()); timers.current = [];
    setOutcomeKey(key);
    setStage('received');
    const oc = link.outcomes[key];
    later(timers, 1500, () => {
      setEdgeType(oc.edgeAfter);
      setEdgeFlip(true);
      setStage('updated');
    });
    later(timers, 3200, () => {
      setEdgeFlip(false);
      setPrevVerdict(verdict);
      setVerdict(oc.verdict);
      setStage('done');
      setHistory((h) => [
        ...h,
        {
          n: h.length + 1,
          what: link.historyWhat,
          why: link.historyWhy,
          sourceType: oc.sourceType,
          result: oc.resultText,
          before: 'UNKNOWN',
          after: oc.edgeAfter,
          time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          caseId: vc.caseId,
        },
      ]);
    });
  };

  const nextLink = () => {
    timers.current.forEach((c) => c()); timers.current = [];
    setLinkIdx((i) => i + 1);
    setStage('link');
    setEdgeType('UNKNOWN');
    setOutcomeKey(null);
    setEdgeFlip(false);
    setOpen({});
  };

  const relatedRels = (vc.relatedRels || [])
    .map((id) => sc.relationships.find((r) => r.id === id))
    .filter(Boolean);

  const showResult = stage === 'received' || stage === 'updated' || stage === 'done';
  const resolved = stage === 'done' && outcomeKey !== 'inconclusive';

  return (
    <div className="sh-root">
      <PageHead page={page} onNav={onNav} label="Page 4 of 5 · The Verification Loop" />
      <div className="sh-stage">
        <div className="sh-phone">
          <div className="sh-screen vl-screen">

            {/* ================= A · case header ================= */}
            <div className="vl-head">
              <div className="vl-eyebrow">TrustGuard · Verification Loop</div>
              <h1 className="vl-title">{vc.caseId}</h1>
              <div className="vl-sub">{vc.caseType}</div>
              <div className="vl-statusrow">
                <span className="vl-status-label">Status</span>
                {verdict && <VerdictBadge verdict={verdict} />}
              </div>
              <p className="vl-whyline">{vc.whyHere}</p>
              <div className="vl-progress">
                {PROGRESS.map((p, i) => (
                  <div key={p} className={`vl-step ${progressState(i)}`}>
                    <span className="vl-step-dot" />
                    <span className="vl-step-label">{p}</span>
                  </div>
                ))}
              </div>
              <div className="vl-caseswitch">
                {VERIFY_IDS.map((id) => (
                  <button
                    key={id}
                    className={`vl-casebtn${id === caseId ? ' on' : ''}`}
                    onClick={() => reset(id)}
                  >
                    {id === 'legit-bank' && caseId !== 'legit-bank' ? 'Try Legitimate Bank Scenario' : VERIFY_CASES[id].tabLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* ================= B · why are we here ================= */}
            <section className="vl-card">
              <div className="vl-card-head">Why verification is needed</div>
              <VerifyChain
                chain={link.chain}
                edgeType={edgeType}
                animating={edgeFlip}
                onEdgeClick={edgeType === 'UNKNOWN' ? () => toggle('whyMatters') : undefined}
              />
              {open.whyMatters && edgeType === 'UNKNOWN' && (
                <div className="vl-panel">
                  <div className="vl-panel-head">WHY THIS MATTERS</div>
                  <p className="vl-note">{link.whyMatters}</p>
                  <div className="vl-ev2">
                    <div>
                      <div className="vl-ev-head">Evidence available</div>
                      <ul className="vl-list">{link.evidenceAvailable.map((e) => <li key={e}>{e}</li>)}</ul>
                    </div>
                    <div>
                      <div className="vl-ev-head">Evidence missing</div>
                      <ul className="vl-list">{link.evidenceMissing.map((e) => <li key={e}>{e}</li>)}</ul>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ================= C · weakest link ================= */}
            <section className="vl-card vl-weakest">
              <div className="vl-warn">⚠ WEAKEST LINK</div>
              <p className="vl-question">“{link.question}”</p>
              <p className="vl-note">{link.loadBearing}</p>
              {!open.whyWeakest && (
                <button className="vl-btn" onClick={() => toggle('whyWeakest')}>
                  Show why this is the weakest link
                </button>
              )}
              {open.whyWeakest && (
                <div className="vl-panel">
                  <p className="vl-note">{link.whyWeakest}</p>
                  <div className="vl-panel-head">This claim affects</div>
                  <div className="vl-chips">
                    {link.affects.map((a) => <span key={a} className="vl-chip">{a}</span>)}
                  </div>
                  <div className="vl-panel-head">Connected evidence relationships</div>
                  {relatedRels.map((r) => (
                    <div key={r.id} className="vl-relrow">
                      <span className="vl-reldot" style={{ background: REL_META[r.type].color }} />
                      <span className="vl-relmain">
                        <span className="vl-reltitle">{r.title}</span>
                        <span className="vl-relid">{r.id} · from the Evidence Graph</span>
                      </span>
                      <span className="vl-typebadge" style={{ background: REL_META[r.type].color }}>{REL_META[r.type].label}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ================= D · exactly one verification ================= */}
            {(stage === 'link') && (
              <section className="vl-card vl-rec">
                <div className="vl-card-head">{link.recommendation.title}</div>
                <p className="vl-action">{link.recommendation.action}</p>
                <div className="vl-donot">
                  <div className="vl-donot-head">DO NOT</div>
                  <ul className="vl-list">
                    {link.recommendation.doNot.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                </div>
                <p className="vl-indep">“{link.recommendation.independentLine}”</p>
                <Expander label="Why independent?" open={open.whyInd} onToggle={() => toggle('whyInd')}>
                  <p className="vl-note">{link.recommendation.whyIndependent}</p>
                </Expander>
                <Expander label="Why this check?" open={open.whyThis} onToggle={() => toggle('whyThis')}>
                  <p className="vl-note">{link.recommendation.whyThisCheck}</p>
                </Expander>
                <Expander label="Why only one check?" open={open.whyOne} onToggle={() => toggle('whyOne')}>
                  <p className="vl-note">{link.recommendation.whyOne}</p>
                </Expander>
                <button className="vl-btn primary" onClick={startVerification}>
                  Start Verification
                </button>
              </section>
            )}

            {/* ================= E · verification in progress ================= */}
            {(stage === 'running' || stage === 'awaiting') && (
              <section className="vl-card">
                <div className="vl-card-head">VERIFICATION IN PROGRESS</div>
                <div className="vl-vsteps">
                  <div className="vl-vstep done"><span className="vl-vtick">✓</span> Independent source selected</div>
                  <div className="vl-vstep done"><span className="vl-vtick">✓</span> Verification question prepared</div>
                  <div className={`vl-vstep${stage === 'awaiting' ? ' now' : ''}`}>
                    <span className="vl-vtick">{stage === 'awaiting' ? '…' : '·'}</span> Awaiting result
                  </div>
                </div>
                {stage === 'awaiting' && (
                  <>
                    <div className="vl-demo-tag">DEMO MODE — the external result is simulated</div>
                    <p className="vl-note">How did the independent verification resolve?</p>
                    <div className="vl-outcomes">
                      {Object.values(link.outcomes).map((o) => (
                        <button key={o.key} className="vl-btn outcome" onClick={() => chooseOutcome(o.key)}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <button className="vl-btn ghost" onClick={stopVerification}>
                      Stop Verification
                    </button>
                  </>
                )}
              </section>
            )}

            {/* ================= F · result ================= */}
            {showResult && outcome && (
              <section className="vl-card">
                <div className="vl-card-head">
                  {outcomeKey === 'inconclusive' ? 'VERIFICATION INCONCLUSIVE' : 'INDEPENDENT EVIDENCE RECEIVED'}
                </div>
                <div className="vl-resline"><span>Source</span><b>{outcome.sourceType}</b></div>
                <div className="vl-resline"><span>Result</span><b>{outcome.resultText}</b></div>
                {(stage === 'updated' || stage === 'done') && (
                  <>
                    <div className="vl-grapheffect">
                      <span className="vl-ge-label">Graph effect</span>
                      <span className="vl-ge-flow">
                        <span className="vl-typebadge" style={{ background: REL_META.UNKNOWN.color }}>UNKNOWN</span>
                        <span className="vl-ge-arrow">→</span>
                        <span className="vl-typebadge" style={{ background: REL_META[outcome.edgeAfter].color }}>{REL_META[outcome.edgeAfter].label}</span>
                      </span>
                    </div>
                    <VerifyChain chain={link.chain} edgeType={edgeType} animating={edgeFlip} compact />
                  </>
                )}
                {stage === 'done' && (
                  <>
                    <div className="vl-recomputed">CASE RECOMPUTED</div>
                    <div className="vl-statusrow">
                      <span className="vl-status-label">Verdict</span>
                      <VerdictBadge verdict={outcome.verdict} />
                    </div>
                    <p className="vl-note">{outcome.verdictNote}</p>
                    <div className="vl-nextaction">
                      <div className="vl-panel-head">Safest next action</div>
                      <p className="vl-note">{outcome.nextAction}</p>
                    </div>
                    {outcomeKey === 'inconclusive' && hasNextLink && (
                      <button className="vl-btn primary" onClick={nextLink}>
                        Try another verification
                      </button>
                    )}
                    {outcomeKey === 'inconclusive' && !hasNextLink && (
                      <p className="vl-note dim">No further single checks are available for this case. The case stays NEEDS REVIEW until independent evidence arrives.</p>
                    )}
                    {resolved && (
                      <p className="vl-note dim">The loop is complete — the new independent evidence is folded into the case above.</p>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ================= stopped ================= */}
            {stage === 'stopped' && (
              <section className="vl-card">
                <div className="vl-card-head">Verification stopped</div>
                <div className="vl-statusrow">
                  <span className="vl-status-label">Status</span>
                  <VerdictBadge verdict="UNRESOLVED" />
                </div>
                <p className="vl-note">No conclusion was forced because independent evidence was not obtained.</p>
                <button className="vl-btn" onClick={() => { setStage('link'); setVerdict(prevVerdict || vc.initialVerdict); }}>
                  Back to the weakest link
                </button>
              </section>
            )}

            {/* ================= G · history ================= */}
            {history.length > 0 && (
              <section className="vl-card">
                <button className="vl-secbtn" onClick={() => toggle('history')}>
                  VERIFICATION HISTORY · {history.length}<span className="vl-why-go">{open.history ? '▾' : '▸'}</span>
                </button>
                {open.history && (
                  <div className="vl-hist">
                    {history.map((h) => (
                      <div key={h.n} className="vl-hist-item">
                        <div className="vl-hist-head">{h.n}. {h.what}</div>
                        <div className="vl-ge-flow">
                          <span className="vl-typebadge" style={{ background: REL_META[h.before].color }}>{h.before}</span>
                          <span className="vl-ge-arrow">→</span>
                          <span className="vl-typebadge" style={{ background: REL_META[h.after].color }}>{h.after}</span>
                        </div>
                        <div className="vl-hist-meta">{h.sourceType} · Completed · {h.time} · {h.caseId}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ================= H · provenance ================= */}
            {stage === 'done' && outcome && (
              <section className="vl-card">
                <button className="vl-secbtn" onClick={() => toggle('prov')}>
                  View evidence provenance<span className="vl-why-go">{open.prov ? '▾' : '▸'}</span>
                </button>
                {open.prov && (
                  <div className="vl-prov">
                    <div className="vl-prov-row"><span>CLAIM</span><p>Caller claims to be {link.chain.nodes[1]}.</p></div>
                    <div className="vl-prov-row"><span>QUESTION</span><p>{link.question}</p></div>
                    <div className="vl-prov-row"><span>VERIFICATION</span><p>{outcome.sourceType} — {link.recommendation.action}</p></div>
                    <div className="vl-prov-row"><span>RESULT</span><p>{outcome.resultText}</p></div>
                    <div className="vl-prov-row"><span>GRAPH EFFECT</span><p>UNKNOWN → {outcome.edgeAfter}</p></div>
                    <div className="vl-prov-row"><span>VERDICT EFFECT</span><p>{prevVerdict} → {outcome.verdict}</p></div>
                  </div>
                )}
              </section>
            )}

            {/* ================= I · case status ================= */}
            {verdict && (
              <section className="vl-card vl-status">
                <div className="vl-card-head">CASE STATUS</div>
                <div className="vl-statusrow big">
                  <VerdictBadge verdict={verdict} />
                </div>
                <div className="vl-statusgrid">
                  <div><span>Evidence</span><p>{link.evidenceAvailable.length} items on record{history.length > 0 ? ` · ${history.length} independent verification${history.length > 1 ? 's' : ''} added` : ''}</p></div>
                  <div><span>Uncertainty</span><p>{edgeType === 'UNKNOWN' ? 'One load-bearing claim remains unverified.' : `Resolved via independent verification (${edgeType}).`}</p></div>
                  <div><span>Independent verification</span><p>{history.length > 0 ? history.map((h) => h.result).join(' ') : 'Not yet obtained.'}</p></div>
                  <div><span>Next safest action</span><p>{outcome && stage === 'done' ? outcome.nextAction : stage === 'stopped' ? 'No action forced — verification was stopped.' : 'Complete the single independent check above.'}</p></div>
                </div>
                <button className="vl-btn ghost" onClick={() => onNav(3)}>
                  ← Back to Evidence Graph
                </button>
              </section>
            )}

            <p className="vl-foot">Prototype · simulated verification results are labeled DEMO MODE · no scores are computed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
