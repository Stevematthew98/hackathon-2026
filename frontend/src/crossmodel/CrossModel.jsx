// Page 6 · Cross-Model Verification (optional lab).
//
// AI-generated or manipulated? Each image exhibit is examined by three
// forensic models, each using a different method. Findings use the Evidence
// Graph vocabulary only (Consistent / Inconsistent / Cannot determine) —
// no scores, no percentages, no verdicts.
//
// The page plays itself (auto-run with "Take over" for manual control).
// Exhibit images are AI-generated demo props and every model output is
// scripted (DEMO MODE). In the live product each model runs for real.

import { useEffect, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { EXHIBITS, EXHIBIT_IDS, FINDING_LABEL } from './crossModelScenarios';
import './CrossModel.css';

const FC = { UNKNOWN: '#8fa0b8', CONFLICT: '#f87171', SUPPORT: '#34d399' };
const RUN_MS = 1800;

function agreementText(models) {
  const n = models.length;
  const counts = {};
  models.forEach((m) => {
    counts[m.finding] = (counts[m.finding] || 0) + 1;
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

export default function CrossModel({ page, onNav }) {
  const [exhibitId, setExhibitId] = useState(EXHIBIT_IDS[0]);
  const [auto, setAuto] = useState(true);
  const [states, setStates] = useState([]);
  const timers = useRef([]);

  const ex = EXHIBITS[exhibitId];

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

  // Fresh exhibit (or remount): reset and auto-run.
  useEffect(() => {
    clearTimers();
    setStates(ex.models.map(() => 'idle'));
    setAuto(true);
    ex.models.forEach((_, i) => later(i * RUN_MS + 400, () => runModel(i)));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhibitId]);

  const takeOver = () => {
    clearTimers();
    setAuto(false);
    setStates((s) => s.map((v) => (v === 'running' ? 'idle' : v)));
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
          <p className="xm-sub">AI-generated or manipulated? Three forensic models examine each image.</p>
          <p className="xm-demo">DEMO MODE — the exhibits are AI-generated demo images and every model output is simulated. In the live product each model runs for real.</p>

          <div className="xm-exhibits">
            {EXHIBIT_IDS.map((id) => {
              const e = EXHIBITS[id];
              return (
                <button
                  key={id}
                  className={`xm-exhibit${id === exhibitId ? ' on' : ''}`}
                  onClick={() => id !== exhibitId && setExhibitId(id)}
                >
                  <img src={e.img} alt="" className="xm-thumb" />
                  <span className="xm-exhibit-meta">
                    <b>{e.exhibit}</b>
                    <span>{e.title}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {auto && !allDone && (
            <button className="xm-takeover" onClick={takeOver}>Take over</button>
          )}
        </div>

        <div className="xm-image-wrap">
          <img src={ex.img} alt={ex.imgAlt} className="xm-image" />
          <div className="xm-image-cap">
            <b>{ex.exhibit} · {ex.title}</b>
            <span>{ex.source}</span>
          </div>
        </div>

        <div className="xm-progress">
          {ex.models.map((m, i) => (
            <div key={m.id} className={`xm-step ${states[i] || 'idle'}`}>
              <span className="xm-step-dot" />
              <span className="xm-step-label">{m.name}</span>
            </div>
          ))}
        </div>
        {auto && !allDone && (
          <p className="xm-running-note">Analyzing… {doneCount}/{ex.models.length} models complete</p>
        )}

        <div className="xm-models">
          {ex.models.map((m, i) => {
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
          <div className="xm-agree">
            <div className="xm-agree-label">Model agreement</div>
            <p>{agreementText(ex.models)}</p>
          </div>
        )}

        <div className="xm-foot">
          Prototype · exhibits are AI-generated demo images · model outputs are simulated and labeled DEMO MODE · no scores are computed · findings are evidence, not a verdict
        </div>
      </div>
    </div>
  );
}
