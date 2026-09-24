import { useEffect, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { FORWARDS, analyzeForward } from './forwards';
import './ForwardCheck.css';

const API = import.meta.env.VITE_API_URL || '';
const STATS_KEY = 'tg-stats-v1';

const ANALYSIS_STEPS = [
  'Extracting claims',
  'Classifying pattern',
  'Checking signals',
  'Deciding',
];

function loadStats() {
  try {
    return { calls: 0, cases: 0, signals: 0, forwards: 0, ...(JSON.parse(localStorage.getItem(STATS_KEY) || '{}')) };
  } catch { return { calls: 0, cases: 0, signals: 0, forwards: 0 }; }
}

async function saveCase(payload) {
  if (!API) return { ok: false, reason: 'no-api' };
  const t0 = performance.now();
  try {
    const r = await fetch(`${API}/api/guardian/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: r.ok, status: r.status, ms: Math.round(performance.now() - t0) };
  } catch { return { ok: false, reason: 'network' }; }
}

export default function ForwardCheck({ page, onNav }) {
  const [phase, setPhase] = useState('pick');
  const [bundle, setBundle] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [astage, setAstage] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [trace, setTrace] = useState([]);
  const [traceOpen, setTraceOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(loadStats);
  const timers = useRef([]);
  const chatEndRef = useRef(null);
  const t0Ref = useRef(0);

  const later = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); };
  const stamp = () => ((performance.now() - t0Ref.current) / 1000).toFixed(1) + 's';
  const pushMsg = (m) => setMsgs((p) => [...p, { ...m, key: `${Date.now()}-${p.length}-${Math.random().toString(36).slice(2, 6)}` }]);
  const pushTrace = (kind, text) => setTrace((p) => [...p, { t: stamp(), kind, text }]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs, astage]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 2600); return () => clearTimeout(id); }, [toast]);

  const bumpForwards = () => {
    setStats((s) => {
      const n = { ...s, forwards: (s.forwards || 0) + 1, cases: (s.cases || 0) + 1 };
      try { localStorage.setItem(STATS_KEY, JSON.stringify(n)); } catch { /* noop */ }
      return n;
    });
  };

  const startForward = (fw) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    t0Ref.current = performance.now();
    const caseId = 'TG-FWD-2026-' + Math.floor(1000 + Math.random() * 9000);
    const result = analyzeForward(fw); // deterministic engine — computed once, revealed step by step
    setBundle(fw);
    setAnalysis(result);
    setMsgs([]);
    setTrace([]);
    setAstage(0);
    setTraceOpen(false);
    setPhase('chat');

    // — the forwarded bundle lands as ONE case unit —
    later(450, () => {
      pushMsg({ from: 'user', kind: 'forward', fw });
      pushTrace('meta', 'bundle received · opened as one case');
    });
    // — beat 1: instant acknowledgment (no time promise) —
    later(1500, () => {
      pushMsg({ from: 'tg', kind: 'ack' });
      pushTrace('meta', 'ack sent · analysis started');
    });
    // — case card: four identities, structurally separate —
    later(2500, () => {
      pushMsg({ from: 'tg', kind: 'case', caseId });
      pushTrace('meta', `case ${caseId} created · forwarded-by / sender / claimed / verified kept separate`);
      saveCase({
        id: caseId, kind: 'forward', forwardId: fw.id,
        createdAt: new Date().toISOString(), status: 'checking',
        family: result.family?.id || null, band: null,
        signals: fw.signals.map((s) => s.id),
        identities: {
          forwardedBy: 'you',
          originalSender: fw.sender.label,
          claimedIdentity: fw.claim?.text || null,
          verifiedIdentity: null,
        },
        transcript: fw.content.type === 'text' ? fw.content.lines.join('\n') : fw.content.transcript.join('\n'),
      }).then((r) => pushTrace('sync', r.ok ? `POST /api/guardian/cases → ${r.status} · ${r.ms}ms` : 'backend unreachable · case kept locally'));
    });
    // — analysis, revealed step by step —
    later(3700, () => { setAstage(1); pushMsg({ from: 'tg', kind: 'analyzing' }); pushTrace('eval', `claims extracted: ${fw.claim ? `“${fw.claim.text}”` : 'none stated'}`); });
    later(4700, () => {
      setAstage(2);
      const top = result.scores.filter((s) => s.score > 0).map((s) => `${s.id}=${s.score}`).join(', ') || 'no family keywords';
      pushTrace('eval', `family scores: ${top} → ${result.family ? result.family.id : 'unclassified'}`);
    });
    later(5700, () => {
      setAstage(3);
      pushTrace('eval', `signals matched: ${result.signalCount}/5 (${fw.signals.map((s) => s.id).join(', ') || 'none'})`);
    });
    later(6700, () => {
      setAstage(4);
      pushTrace('eval', `band: ${result.band} · rule: ${result.signalCount >= 3 ? '≥3' : result.signalCount >= 1 ? '1–2' : '0'} signals`);
    });
    // — beat 2: the verdict card —
    later(7800, () => {
      setAstage(5);
      pushMsg({ from: 'tg', kind: 'verdict', caseId, at: new Date() });
      pushTrace('meta', `verdict delivered · ${result.band}`);
      bumpForwards();
      saveCase({
        id: caseId, kind: 'forward', forwardId: fw.id,
        createdAt: new Date().toISOString(), status: 'complete',
        family: result.family?.id || null, band: result.band,
        signals: fw.signals.map((s) => s.id),
        identities: {
          forwardedBy: 'you',
          originalSender: fw.sender.label,
          claimedIdentity: fw.claim?.text || null,
          verifiedIdentity: null,
        },
        transcript: fw.content.type === 'text' ? fw.content.lines.join('\n') : fw.content.transcript.join('\n'),
      });
    });
    later(8400, () => pushMsg({ from: 'tg', kind: 'actions' }));
  };

  const bandClass = (b) => (b === 'HIGH RISK' ? 'high' : b === 'NEEDS REVIEW' ? 'review' : 'low');

  return (
    <div className="sh-root">
      <PageHead page={page} onNav={onNav} label="Page 2 of 5 · Forward-to-Check" />

      <div className="sh-stage">
        <div className="sh-phone">
          <div className="sh-notch" />
          <div className="sh-screen">

            {/* ============ PICK ============ */}
            {phase === 'pick' && (
              <div className="f-pick">
                <div className="f-hero">
                  <div className="f-hero-kicker">Zero-effort intake</div>
                  <h1>Forward-to-Check</h1>
                  <p>Suspicious message? Don’t analyse it yourself — forward it to TrustGuard, the way you’d forward it to a friend. No forms, no typing, nothing to learn.</p>
                </div>

                <div className="f-stats">
                  <div className="f-stat"><b>{stats.forwards || 0}</b><span>forwards checked</span></div>
                  <div className="f-stat"><b>{stats.cases || 0}</b><span>cases built</span></div>
                  <div className="f-stat"><b>8</b><span>scam families</span></div>
                </div>

                <div className="f-pick-label">Simulate forwarding one of these:</div>
                {FORWARDS.map((fw) => (
                  <button key={fw.id} className="f-fwd-card" onClick={() => startForward(fw)}>
                    <span className={`f-kind f-kind-${fw.kind}`}>{fw.kind === 'video' ? '▸' : '✉'}</span>
                    <span className="f-fwd-main">
                      <b>{fw.title}</b>
                      <span className="f-fwd-kind">{fw.kindLabel}</span>
                      <span className="f-fwd-prev">{fw.preview}</span>
                    </span>
                    <span className="f-fwd-go">→</span>
                  </button>
                ))}

                <p className="f-fine">Prototype simulation: forwarding is simulated with these demo bundles. A real build would receive actual forwarded messages.</p>
              </div>
            )}

            {/* ============ CHAT ============ */}
            {phase === 'chat' && bundle && (
              <div className="f-chat">
                <div className="f-chatbar">
                  <button className="f-back" onClick={() => { timers.current.forEach(clearTimeout); setPhase('pick'); }} aria-label="Back">←</button>
                  <div className="f-chat-id">
                    <b>TrustGuard</b>
                    <span><i className="f-online" />online · prototype</span>
                  </div>
                </div>

                <div className="f-msgs">
                  {msgs.map((m) => {
                    if (m.from === 'user' && m.kind === 'forward') {
                      const b = m.fw;
                      return (
                        <div key={m.key} className="f-row right">
                          <div className="f-bubble user">
                            <div className="f-fwd-tag">⤴ Forwarded</div>
                            <div className="f-bubble-title">{b.title}</div>
                            <div className="f-bubble-kind">{b.kindLabel}</div>
                            <div className="f-bubble-prev">{b.preview}</div>
                          </div>
                        </div>
                      );
                    }
                    if (m.kind === 'ack') {
                      return (
                        <div key={m.key} className="f-row left">
                          <div className="f-bubble tg">
                            <b>Got it.</b>
                            <div className="f-ack-sub">Building your case — nothing needed from you.</div>
                          </div>
                        </div>
                      );
                    }
                    if (m.kind === 'case') {
                      return (
                        <div key={m.key} className="f-row left">
                          <div className="f-card">
                            <div className="f-card-head">Case {m.caseId} <span className="f-chip dim">opened just now</span></div>
                            <div className="f-idrow"><span>Forwarded by</span><b>You</b><span className="f-chip ok">known</span></div>
                            <div className="f-idrow"><span>Original sender</span><b className="f-wrap">{bundle.sender.label}</b>{!bundle.sender.known && <span className="f-chip warn">unknown</span>}</div>
                            <div className="f-idrow"><span>Claimed identity</span><b className="f-wrap">{bundle.claim ? bundle.claim.text : 'None stated'}</b>{bundle.claim && <span className="f-chip warn">unverified claim</span>}</div>
                            <div className="f-idrow"><span>Verified identity</span><b>Not established</b><span className="f-chip dim">pending</span></div>
                          </div>
                        </div>
                      );
                    }
                    if (m.kind === 'analyzing') {
                      return (
                        <div key={m.key} className="f-row left">
                          <div className="f-card">
                            <div className="f-card-head">Checking the bundle</div>
                            <div className="f-steps">
                              {ANALYSIS_STEPS.map((s, i) => (
                                <div key={s} className={`f-step${astage > i + 1 || (astage === 5) ? ' done' : astage === i + 1 ? ' live' : ''}`}>
                                  <span className="f-step-dot" />{s}
                                </div>
                              ))}
                            </div>
                            {astage >= 2 && (
                              <div className="f-fams">
                                {analysis.scores.map((f) => (
                                  <span key={f.id} className={`f-fam${analysis.family && f.id === analysis.family.id ? ' hit' : ''}`}>{f.label}</span>
                                ))}
                              </div>
                            )}
                            {astage >= 3 && (
                              <div className="f-sigline">{analysis.signalCount} of 5 signals matched</div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (m.kind === 'verdict') {
                      const v = analysis;
                      return (
                        <div key={m.key} className="f-row left">
                          <div className={`f-verdict ${bandClass(v.band)}`}>
                            <div className="f-v-top">
                              <span className={`f-band f-band-${bandClass(v.band)}`}>{v.band}</span>
                              {v.family && <span className="f-v-fam">Pattern: {v.family.label}</span>}
                            </div>
                            <div className="f-v-why">Why this assessment</div>
                            <ul className="f-v-reasons">{bundle.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                            {bundle.honestyNote && <div className="f-v-note">{bundle.honestyNote}</div>}
                            <div className="f-v-proof">Assessment, not proof.</div>
                            <div className="f-v-verify">
                              <b>Verify independently</b>
                              <p>{bundle.verifyStep}</p>
                            </div>
                            <div className="f-v-meta">Case {m.caseId} · {m.at.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>
                            <button className="f-v-share" onClick={() => setToast('Verdict card ready — safe to forward as-is.')}>Forward this card</button>
                          </div>
                        </div>
                      );
                    }
                    if (m.kind === 'actions') {
                      return (
                        <div key={m.key} className="f-row left">
                          <div className="f-actions">
                            <button className="f-btn ghost" onClick={() => setTraceOpen((o) => !o)}>{traceOpen ? 'Hide' : 'Show'} engine trace</button>
                            <button className="f-btn" onClick={() => { timers.current.forEach(clearTimeout); setPhase('pick'); }}>Check another forward</button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}

                  {traceOpen && trace.length > 0 && (
                    <div className="f-trace">
                      <div className="f-trace-head">ENGINE TRACE</div>
                      {trace.map((l, i) => (
                        <div key={i} className={`f-trace-line t-${l.kind}`}><span className="f-t-t">{l.t}</span>{l.text}</div>
                      ))}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="f-inputbar">
                  <div className="f-input-ph">Forward a message to check…</div>
                  <div className="f-input-hint">simulated</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="g-page-fine" style={{ maxWidth: 430 }}>
        Idea 2 · Forward-to-Check — zero-learning-curve intake for anyone under uncertainty.
        Prototype simulation; verdicts are assessments, not proof.
      </p>

      {toast && <div className="g-toast" role="status">{toast}</div>}
    </div>
  );
}
