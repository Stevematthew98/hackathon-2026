// Page 6 · Cross-Model Verification (optional lab).
//
// One evidence item, three independent models. Each model uses a different
// method and reports a structured finding in the Evidence Graph vocabulary
// (Consistent / Inconsistent / Cannot determine) — no scores, no verdicts.
//
// The page plays itself like Page 4 (auto-run with "Take over" for manual
// control). Recording writes the findings into the shared case state; the
// Evidence Graph shows them with cross-model provenance. Findings are base
// relationships — they move nothing and decide nothing.

import { useEffect, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { CASES } from '../graph/graphScenarios';
import { XMODEL_CASES, FINDING_LABEL } from './crossModelScenarios';
import {
  getCrossModelState,
  recordCrossModelRun,
  clearCrossModelState,
} from '../shared/caseStore';
import './CrossModel.css';

const FC = { UNKNOWN: '#8fa0b8', CONFLICT: '#f87171', SUPPORT: '#34d399' };
const RUN_MS = 1800;

function agreementText(findings) {
  const n = findings.length;
  const counts = {};
  findings.forEach((f) => {
    counts[f.finding] = (counts[f.finding] || 0) + 1;
  });
  const entries = Object.entries(counts);
  if (entries.length === 1) {
    return `All ${n} models agree — ${FINDING_LABEL[entries[0][0]].toLowerCase()}.`;
  }
  return (
    entries
      .map(([k, c]) => `${c} ${FINDING_LABEL[k].toLowerCase()}`)
      .join(' · ') + ' — shown, not averaged.'
  );
}

export default function CrossModel({ page, onNav, initialCase = 'digital-arrest' }) {
  const [caseId, setCaseId] = useState(initialCase);
  const [auto, setAuto] = useState(true);
  const [states, setStates] = useState([]); // 'idle' | 'running' | 'done' per model
  const [, setTick] = useState(0); // bump to re-read the store after record/clear
  const timers = useRef([]);

  const sc = XMODEL_CASES[caseId];
  const meta = CASES[caseId];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recorded = getCrossModelState(caseId).run;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const later = (ms, fn) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  const runModel = (i) => {
    setStates((s) => s.map((v, j) => (j === i ? 'running' : v)));
    later(RUN_MS, () => setStates((s) => s.map((v, j) => (j === i ? 'done' : v))));
  };

  // Fresh case (or remount): reset; auto-run only when nothing recorded yet.
  useEffect(() => {
    clearTimers();
    setStates(sc.models.map(() => 'idle'));
    setAuto(true);
    if (!getCrossModelState(caseId).run) {
      sc.models.forEach((_, i) => later(i * RUN_MS + 400, () => runModel(i)));
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const takeOver = () => {
    clearTimers();
    setAuto(false);
    setStates((s) => s.map((v) => (v === 'running' ? 'idle' : v)));
  };

  const switchCase = (id) => {
    if (id !== caseId) setCaseId(id);
  };

  const record = () => {
    recordCrossModelRun(caseId, {
      evidenceLabel: sc.evidenceLabel,
      findings: sc.models.map((m) => ({
        modelId: m.id,
        name: m.name,
        method: m.method,
        finding: m.finding,
        claimA: m.claimA,
        sourceA: m.sourceA,
        claimB: m.claimB,
        sourceB: m.sourceB,
        check: m.check,
        result: m.result,
        uncertainty: m.uncertainty,
        why: m.why,
      })),
    });
    setTick((t) => t + 1);
  };

  const rerun = () => {
    clearCrossModelState(caseId);
    setTick((t) => t + 1);
    setStates(sc.models.map(() => 'idle'));
    if (auto) sc.models.forEach((_, i) => later(i * RUN_MS + 400, () => runModel(i)));
  };

  const clear = () => {
    clearTimers();
    clearCrossModelState(caseId);
    setStates(sc.models.map(() => 'idle'));
    setTick((t) => t + 1);
  };

  const allDone = states.length > 0 && states.every((s) => s === 'done');
  const doneCount = states.filter((s) => s === 'done').length;

  return (
    <div className="xm-screen app-screen">
      <PageHead page={page} onNav={onNav} label="Optional lab · Cross-Model Verification" />
      <div className="app-body">
        <div className="xm-head">
          <div className="xm-eyebrow">Optional lab</div>
          <h1 className="xm-title">Cross-Model Verification</h1>
          <p className="xm-sub">One evidence item · three independent models.</p>
          <p className="xm-demo">DEMO MODE — simulated model outputs. In the live product each model runs for real.</p>
          <div className="xm-caseswitch">
            {Object.keys(XMODEL_CASES).map((id) => (
              <button
                key={id}
                className={`xm-casebtn${id === caseId ? ' on' : ''}`}
                onClick={() => switchCase(id)}
              >
                {CASES[id].tabLabel}
              </button>
            ))}
          </div>
          <div className="xm-evrow">
            <span className="xm-ev-label">Evidence under test</span>
            <b>{sc.evidenceLabel}</b>
            <span className="xm-ev-note">{sc.evidenceNote}</span>
          </div>
          <div className="xm-caseid-row">
            <span className="xm-caseid">{meta.caseId}</span>
            <span className="xm-castype">{meta.caseType}</span>
          </div>
          {auto && !recorded && (
            <button className="xm-takeover" onClick={takeOver}>Take over</button>
          )}
        </div>

        {!recorded && (
          <>
            <div className="xm-progress">
              {sc.models.map((m, i) => (
                <div key={m.id} className={`xm-step ${states[i] || 'idle'}`}>
                  <span className="xm-step-dot" />
                  <span className="xm-step-label">{m.name}</span>
                </div>
              ))}
            </div>
            {auto && !allDone && (
              <p className="xm-running-note">Analyzing… {doneCount}/{sc.models.length} models complete</p>
            )}

            <div className="xm-models">
              {sc.models.map((m, i) => {
                const st = states[i] || 'idle';
                return (
                  <div key={m.id} className={`xm-model ${st}`}>
                    <div className="xm-model-head">
                      <div>
                        <div className="xm-model-name">{m.name}</div>
                        <div className="xm-model-method">{m.method}</div>
                      </div>
                      {st === 'done' && (
                        <span className="xm-finding" style={{ color: FC[m.finding], borderColor: FC[m.finding] }}>
                          {FINDING_LABEL[m.finding]}
                        </span>
                      )}
                    </div>
                    {st === 'running' && (
                      <div className="xm-analyzing"><span className="xm-spinner" />Analyzing…</div>
                    )}
                    {st === 'done' && (
                      <div className="xm-result">
                        <p className="xm-result-text">{m.result}</p>
                        <p className="xm-unc">{m.uncertainty}</p>
                      </div>
                    )}
                    {!auto && st === 'idle' && (
                      <button className="xm-btn ghost" onClick={() => runModel(i)}>Run this model</button>
                    )}
                  </div>
                );
              })}
            </div>

            {allDone && (
              <>
                <div className="xm-agree">
                  <div className="xm-agree-label">Model agreement</div>
                  <p>{agreementText(sc.models)}</p>
                </div>
                <button className="xm-btn primary" onClick={record}>
                  Record findings in Evidence Graph
                </button>
                <p className="xm-note">Findings join the case as inspectable relationships. They move nothing and decide nothing.</p>
              </>
            )}
          </>
        )}

        {recorded && (
          <div className="xm-done">
            <div className="xm-done-head">
              <span className="xm-done-dot" />
              <b>{recorded.findings.length} findings recorded</b>
              <span className="xm-done-at">{recorded.at}</span>
            </div>
            {recorded.findings.map((f) => (
              <div key={f.modelId} className="xm-done-row">
                <span className="xm-finding sm" style={{ color: FC[f.finding], borderColor: FC[f.finding] }}>
                  {FINDING_LABEL[f.finding]}
                </span>
                <span className="xm-done-model">{f.name}</span>
              </div>
            ))}
            <p className="xm-note">Visible in the Evidence Graph with cross-model provenance.</p>
            <div className="xm-done-actions">
              <button className="xm-btn primary" onClick={() => onNav(3)}>View Evidence Graph →</button>
              <button className="xm-btn ghost" onClick={rerun}>Run again</button>
              <button className="xm-btn ghost" onClick={clear}>Clear</button>
            </div>
          </div>
        )}

        <div className="xm-foot">
          Prototype · model outputs are simulated and labeled DEMO MODE · no scores are computed
        </div>
      </div>
    </div>
  );
}
