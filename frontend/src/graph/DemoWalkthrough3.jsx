// Idea 3 · Demo walkthrough — presenter script for the Evidence Graph.
//
// Additive: narrates how the graph works ("Say") and drives the prototype
// itself ("Tap"). Mounted inside EvidenceGraph; every live button calls a
// callback the page already owns — nothing in Ideas 1, 2, 4 or 5 is touched.

import { useMemo, useState } from 'react';
import { CASES } from './graphScenarios';
import './DemoWalkthrough3.css';

const CASE_IDS = Object.keys(CASES);

const FOCUS_NOTE = {
  'digital-arrest':
    'Point out R1: a claim-vs-claim CONFLICT — those two cannot both be true. Then note R4: the caller’s identity is still UNKNOWN. That unknown is the weakest link.',
  'legit-bank':
    'Point out R1: strong SUPPORT — the number matches the official bank directory. And note the discipline: the graph still declares nothing. It only reports relationships.',
  'customs-sms':
    'Point out the two load-bearing UNKNOWNs — sender identity and parcel reference. The graph cannot settle this; that is exactly the Verification Loop’s job.',
};

function Cue({ label, children }) {
  return (
    <div className="dw3-cue">
      <span className="dw3-cue-label">{label}</span>
      <span className="dw3-cue-text">{children}</span>
    </div>
  );
}

export default function DemoWalkthrough3({
  caseId, onSwitchCase, onOpenRel, onTakeTour, onShowGraphLab, onReplay, onGoVerify,
}) {
  const [open, setOpen] = useState(true);

  const mix = useMemo(() => {
    const c = { CONFLICT: 0, ANOMALY: 0, UNKNOWN: 0, strong: 0, weak: 0 };
    CASES[caseId].relationships.forEach((r) => {
      if (r.type === 'SUPPORT') { if (r.supportLevel === 'weak') c.weak += 1; else c.strong += 1; }
      else c[r.type] += 1;
    });
    const parts = [];
    if (c.CONFLICT) parts.push(`${c.CONFLICT} CONFLICT`);
    if (c.ANOMALY) parts.push(`${c.ANOMALY} ${c.ANOMALY > 1 ? 'ANOMALIES' : 'ANOMALY'}`);
    if (c.UNKNOWN) parts.push(`${c.UNKNOWN} UNKNOWN`);
    if (c.strong) parts.push(`${c.strong} STRONG SUPPORT`);
    if (c.weak) parts.push(`${c.weak} WEAK SUPPORT`);
    return parts.join(' · ');
  }, [caseId]);

  return (
    <div className="dw3-panel">
      <button className="dw3-head" onClick={() => setOpen((v) => !v)}>
        <span className="dw3-head-left">
          <span className="dw3-play">▶</span>
          <span className="dw3-head-title">Guided demo walkthrough</span>
        </span>
        <span className="dw3-go">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="dw3-body">
          <p className="dw3-intro">
            A presenter script that runs <em>on this page</em> — narrate the “Say” lines,
            tap the “Tap” buttons. Nothing is pre-recorded; everything below is live.
          </p>

          {/* STEP 1 */}
          <div className="dw3-step">
            <div className="dw3-step-num">1</div>
            <div className="dw3-step-main">
              <Cue label="Say">
                “Ideas 1–2 built the case. This page <strong>investigates</strong> it —
                but notice: no verdict, no score. The graph detects{' '}
                <strong>relationships</strong> between claims and evidence.”
              </Cue>
              <Cue label="Tap">
                Switch cases and compare their mixes — each case investigates differently:
              </Cue>
              <div className="dw3-casebtns">
                {CASE_IDS.map((id) => (
                  <button
                    key={id}
                    className={`dw3-casebtn${id === caseId ? ' on' : ''}`}
                    onClick={() => onSwitchCase(id)}
                  >
                    {CASES[id].tabLabel}
                  </button>
                ))}
              </div>
              <div className="dw3-mix">{mix}</div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="dw3-step">
            <div className="dw3-step-num">2</div>
            <div className="dw3-step-main">
              <Cue label="Say">
                “Watch raw words become structured claims. The AI only{' '}
                <strong>translates</strong> — it never decides truth.”
              </Cue>
              <Cue label="Tap">
                Switch cases above to replay the extraction animation — or take the
                built-in auto-tour:
              </Cue>
              <button className="dw3-btn" onClick={onTakeTour}>
                Take the 6-step guided tour →
              </button>
              <p className="dw3-note">
                Then tap any claim card below to inspect its source, evidence location
                and extraction method.
              </p>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="dw3-step">
            <div className="dw3-step-num">3</div>
            <div className="dw3-step-main">
              <Cue label="Say">
                “Every relationship carries a <strong>birth certificate</strong>: claim A
                vs claim B, the check, the method, the result — and its uncertainty.”
              </Cue>
              <Cue label="Tap">
                <button className="dw3-btn" onClick={() => onOpenRel('R1')}>
                  Open R1’s birth certificate →
                </button>
              </Cue>
              <p className="dw3-note">{FOCUS_NOTE[caseId]}</p>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="dw3-step">
            <div className="dw3-step-num">4</div>
            <div className="dw3-step-main">
              <Cue label="Say">
                “Part 2 is the graph lab — the same relationships as a living graph.
                Drag nodes, filter edge types, replay the analysis check by check.”
              </Cue>
              <Cue label="Tap">
                <button className="dw3-btn" onClick={onShowGraphLab}>
                  Open the graph lab →
                </button>
                <button className="dw3-btn ghost" onClick={onReplay}>
                  Replay the analysis →
                </button>
              </Cue>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="dw3-step">
            <div className="dw3-step-num">5</div>
            <div className="dw3-step-main">
              <Cue label="Say">
                “The graph ends where the next idea begins: the{' '}
                <strong>weakest link</strong> decides what gets verified. The graph
                points at it — the Verification Loop tests it.”
              </Cue>
              <Cue label="Tap">
                <button className="dw3-btn" onClick={onGoVerify}>
                  Continue to the Verification Loop →
                </button>
              </Cue>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
