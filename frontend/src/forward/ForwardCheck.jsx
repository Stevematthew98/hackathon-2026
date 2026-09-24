import { useEffect, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { SCENARIOS, PIPELINE_STAGES, REL_STYLE, bandClass, decideBand } from './scenarios';
import './ForwardCheck.css';

const API = import.meta.env.VITE_API_URL || '';
const STATS_KEY = 'tg-stats-v1';

function loadStats() {
  try {
    return { calls: 0, cases: 0, signals: 0, forwards: 0, ...(JSON.parse(localStorage.getItem(STATS_KEY) || '{}')) };
  } catch { return { calls: 0, cases: 0, signals: 0, forwards: 0 }; }
}

async function saveCase(payload) {
  if (!API) return { ok: false };
  try {
    const r = await fetch(`${API}/api/guardian/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: r.ok };
  } catch { return { ok: false }; }
}

function Shield({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export default function ForwardCheck({ page, onNav }) {
  const [scenarioId, setScenarioId] = useState('aadhaar');
  const [screen, setScreen] = useState('family'); // family | forward | sending | tg
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [tgStep, setTgStep] = useState(0);
  const [pipe, setPipe] = useState(0);
  const [identOpen, setIdentOpen] = useState(false);
  const [drawer, setDrawer] = useState(null); // {kind:'claim'|'rel', data}
  const [selNode, setSelNode] = useState(null);
  const [selEdge, setSelEdge] = useState(null);
  const [verify, setVerify] = useState('idle'); // idle | open | done
  const [verdictSent, setVerdictSent] = useState(false);
  const [bandOverride, setBandOverride] = useState(null);
  const [, setStats] = useState(loadStats);
  const timers = useRef([]);
  const pressT = useRef(null);
  const endRef = useRef(null);
  const sc = SCENARIOS[scenarioId];
  const band = bandOverride || decideBand(sc.relationships);

  const later = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // Surface a save failure instead of failing silently (#38).
  const persistCase = (payload) => {
    saveCase(payload).then((r) => {
      if (!r.ok) setToast('Note: case saved on this device — demo server unreachable.');
    });
  };

  useEffect(() => () => { clearTimers(); clearTimeout(pressT.current); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [screen, tgStep, pipe, verify, verdictSent, menuOpen]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 2600); return () => clearTimeout(id); }, [toast]);

  const reset = (id) => {
    clearTimers();
    setScenarioId(id || scenarioId);
    setScreen('family');
    setMenuOpen(false);
    setTgStep(0); setPipe(0); setIdentOpen(false);
    setDrawer(null); setSelNode(null); setSelEdge(null);
    setVerify('idle'); setVerdictSent(false); setBandOverride(null);
  };

  const bumpStats = () => {
    setStats((s) => {
      const n = { ...s, forwards: (s.forwards || 0) + 1, cases: (s.cases || 0) + 1 };
      try { localStorage.setItem(STATS_KEY, JSON.stringify(n)); } catch { /* noop */ }
      return n;
    });
  };

  // ---------- long press ----------
  const startPress = () => { pressT.current = setTimeout(() => setMenuOpen(true), 550); };
  const endPress = () => clearTimeout(pressT.current);

  // ---------- forward flow ----------
  // One case per forward: the backend upserts on the same id, so the initial
  // "checking" record, the analyzed result, and the verification update all
  // land on the SAME case.
  const caseSnapshot = (extra) => ({
    id: sc.caseId.replace('#', '').replace(' ', '-'),
    kind: 'forward', scenario: scenarioId,
    createdAt: new Date().toISOString(),
    bundle: sc.bundle,
    identities: Object.fromEntries(sc.identities.map((i) => [i.role, { value: i.value, status: i.status }])),
    signals: [], // backend contract requires signals[]; forward evidence travels in `bundle`
    ...extra,
  });

  const sendToTrustGuard = () => {
    setScreen('sending');
    later(1500, () => {
      setScreen('tg');
      bumpStats();
      persistCase(caseSnapshot({ status: 'checking', band: null }));
      // tg chat sequence
      later(700, () => setTgStep(1)); // case card
      later(1700, () => {
        setTgStep(2); // pipeline card
        PIPELINE_STAGES.forEach((_, i) => later(900 * (i + 1), () => setPipe(i + 1)));
      });
      later(1700 + 900 * 6 + 700, () => setTgStep(3)); // sections
      later(1700 + 900 * 6 + 1600, () => {
        setTgStep(4); // verdict
        // Persist the completed analysis on the same case
        persistCase(caseSnapshot({
          status: 'analyzed',
          band: decideBand(sc.relationships),
          reasons: sc.verdict.reasons,
          verifyStep: sc.verdict.verifyStep,
          claims: sc.claims.map((c) => ({ id: c.id, text: c.text, source: c.source, state: c.state })),
          relationships: sc.relationships.map((r) => ({ id: r.id, type: r.type, title: r.title, result: r.result })),
        }));
      });
    });
  };

  const doVerify = () => {
    setVerify('done');
    const finalBand = sc.verification?.resolvesTo || decideBand(sc.relationships);
    if (sc.verification?.resolvesTo) setBandOverride(sc.verification.resolvesTo);
    // Persist the verification outcome on the same case
    if (sc.verification) {
      persistCase(caseSnapshot({
        status: 'verified',
        band: finalBand,
        reasons: sc.verdict.reasons,
        verifyStep: sc.verdict.verifyStep,
        verification: {
          recommended: sc.verification.recommended,
          simulatedResult: sc.verification.simulatedResult,
          outcomeNote: sc.verification.outcomeNote,
        },
      }));
    }
  };

  const forwardVerdict = () => {
    setVerdictSent(true);
    setScreen('family');
    setToast('Assessment forwarded to Family Group.');
  };

  const now = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const today = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  const relById = (id) => sc.relationships.find((r) => r.id === id);

  return (
    <div className="sh-root">
      <PageHead page={page} onNav={onNav} label="Page 2 of 5 · Forward-to-Check" />

      <div className="sh-stage">
        <div className="sh-phone">
          <div className="sh-notch" />
          <div className="sh-screen f2-screen">

            {/* ================= FAMILY CHAT ================= */}
            {screen === 'family' && (
              <div className="wa-wrap">
                <div className="f2-demobar">
                  <span className="f2-demo-tag">Demo</span>
                  <div className="f2-seg">
                    {Object.values(SCENARIOS).map((s) => (
                      <button key={s.id} className={s.id === scenarioId ? 'on' : ''} onClick={() => reset(s.id)}>{s.demoLabel}</button>
                    ))}
                  </div>
                  <button className="f2-reset" onClick={() => reset()} title="Reset demo">↺</button>
                </div>
                <div className="wa-head">
                  <span className="wa-back">‹</span>
                  <div className="wa-id"><b>{sc.chat.groupName}</b><span>{sc.chat.groupSub}</span></div>
                  <span className="wa-icons">⤢ ⋮</span>
                </div>
                <div className="wa-body">
                  {sc.chat.prior.map((m, i) => (
                    <div key={i} className="wa-row"><div className="wa-bubble"><b className="wa-name c1">{m.from}</b><div>{m.text}</div><span className="wa-time">21:32</span></div></div>
                  ))}

                  {/* suspicious message — long-pressable */}
                  <div className="wa-row">
                    <div
                      className="wa-bubble wa-susp"
                      onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress}
                      onClick={() => setMenuOpen(true)}
                    >
                      <b className="wa-name c2">{sc.chat.sender.name}</b>
                      {sc.chat.sender.forwarded && <div className="wa-fwd">⤴ Forwarded many times</div>}
                      <div className="wa-text">{sc.chat.text.split('\n').map((l, i) => <div key={i}>{l}</div>)}</div>
                      {sc.chat.pdf && (
                        <div className="wa-pdf">
                          <div className="wa-pdf-doc">
                            <div className="wa-pdf-head">{sc.chat.pdf.previewTitle}</div>
                            <div className="wa-pdf-sub">{sc.chat.pdf.previewSub}</div>
                            {sc.chat.pdf.bodyLines.map((l, i) => <div key={i} className="wa-pdf-line" />)}
                            <div className="wa-pdf-sig">✒ {sc.chat.pdf.signatory}</div>
                          </div>
                          <div className="wa-pdf-meta"><span className="wa-pdf-ic">PDF</span><div><b>{sc.chat.pdf.name}</b><span>{sc.chat.pdf.size} · simulated document</span></div></div>
                        </div>
                      )}
                      {sc.chat.link && (
                        <div className="wa-link">
                          <div className="wa-link-url">{sc.chat.link.url}</div>
                          <div className="wa-link-note">{sc.chat.link.note}</div>
                        </div>
                      )}
                      <span className="wa-time">21:47</span>
                    </div>
                  </div>
                  <div className="wa-hint">Long press the message to inspect</div>

                  {verdictSent && (
                    <div className="wa-row right">
                      <div className="wa-bubble wa-tgmsg">
                        <div className="wa-tg-head"><Shield size={15} /> TrustGuard assessment</div>
                        <div className={`f2-band f2-band-${bandClass(band)} sm`}>{band}</div>
                        <div className="wa-tg-why">{sc.verdict.reasons.slice(0, 2).map((r, i) => <div key={i}>• {r}</div>)}</div>
                        <div className="wa-tg-proof">Assessment, not proof.</div>
                        <div className="wa-tg-meta">{sc.caseId} · {today}</div>
                        <span className="wa-time">✓✓ {now}</span>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
                <div className="wa-input"><div className="wa-input-ph">Message</div><div className="wa-mic">🎤</div></div>

                {menuOpen && (
                  <div className="wa-menu-wrap" onClick={() => setMenuOpen(false)}>
                    <div className="wa-menu" onClick={(e) => e.stopPropagation()}>
                      {['Reply', 'Copy', 'More'].map((a) => (
                        <button key={a} onClick={() => { setMenuOpen(false); setToast(`${a} is not part of this demo.`); }}>{a}</button>
                      ))}
                      <button className="primary" onClick={() => { setMenuOpen(false); setScreen('forward'); }}>⤴ Forward</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= FORWARD SCREEN ================= */}
            {screen === 'forward' && (
              <div className="wa-wrap">
                <div className="wa-head">
                  <button className="wa-x" onClick={() => setScreen('family')}>✕</button>
                  <div className="wa-id"><b>Forward message</b><span>1 message selected</span></div>
                </div>
                <div className="wa-body">
                  <div className="f2-card">
                    <div className="f2-card-head">Complete bundle</div>
                    {sc.bundle.map((b) => (
                      <div key={b} className="f2-bundle-row"><span className="f2-check">✓</span>{b}</div>
                    ))}
                    <div className="f2-one-case">ONE CASE<span>containing MULTIPLE EVIDENCE ITEMS</span></div>
                  </div>
                  <div className="f2-sendto-label">Send to</div>
                  <div className="f2-contact">
                    <span className="f2-shield"><Shield size={24} /></span>
                    <div><b>TrustGuard</b><span>Case engine · prototype</span></div>
                    <span className="f2-check big">✓</span>
                  </div>
                </div>
                <div className="f2-sendbar">
                  <button className="f2-send" onClick={sendToTrustGuard}>Send to TrustGuard →</button>
                </div>
              </div>
            )}

            {/* ================= SENDING ================= */}
            {screen === 'sending' && (
              <div className="f2-sending">
                <div className="f2-fly"><span className="f2-fly-msg">⤴</span><span className="f2-fly-shield"><Shield size={40} /></span></div>
                <p>Sending bundle to TrustGuard…</p>
              </div>
            )}

            {/* ================= TRUSTGUARD CHAT ================= */}
            {screen === 'tg' && (
              <div className="tg-wrap">
                <div className="tg-head">
                  <button className="wa-x" onClick={() => reset()}>‹</button>
                  <span className="f2-shield sm"><Shield size={20} /></span>
                  <div className="wa-id"><b>TrustGuard</b><span><i className="f2-online" />online · prototype</span></div>
                </div>
                <div className="tg-body">
                  {/* beat 1 — acknowledgement */}
                  <div className="tg-row"><div className="tg-bubble">
                    <b>Received — analyzing your forward…</b>
                    <div className="tg-sub">Case created. Analyzing the complete evidence bundle…</div>
                    <div className="tg-sub dim">This only means the evidence arrived — not what it means yet.</div>
                  </div></div>

                  {/* case card */}
                  {tgStep >= 1 && (
                    <div className="tg-row"><div className="f2-card glow">
                      <div className="f2-card-head">{sc.caseId} <span className="f2-chip dim">opened just now</span></div>
                      <div className="f2-ev-label">Evidence received</div>
                      <div className="f2-ev-chips">{sc.bundle.map((b) => <span key={b} className="f2-ev-chip">{b}</span>)}</div>
                      <div className="f2-one-case">ONE CASE<span>containing MULTIPLE EVIDENCE ITEMS</span></div>
                    </div></div>
                  )}

                  {/* pipeline */}
                  {tgStep >= 2 && (
                    <div className="tg-row"><div className="f2-card">
                      <div className="f2-card-head">Analysis pipeline</div>
                      {PIPELINE_STAGES.map((s, i) => (
                        <div key={s.id} className={`f2-stage${pipe > i + 1 ? ' done' : pipe === i + 1 ? ' live' : ''}`}>
                          <span className="f2-stage-dot" />
                          <div><b>{s.label}</b><span>{s.desc}</span></div>
                        </div>
                      ))}
                    </div></div>
                  )}

                  {/* sections */}
                  {tgStep >= 3 && (
                    <>
                      <div className="tg-row"><div className="f2-card">
                        <button className="f2-sec-head" onClick={() => setIdentOpen((o) => !o)}>
                          Identity context <span>{identOpen ? '▾' : '▸'}</span>
                        </button>
                        {identOpen && sc.identities.map((idn) => (
                          <div key={idn.role} className="f2-idrow">
                            <span>{idn.role}</span><b>{idn.value}</b>
                            <span className={`f2-chip st-${idn.status.replace(/ /g, '-').toLowerCase()}`}>{idn.status}</span>
                          </div>
                        ))}
                        {!identOpen && <div className="f2-sec-hint">4 identities · kept strictly separate</div>}
                      </div></div>

                      <div className="tg-row"><div className="f2-card">
                        <div className="f2-card-head">Claims extracted <span className="f2-chip dim">{sc.claims.length}</span></div>
                        {sc.claims.map((c) => (
                          <button key={c.id} className="f2-claim" onClick={() => setDrawer({ kind: 'claim', data: c })}>
                            <span className="f2-claim-id">{c.id}</span>
                            <span className="f2-claim-text">“{c.text}”</span>
                            <span className={`f2-claim-state k-${c.stateKind}`}>{c.state}</span>
                          </button>
                        ))}
                      </div></div>

                      <div className="tg-row"><div className="f2-card">
                        <div className="f2-card-head">Evidence relationships <span className="f2-chip dim">{sc.relationships.length}</span></div>
                        {sc.relationships.map((r) => (
                          <button key={r.id} className="f2-rel" onClick={() => setDrawer({ kind: 'rel', data: r })}>
                            <span className="f2-rel-type" style={{ color: REL_STYLE[r.type].color, borderColor: REL_STYLE[r.type].color }}>{r.type}</span>
                            <span className="f2-rel-title">{r.title}</span>
                            <span className="f2-rel-go">›</span>
                          </button>
                        ))}
                      </div></div>

                      <div className="tg-row"><div className="f2-card">
                        <div className="f2-card-head">Evidence graph</div>
                        <svg viewBox="0 0 360 320" className="f2-graph">
                          {sc.graph.edges.map((e) => {
                            const a = sc.graph.nodes.find((n) => n.id === e.from);
                            const b = sc.graph.nodes.find((n) => n.id === e.to);
                            const active = selEdge === e.id;
                            return (
                              <g key={e.id} className="f2-edge-g" onClick={() => { setSelEdge(e.id); setSelNode(null); }}>
                                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="f2-edge-hit" />
                                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                  className={`f2-edge${active ? ' active' : ''}`}
                                  style={{ stroke: REL_STYLE[e.type].color }}
                                  strokeDasharray={e.type === 'UNKNOWN' ? '5 4' : undefined} />
                              </g>
                            );
                          })}
                          {sc.graph.nodes.map((n) => (
                            <g key={n.id} className={`f2-node${selNode === n.id ? ' active' : ''}`}
                              onClick={() => { setSelNode(n.id); setSelEdge(null); }}>
                              <rect x={n.x - 34} y={n.y - 17} width="68" height="34" rx="10" />
                              <text x={n.x} y={n.y + 4} textAnchor="middle">{n.label}</text>
                            </g>
                          ))}
                        </svg>
                        <div className="f2-legend">
                          {Object.entries(REL_STYLE).map(([k, v]) => (
                            <span key={k} style={{ color: v.color }}><i style={{ background: v.color }} />{k}</span>
                          ))}
                        </div>
                        {(selNode || selEdge) && (
                          <div className="f2-sel">
                            {selNode && (() => { const n = sc.graph.nodes.find((x) => x.id === selNode); return (<><b>{n.label}</b><p>{n.desc}</p></>); })()}
                            {selEdge && (() => { const r = relById(sc.graph.edges.find((x) => x.id === selEdge).rel); return (<><b style={{ color: REL_STYLE[r.type].color }}>{r.type}</b><p>{r.title}</p><button className="f2-link" onClick={() => setDrawer({ kind: 'rel', data: r })}>Open full evidence ›</button></>); })()}
                          </div>
                        )}
                      </div></div>
                    </>
                  )}

                  {/* verdict */}
                  {tgStep >= 4 && (() => {
                    const showReasons = bandOverride && sc.verification
                      ? [sc.verification.outcomeNote]
                      : sc.verdict.reasons;
                    return (
                    <div className="tg-row"><div className={`f2-verdict ${bandClass(band)}`}>
                      <div className="f2-v-top">
                        <span className={`f2-band f2-band-${bandClass(band)}`}>{band}</span>
                      </div>
                      <div className="f2-v-why">Why this assessment</div>
                      <ul className="f2-v-reasons">{showReasons.map((r) => <li key={r}>{r}</li>)}</ul>
                      <div className="f2-v-proof">Assessment, not proof.</div>
                      <div className="f2-v-verify">
                        <b>Next safest action</b>
                        <p>{sc.verdict.verifyStep}</p>
                      </div>
                      {sc.verdict.singleCheck && verify === 'idle' && (
                        <div className="f2-v-verify amber"><b>One check would settle this</b><p>{sc.verdict.singleCheck}</p></div>
                      )}
                      <div className="f2-v-meta">{sc.caseId} · {today}</div>
                      <div className="f2-v-actions">
                        {sc.verification && verify === 'idle' && (
                          <button className="f2-btn ghost" onClick={() => setVerify('open')}>Show independent verification</button>
                        )}
                        <button className="f2-btn" onClick={forwardVerdict}>Forward this assessment</button>
                      </div>
                      {verify !== 'idle' && sc.verification && (
                        <div className="f2-verify-panel">
                          <b>Independent verification</b>
                          <p className="f2-vp-intro">{sc.verification.intro}</p>
                          <div className="f2-vp-rec"><span>Recommended check</span><p>{sc.verification.recommended}</p></div>
                          {verify === 'open' && (
                            <button className="f2-btn" onClick={doVerify}>{sc.verification.actionLabel}</button>
                          )}
                          {verify === 'done' && (
                            <div className="f2-vp-done">
                              <span className="f2-chip dim">simulated result</span>
                              <p>{sc.verification.simulatedResult}</p>
                              <p className="f2-vp-outcome">{sc.verification.outcomeNote}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div></div>
                    );
                  })()}

                  {tgStep >= 4 && (
                    <div className="tg-row"><div className="f2-fine-card">
                      <p><b>Privacy:</b> Nothing is analyzed until you forward it to TrustGuard. Only what you hand over is examined.</p>
                      <p><b>Prototype seam:</b> the messaging interface is simulated; the TrustGuard case engine is the core product.</p>
                      <div className="f2-flow">FORWARD → CASE → BUNDLE → CLAIMS → IDENTITIES → RELATIONSHIPS → RISK → VERIFICATION → OUTPUT</div>
                    </div></div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>
            )}

            {/* drawer */}
            {drawer && (
              <div className="f2-drawer-wrap" onClick={() => setDrawer(null)}>
                <div className="f2-drawer" onClick={(e) => e.stopPropagation()}>
                  <button className="f2-drawer-x" onClick={() => setDrawer(null)}>✕</button>
                  {drawer.kind === 'claim' ? (
                    <>
                      <div className="f2-card-head">{drawer.data.id} · Claim</div>
                      <p className="f2-drawer-quote">“{drawer.data.text}”</p>
                      <div className="f2-drow"><span>Source evidence</span><b>{drawer.data.source}</b></div>
                      <div className="f2-drow"><span>Where it came from</span><b>{drawer.data.origin}</b></div>
                      <div className="f2-drow"><span>Verification state</span><b>{drawer.data.state}</b></div>
                    </>
                  ) : (
                    <>
                      <div className="f2-rel-type" style={{ color: REL_STYLE[drawer.data.type].color, borderColor: REL_STYLE[drawer.data.type].color }}>{drawer.data.type}</div>
                      <div className="f2-card-head" style={{ marginTop: 8 }}>{drawer.data.title}</div>
                      <div className="f2-drow"><span>Claim A</span><b>{drawer.data.a}</b></div>
                      <div className="f2-drow"><span>Claim B</span><b>{drawer.data.b}</b></div>
                      <div className="f2-drow"><span>Check performed</span><b>{drawer.data.check}</b></div>
                      <div className="f2-drow"><span>Result</span><b>{drawer.data.result}</b></div>
                      <div className="f2-drow"><span>Confidence</span><b>{drawer.data.confidence}</b></div>
                      <div className="f2-drow"><span>Uncertainty</span><b>{drawer.data.uncertainty}</b></div>
                      <div className="f2-drow"><span>Source of evidence</span><b>{drawer.data.source}</b></div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="g-page-fine" style={{ maxWidth: 430 }}>
        Idea 2 · Forward-to-Check — a case, not a file. Prototype simulation; assessments are not proof.
      </p>
      {toast && <div className="g-toast" role="status">{toast}</div>}
    </div>
  );
}
