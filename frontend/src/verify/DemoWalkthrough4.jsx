// Idea 4 · Demo walkthrough — presenter script for the Verification Loop.
//
// Additive: narrates the loop ("Say") and drives the prototype itself
// ("Tap"). Mounted inside VerificationLoop; live buttons call callbacks the
// page already owns — Ideas 1–3 and 5 are untouched.

import { useState } from 'react';
import { VERIFY_CASES, VERIFY_IDS } from './verifyScenarios';
import './DemoWalkthrough4.css';

const INDEP_SOURCE = {
  'digital-arrest':
    'The independent source here: the Cyber Crime Branch number from the official police website — the caller cannot change it, spoof it, or intercept it.',
  'legit-bank':
    'The independent source here: the number printed on the back of your bank card — issued by the bank before this call existed.',
  'customs-sms':
    'The independent source here: the courier’s official site, typed by you — or their published helpline. Never the link inside the SMS.',
};

const OUTCOME_ROWS = [
  ['Conflicting answer', 'UNKNOWN → CONFLICT', 'HIGH RISK', '#f87171'],
  ['Confirming answer', 'UNKNOWN → SUPPORT', 'LOW RISK', '#34d399'],
  ['Inconclusive answer', 'UNKNOWN stays UNKNOWN', 'NEEDS REVIEW', '#f0a832'],
];

function Cue({ label, children }) {
  return (
    <div className="dw4-cue">
      <span className="dw4-cue-label">{label}</span>
      <span className="dw4-cue-text">{children}</span>
    </div>
  );
}

export default function DemoWalkthrough4({ caseId, verdictNow, onSwitchCase, onGoDecision }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="dw4-panel">
      <button className="dw4-head" onClick={() => setOpen((v) => !v)}>
        <span className="dw4-head-left">
          <span className="dw4-play">▶</span>
          <span className="dw4-head-title">Guided demo walkthrough</span>
        </span>
        <span className="dw4-go">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="dw4-body">
          <p className="dw4-intro">
            A presenter script that runs <em>on this page</em> — narrate the “Say” lines,
            tap the “Tap” buttons. Nothing is pre-recorded; the loop below is live.
          </p>

          {/* STEP 1 */}
          <div className="dw4-step">
            <div className="dw4-step-num">1</div>
            <div className="dw4-step-main">
              <Cue label="Say">
                “The whole loop is three moves: <strong>weakest link → one independent
                check → fold the result back in</strong>. The Evidence Graph handed this
                case over with an UNKNOWN — so every case starts at{' '}
                <strong>NEEDS REVIEW</strong>.”
              </Cue>
              <Cue label="Tap">
                Switch cases — the current one reads <strong>{verdictNow}</strong> right now:
              </Cue>
              <div className="dw4-casebtns">
                {VERIFY_IDS.map((id) => (
                  <button
                    key={id}
                    className={`dw4-casebtn${id === caseId ? ' on' : ''}`}
                    onClick={() => onSwitchCase(id)}
                  >
                    {VERIFY_CASES[id].tabLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="dw4-step">
            <div className="dw4-step-num">2</div>
            <div className="dw4-step-main">
              <Cue label="Say">
                “First, pick the <strong>weakest link</strong> — the claim the case can
                least afford to leave unverified. Then pass the independence test: the
                check must run through a source the claimant cannot control.”
              </Cue>
              <Cue label="Tap">
                Tap a candidate below, pick it, and answer the quiz — the page unlocks
                Part 2 only when the independence test passes.
              </Cue>
              <p className="dw4-note">{INDEP_SOURCE[caseId]}</p>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="dw4-step">
            <div className="dw4-step-num">3</div>
            <div className="dw4-step-main">
              <Cue label="Say">
                “Now run the check. In this prototype the outcome is simulated and
                labeled <strong>DEMO MODE</strong> — in the live product this would be
                the real answer. Run any of the three outcomes:”
              </Cue>
              <div className="dw4-outcomes">
                {OUTCOME_ROWS.map(([label, flip, verdict, color]) => (
                  <div key={label} className="dw4-outcome">
                    <span className="dw4-outcome-label">{label}</span>
                    <span className="dw4-outcome-flip">{flip}</span>
                    <span className="dw4-outcome-verdict" style={{ color }}>→ {verdict}</span>
                  </div>
                ))}
              </div>
              <p className="dw4-note dim">
                Then “Fold into the evidence graph” and “Recompute the verdict” — watch
                the chain flip and the status chip above move.
              </p>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="dw4-step">
            <div className="dw4-step-num">4</div>
            <div className="dw4-step-main">
              <Cue label="Say">
                “The result is now evidence, and it lives in the shared case store — so
                the Decision-Safe Output on Page 5 already knows about it.”
              </Cue>
              <Cue label="Tap">
                <button className="dw4-btn" onClick={onGoDecision}>
                  See the decision on Page 5 →
                </button>
              </Cue>
              <p className="dw4-note dim">
                And “↺ Back to the weakest link” resets this case for the next demo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
