// Idea 5 · Decision-Safe Output — the final decision layer of the TrustGuard
// case pipeline: EVIDENCE → RELATIONSHIPS → VERIFICATION → DECISION →
// UNCERTAINTY → ONE SAFE ACTION → STRUCTURED REPORT.
//
// Reads the SAME structured state Ideas 1–4 produced (graph relationships +
// the shared verification store). The verdict is recomputed live by
// decisionEngine — returning here after a check always shows the current
// decision. No scores, no percentages, no invented certainty.

import { useMemo, useState } from 'react';
import PageHead from '../PageHead';
import { CASES } from '../graph/graphScenarios';
import { buildDecision, DECISION_IDS, VERDICTS } from './decisionEngine';
import { resetVerificationState } from '../shared/caseStore';
import { downloadReport } from './reportExport';
import './DecisionOutput.css';

const EC = { UNKNOWN: '#8fa0b8', CONFLICT: '#f87171', SUPPORT: '#34d399', ANOMALY: '#f0a832' };

function Badge({ type }) {
  return (
    <span className="do-badge" style={{ background: EC[type] || '#8fa0b8' }}>
      {type}
    </span>
  );
}

function Expander({ id, openId, setOpenId, title, right, children, defaultOpen }) {
  const open = openId === id;
  return (
    <div className={`do-exp${open ? ' open' : ''}`}>
      <button className="do-exp-head" onClick={() => setOpenId(open ? null : id)}>
        <span className="do-exp-title">{title}</span>
        <span className="do-exp-right">
          {right}
          <span className="do-exp-go">{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open && <div className="do-exp-body">{children}</div>}
      {defaultOpen && !openId && <span style={{ display: 'none' }} />}
    </div>
  );
}

function ReasonCard({ reason, onViewGraph, caseId }) {
  const [open, setOpen] = useState(false);
  // kind 'verified': an Idea 3 relationship moved by an Idea 4 independent
  // check. kind 'rel': a relationship read straight from the Idea 3 graph.
  const r = reason.rel;
  const v = reason.kind === 'verified' ? reason.record : null;
  const type = r.effectiveType || r.type;
  return (
    <div className="do-reason">
      <button className="do-reason-head" onClick={() => setOpen((s) => !s)}>
        <Badge type={type} />
        <span className="do-reason-title">{v ? `Independent check — ${r.title}` : r.title}</span>
        <span className="do-exp-go">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="do-reason-body">
          <div className="do-kv"><span>Claim A</span><p>“{r.claimA}” · {r.sourceA}</p></div>
          <div className="do-kv"><span>Claim B</span><p>“{r.claimB}” · {r.sourceB}</p></div>
          <div className="do-kv"><span>Relationship</span><p><Badge type={type} /> {r.id}{v ? ' · settled by independent check' : ''}</p></div>
          {v ? (
            <>
              <div className="do-kv"><span>Why it matters</span><p>{v.newStatus === 'CONFLICT' ? 'An independent source contradicts the claim this case’s authority rests on.' : 'An independent source confirms the load-bearing claim.'}</p></div>
              <div className="do-kv"><span>Method / check</span><p>{v.method} · {v.source}</p></div>
              <div className="do-kv"><span>Result</span><p>{v.result}</p></div>
              <div className="do-kv"><span>Graph change</span><p><Badge type={v.previousStatus} /> → <Badge type={v.newStatus} /></p></div>
            </>
          ) : (
            <>
              <div className="do-kv"><span>Why it matters</span><p>{r.why}</p></div>
              <div className="do-kv"><span>Method / check</span><p>{r.check} · {r.method}</p></div>
              <div className="do-kv"><span>Confidence / uncertainty</span><p>{r.confidence !== '—' ? `${r.confidence} confidence. ` : ''}{r.uncertainty}</p></div>
              <div className="do-kv"><span>Provenance</span><p>{(r.evidence || []).map((e) => e.label).join(' · ') || r.sourceA}</p></div>
            </>
          )}
          <button className="do-linkbtn" onClick={() => onViewGraph(caseId, r.id)}>
            View in Evidence Graph →
          </button>
        </div>
      )}
    </div>
  );
}

export default function DecisionOutput({ page, onNav, initialCase = 'digital-arrest', onContinueVerify, onViewGraph }) {
  const [caseId, setCaseId] = useState(initialCase);
  const [tick, setTick] = useState(0);
  const [, setWhyOpen] = useState('r0');
  const [uncOpen, setUncOpen] = useState(true);
  const [histOpen, setHistOpen] = useState(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [reportFile, setReportFile] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const d = useMemo(() => buildDecision(caseId), [caseId, tick]);
  const vm = VERDICTS[d.verdict];

  const switchCase = (id) => {
    if (id === caseId) return;
    setCaseId(id);
    setWhyOpen('r0');
    setUncOpen(true);
    setHistOpen(null);
    setTraceOpen(false);
    setReportFile(null);
  };

  const restart = () => {
    resetVerificationState(caseId);
    setTick((t) => t + 1);
    setWhyOpen('r0');
    setHistOpen(null);
    setReportFile(null);
  };

  const t = d.trace;
  const traceSteps = [
    ['Evidence', `${t.evidenceItems} items on record`],
    ['Claims', `${t.claims} structured claims extracted`],
    ['Relationships', `${t.relCounts.CONFLICT} conflict · ${t.relCounts.ANOMALY} anomaly · ${t.relCounts.UNKNOWN} unknown · ${t.relCounts.SUPPORT} support`],
    ['Verification', t.checksDone === 0 ? 'no independent check yet' : `${t.checksDone} independent check${t.checksDone > 1 ? 's' : ''} performed`],
    ['Decision', d.verdict],
  ];

  return (
    <div className="do-screen app-screen">
      <PageHead page={page} onNav={onNav} label="Page 5 of 5 · Decision-Safe Output" />
      <div className="app-body">
        <div className="do-head">
          <div className="do-eyebrow">Idea 5 · Decision-Safe Output</div>
          <h1 className="do-title">What does all this evidence mean?</h1>
          <p className="do-sub">Ideas 1–4 investigated the case. This page answers it — with the evidence, the uncertainty, and one safe next step.</p>
          <div className="do-caseswitch">
            {DECISION_IDS.map((id) => (
              <button
                key={id}
                className={`do-casebtn${id === caseId ? ' on' : ''}`}
                onClick={() => switchCase(id)}
              >
                {CASES[id].tabLabel}
              </button>
            ))}
          </div>
          <div className="do-caseid-row">
            <span className="do-caseid">{d.caseLabel}</span>
            <span className="do-castype">{d.caseType}</span>
          </div>
          <div className="do-statusrow">
            <span className="do-status-label">Case status</span>
            <span className="do-verdict" style={{ color: vm.color, borderColor: vm.color }}>
              {d.verdict}
            </span>
          </div>
          <p className="do-assess-note">Assessment based on available evidence</p>
        </div>

        {/* 1 — FINAL DECISION */}
        <div className="do-card do-decision" style={{ borderColor: vm.color }}>
          <div className="do-sec-label">Final decision</div>
          <div className="do-bigverdict" style={{ color: vm.color }}>{d.verdict}</div>
          <p className="do-bigverdict-sub">{vm.card}</p>
          <p className="do-note">{vm.cardBody}</p>
          <p className="do-note dim">{vm.note} Assessment, not proof.</p>
        </div>

        {/* 2 — EVIDENCE */}
        <div className="do-card">
          <div className="do-sec-label">Evidence</div>
          <p className="do-note">The {d.reasons.length} findings that decided it. Tap any finding to inspect it.</p>
          {d.reasons.map((r, i) => (
            <div key={i}>
              {i > 0 && <div className="do-sep" />}
              <ReasonCard reason={r} onViewGraph={onViewGraph} caseId={caseId} />
            </div>
          ))}
        </div>

        {/* 3 — UNCERTAINTY */}
        <div className="do-card do-unc">
          <button className="do-secbtn" onClick={() => setUncOpen((v) => !v)}>
            <span className="do-sec-label" style={{ margin: 0 }}>What TrustGuard still does not know</span>
            <span className="do-exp-go">{uncOpen ? '▾' : '▸'}</span>
          </button>
          {uncOpen && (
            <div className="do-unc-body">
              {d.noUncertainty ? (
                <p className="do-note">No material unresolved uncertainty identified from the available evidence.</p>
              ) : (
                d.uncertainties.map((u, i) => (
                  <div key={i} className="do-unc-item">
                    <div className="do-unc-label">{u.label}</div>
                    <p className="do-note">{u.text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 4 — NEXT SAFEST ACTION (exactly one) */}
        <div className="do-card do-action">
          <div className="do-sec-label">Next safest action</div>
          <p className="do-action-text">{d.nextAction}</p>
          <p className="do-note dim">One action — not a checklist. TrustGuard recommends the single safest next step for this case.</p>
        </div>

        {/* 5 — VERIFICATION LOOP CONNECTION */}
        <div className="do-card">
          <div className="do-sec-label">Verification loop</div>
          {d.verdict === 'NEEDS REVIEW' ? (
            <>
              <p className="do-note">Not settled yet.{d.weakestLink ? <> The weakest link: “{d.weakestLink.verificationSpec.question}”</> : ' No further independent check is available for the remaining unknowns.'}</p>
              <button className="do-btn primary" onClick={() => onContinueVerify(caseId)}>
                Continue verification →
              </button>
              <p className="do-note dim">Completing the check recomputes this decision automatically.</p>
            </>
          ) : (
            <>
              <p className="do-note">The load-bearing claim has been independently checked. New evidence recomputes this decision.</p>
              <button className="do-btn ghost" onClick={() => onContinueVerify(caseId)}>
                Back to the Verification Loop
              </button>
            </>
          )}
        </div>

        {/* 6 — VERIFICATION HISTORY */}
        <div className="do-card">
          <div className="do-sec-label">Verification history</div>
          {d.checks.length === 0 ? (
            <p className="do-note dim">No independent verification has been performed on this case yet.</p>
          ) : (
            d.checks.map((c, i) => (
              <Expander
                key={i} id={`h${i}`} openId={histOpen} setOpenId={setHistOpen}
                title={`Verification #${i + 1} — ${c.what}`}
                right={<span className="do-hist-state">{c.state}</span>}
              >
                <div className="do-reason-body">
                  <div className="do-kv"><span>Question</span><p>“{c.question}”</p></div>
                  <div className="do-kv"><span>Independent source</span><p>{c.sourceType || '—'}</p></div>
                  <div className="do-kv"><span>Method</span><p>{c.method || 'Independent source check'}</p></div>
                  <div className="do-kv"><span>Result</span><p>{c.resultText || '—'}</p></div>
                  {c.edgeAfter && (
                    <div className="do-kv"><span>Graph change</span><p><Badge type="UNKNOWN" /> → <Badge type={c.edgeAfter} /></p></div>
                  )}
                  <div className="do-kv"><span>Effect on decision</span><p>{c.edgeAfter ? `Graph changed: ${(c.previousStatus || 'UNKNOWN')} → ${c.edgeAfter}. The decision above reflects this.` : 'No conclusion forced.'}</p></div>
                  <div className="do-kv"><span>Timestamp</span><p>{c.at}</p></div>
                </div>
              </Expander>
            ))
          )}
        </div>

        {/* 7 — DECISION TRACE */}
        <div className="do-card">
          <button className="do-secbtn" onClick={() => setTraceOpen((v) => !v)}>
            <span className="do-sec-label" style={{ margin: 0 }}>How TrustGuard reached this decision</span>
            <span className="do-exp-go">{traceOpen ? '▾' : '▸'}</span>
          </button>
          {traceOpen && (
            <div className="do-trace">
              {traceSteps.map(([label, val], i) => (
                <div key={label}>
                  <div className="do-trace-step">
                    <span className="do-trace-dot" />
                    <div>
                      <div className="do-trace-label">{label}</div>
                      <div className="do-trace-val">{val}</div>
                    </div>
                    {i === traceSteps.length - 1 && (
                      <span className="do-verdict sm" style={{ color: vm.color, borderColor: vm.color }}>{d.verdict}</span>
                    )}
                  </div>
                  {i < traceSteps.length - 1 && <div className="do-trace-arrow">↓</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8 — EXPORT */}
        <div className="do-card">
          <div className="do-sec-label">Case report</div>
          <p className="do-note">A structured evidence &amp; assessment report.</p>
          <button
            className="do-btn primary"
            onClick={() => {
              const f = downloadReport(d);
              setReportFile(f);
            }}
          >
            Export case report
          </button>
          {reportFile && <p className="do-note dim">Downloaded: {reportFile}</p>}
        </div>

        <div className="do-foot-row">
          <button className="do-btn ghost" onClick={restart}>↺ Restart demonstration</button>
        </div>

        <div className="do-foot">
          Prototype · verification results are simulated and labeled DEMO MODE on Page 4 · no scores are computed
        </div>
      </div>
    </div>
  );
}
