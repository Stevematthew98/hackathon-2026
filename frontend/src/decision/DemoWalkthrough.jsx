// Idea 5 · Guided demo walkthrough (additive).
//
// A collapsible, presenter-style script that demonstrates how the
// Decision-Safe Output works — on this page, using the live prototype.
// "Say" lines are narration cues for whoever runs the demo; "Tap" lines
// are working buttons that drive the prototype itself (switch cases,
// jump to the Verification Loop). Nothing here changes Ideas 1–4 or the
// decision engine; it only narrates and navigates.

import { useState } from 'react';
import { VERIFY_CASES } from '../verify/verifyScenarios';
import { DECISION_IDS, VERDICTS } from './decisionEngine';
import './DemoWalkthrough.css';

const EXPECTED = {
  'digital-arrest': {
    after: 'HIGH RISK',
    why: 'the independent voice check conflicts with the caller’s identity claim',
  },
  'legit-bank': {
    after: 'LOW RISK',
    why: 'the bank’s own records support the claimed context',
  },
  'customs-sms': {
    after: 'NEEDS REVIEW',
    why: 'the check comes back inconclusive — TrustGuard abstains instead of guessing',
  },
};

function Cue({ label, children }) {
  return (
    <div className="dw-cue">
      <span className="dw-cue-label">{label}</span>
      <span className="dw-cue-text">{children}</span>
    </div>
  );
}

export default function DemoWalkthrough({ caseId, verdict, onSwitchCase, onGoVerify }) {
  const [open, setOpen] = useState(true);
  const expected = EXPECTED[caseId] || EXPECTED['digital-arrest'];
  const afterColor = (VERDICTS[expected.after] || {}).color || '#f0a832';

  return (
    <div className="dw-panel">
      <button className="dw-head" onClick={() => setOpen((v) => !v)}>
        <span className="dw-head-left">
          <span className="dw-play">▶</span>
          <span className="dw-head-title">Guided demo walkthrough</span>
        </span>
        <span className="dw-go">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="dw-body">
          <p className="dw-intro">
            A 60-second script that runs <em>on this page</em> — narrate the “Say” lines,
            tap the “Tap” buttons. Nothing is pre-recorded; the verdict recomputes live.
          </p>

          {/* STEP 1 */}
          <div className="dw-step">
            <div className="dw-step-num">1</div>
            <div className="dw-step-main">
              <Cue label="Say">
                “Ideas 1–4 investigated the case. This page answers it — and every case
                starts <strong>unsettled</strong>.”
              </Cue>
              <Cue label="Tap">
                Switch cases below. Each one starts at
                {' '}<strong>NEEDS REVIEW</strong> — the current case reads
                {' '}<strong>{verdict}</strong> right now.
              </Cue>
              <div className="dw-casebtns">
                {DECISION_IDS.map((id) => (
                  <button
                    key={id}
                    className={`dw-casebtn${id === caseId ? ' on' : ''}`}
                    onClick={() => onSwitchCase(id)}
                  >
                    {VERIFY_CASES[id].tabLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="dw-step">
            <div className="dw-step-num">2</div>
            <div className="dw-step-main">
              <Cue label="Say">
                “Now the weakest link gets <strong>one independent check</strong> — on the
                Verification Loop page. Then we come back here and watch the decision move.”
              </Cue>
              <Cue label="Tap">
                <button className="dw-btn" onClick={onGoVerify}>
                  Open the Verification Loop →
                </button>
              </Cue>
              <p className="dw-note">
                Run the check on Page 4, then return here (dot 5). The verdict recomputes
                automatically — no refresh needed.
              </p>
              <div className="dw-expect" style={{ borderColor: afterColor }}>
                <span className="dw-expect-label">On this case, expect</span>
                <span className="dw-expect-verdict" style={{ color: afterColor }}>
                  {expected.after}
                </span>
                <span className="dw-expect-why"> — {expected.why}.</span>
              </div>
              <p className="dw-note dim">
                Tell the judges: a forced verdict never happens. If evidence can’t settle
                it, TrustGuard says NEEDS REVIEW — an abstention is a decision too.
              </p>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="dw-step">
            <div className="dw-step-num">3</div>
            <div className="dw-step-main">
              <Cue label="Say">
                “Scroll up — the decision <strong>shows its work</strong>. Four things,
                always: the evidence, what’s still unknown, exactly one next step, and
                the report.”
              </Cue>
              <ul className="dw-checklist">
                <li><strong>Why this decision?</strong> — the findings that decided it, each expandable.</li>
                <li><strong>What TrustGuard still does not know</strong> — uncertainty is listed, never hidden.</li>
                <li><strong>Next safest action</strong> — exactly one step, not a checklist.</li>
                <li><strong>Case report</strong> — export the structured report for the judges.</li>
              </ul>
              <Cue label="Say">
                “And <strong>↺ Restart demonstration</strong> at the bottom resets this
                case’s checks — ready for the next demo.”
              </Cue>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
