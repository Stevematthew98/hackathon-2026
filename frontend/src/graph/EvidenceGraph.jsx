// Idea 3 · The Evidence Graph
//
// "The graph does not detect scams. The graph detects relationships
//  between claims and evidence."
//
// Reasoning layer over a case: Evidence → Claims → Relationships →
// Risk interpretation. No scores, no verdicts — the graph reports
// relationships; the Decision-Safe Output layer (Idea 5) interprets.
import { useEffect, useMemo, useRef, useState } from 'react';
import PageHead from '../PageHead';
import { CASES, REL_META, NODE_KIND } from './graphScenarios';
import './EvidenceGraph.css';

const API = import.meta.env.VITE_API_URL || '';
const FILTERS = ['ALL', 'CONFLICT', 'ANOMALY', 'UNKNOWN', 'SUPPORT'];

const NODE_STYLE = {
  person: { stroke: '#8b95a5', dash: '' },
  claim: { stroke: '#f59e0b', dash: '' },
  evidence: { stroke: '#60a5fa', dash: '' },
  source: { stroke: '#34d399', dash: '' },
  reference: { stroke: '#a78bfa', dash: '' },
  unavailable: { stroke: '#9aa5b3', dash: '5 4' },
};

function later(ms, fn) { const t = setTimeout(fn, ms); return () => clearTimeout(t); }

function Highlight({ text, highlight }) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>;
  const [a, b] = text.split(highlight);
  return <>{a}<mark className="eg-mark">{highlight}</mark>{b}</>;
}

function TypeBadge({ type, weak }) {
  const m = REL_META[type];
  return (
    <span className={`eg-badge t-${type.toLowerCase()}`} style={{ '--rc': m.color }}>
      {type}{weak ? ' · WEAK' : ''}
    </span>
  );
}

export default function EvidenceGraph({ page, onNav }) {
  const [caseId, setCaseId] = useState('digital-arrest');
  const sc = CASES[caseId];
  const [extracting, setExtracting] = useState(true);
  const [shownClaims, setShownClaims] = useState(0);
  const [drawer, setDrawer] = useState(null); // {kind:'claim'|'node'|'rel', data}
  const [filter, setFilter] = useState('ALL');
  const [whyOpen, setWhyOpen] = useState(false);
  const [evOpen, setEvOpen] = useState(false);
  const [backendCount, setBackendCount] = useState(null);
  const [seam, setSeam] = useState(null); // null | 'weakest' | 'next'
  const timers = useRef([]);

  const relById = (id) => sc.relationships.find((r) => r.id === id);
  const nodeById = (id) => sc.nodes.find((n) => n.id === id);

  // ---- claim extraction animation on case change ----
  useEffect(() => {
    timers.current.forEach((c) => c());
    timers.current = [];
    setExtracting(true);
    setShownClaims(0);
    setDrawer(null);
    setFilter('ALL');
    setSeam(null);
    setWhyOpen(false);
    setEvOpen(false);
    const n = sc.claims.length;
    for (let i = 1; i <= n; i++) timers.current.push(later(500 + i * 380, () => setShownClaims(i)));
    timers.current.push(later(500 + n * 380 + 600, () => setExtracting(false)));
    return () => timers.current.forEach((c) => c());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // ---- backend connectivity (read-only; demo data stays simulated) ----
  useEffect(() => {
    if (!API) return;
    fetch(`${API}/api/guardian/cases`).then((r) => r.json())
      .then((d) => setBackendCount(Array.isArray(d) ? d.length : 0))
      .catch(() => setBackendCount(null));
  }, []);

  const unknownRels = useMemo(() => sc.relationships.filter((r) => r.type === 'UNKNOWN'), [sc]);
  const weakest = unknownRels[0] || sc.relationships.find((r) => r.type === 'ANOMALY') || null;

  const openRel = (rel) => { setDrawer({ kind: 'rel', data: rel }); setWhyOpen(false); setEvOpen(false); };

  const edgeStyleFor = (e) => {
    if (e.neutral) return filter === 'ALL' ? {} : { opacity: 0.08 };
    const rel = relById(e.id);
    const active = filter === 'ALL' || filter === rel.type;
    return { opacity: active ? 1 : 0.1 };
  };

  const visibleNodeIds = useMemo(() => {
    if (filter === 'ALL') return new Set(sc.nodes.map((n) => n.id));
    const s = new Set();
    sc.edges.forEach((e) => {
      if (e.neutral) return;
      const rel = relById(e.id);
      if (rel && rel.type === filter) { s.add(e.from); s.add(e.to); }
    });
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sc]);

  const edgeGeom = (e) => {
    const a = nodeById(e.from), b = nodeById(e.to);
    if (e.path) return { d: e.path, mx: e.mx ?? (a.x + b.x) / 2, my: e.my ?? (a.y + b.y) / 2 };
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  };

  const countsLine = useMemo(() => {
    const c = { CONFLICT: 0, ANOMALY: 0, UNKNOWN: 0, SUPPORT: 0, weak: 0 };
    sc.relationships.forEach((r) => { c[r.type] += 1; if (r.supportLevel === 'weak') c.weak += 1; });
    const parts = [];
    if (c.CONFLICT) parts.push(`${c.CONFLICT} CONFLICT`);
    if (c.ANOMALY) parts.push(`${c.ANOMALY} ${c.ANOMALY > 1 ? 'ANOMALIES' : 'ANOMALY'}`);
    if (c.UNKNOWN) parts.push(`${c.UNKNOWN} UNKNOWN`);
    const strong = c.SUPPORT - c.weak;
    if (strong) parts.push(`${strong} STRONG SUPPORT`);
    if (c.weak) parts.push(`${c.weak} WEAK SUPPORT`);
    return parts.join(' · ');
  }, [sc]);

  const isLegit = caseId === 'legit-bank';

  return (
    <div className="sh-root">
      <PageHead page={page} onNav={onNav} label="Page 3 of 5 · The Evidence Graph" />
      <div className="sh-stage">
        <div className="sh-phone">
          <div className="sh-screen eg-screen">

            {/* ---------- case header ---------- */}
            <div className="eg-head">
              <div className="eg-eyebrow">TrustGuard · Evidence Graph</div>
              <h1 className="eg-title">{sc.caseId}</h1>
              <div className="eg-sub">{sc.caseType}</div>
              <div className="eg-status"><span className="eg-pulse" />{sc.statusLine}</div>
              <div className="eg-evrow">
                {sc.evidence.map((e) => <span key={e} className="eg-evchip">{e}</span>)}
              </div>
              <div className="eg-relcount">{sc.relationships.length} relationships detected</div>
              <div className="eg-backend">
                {API ? (backendCount === null ? 'Checking backend…' : `Backend connected · ${backendCount} case${backendCount === 1 ? '' : 's'} on record`) : 'Demo data · backend not configured'}
              </div>
            </div>

            {/* ---------- switch case ---------- */}
            <div className="eg-switch">
              {Object.values(CASES).map((c) => (
                <button key={c.id} className={`eg-switch-btn${c.id === caseId ? ' on' : ''}`} onClick={() => setCaseId(c.id)}>
                  {c.tabLabel}
                </button>
              ))}
            </div>

            {/* ---------- claim extraction stage ---------- */}
            <section className="eg-card">
              <div className="eg-card-head">Extracting claims</div>
              <p className="eg-raw">{sc.rawStatement}</p>
              <div className="eg-claims">
                {sc.claims.slice(0, shownClaims).map((c, i) => (
                  <button key={c.id} className="eg-claim" style={{ animationDelay: `${i * 40}ms` }} onClick={() => setDrawer({ kind: 'claim', data: c })}>
                    <span className="eg-claim-id">{c.id}</span>
                    <span className="eg-claim-label">{c.label}</span>
                    <span className="eg-claim-val">{c.value}</span>
                    <span className="eg-ai-tag">AI extraction</span>
                  </button>
                ))}
                {extracting && shownClaims < sc.claims.length && (
                  <div className="eg-extracting"><span className="eg-spinner" />Extracting structured claims…</div>
                )}
              </div>
              <p className="eg-note">{sc.extractNote}</p>
              {extracting && (
                <button className="eg-skip" onClick={() => { timers.current.forEach((c) => c()); timers.current = []; setShownClaims(sc.claims.length); setExtracting(false); }}>
                  Skip animation
                </button>
              )}
            </section>

            {!extracting && (<>
              {/* ---------- AI vs deterministic divider ---------- */}
              <div className="eg-divider">
                <div className="eg-div-row"><b>AI EXTRACTION</b><span>Turned the words into structured claims. It did not decide truth.</span></div>
                <div className="eg-div-line" />
                <div className="eg-div-row"><b>DETERMINISTIC CHECK</b><span>Compares the structures with fixed rules — same input, same result.</span></div>
                <div className="eg-div-line" />
                <div className="eg-div-row"><b>RELATIONSHIP</b><span>The check’s result, with its birth certificate. Never “AI detected”.</span></div>
              </div>

              {/* ---------- relationship list (primary) ---------- */}
              <section className="eg-card">
                <div className="eg-card-head">Evidence relationships</div>
                <p className="eg-list-sub">The list is the investigation. The graph below supports it.</p>
                <div className="eg-rels">
                  {sc.relationships.map((r) => (
                    <button key={r.id} className="eg-rel" onClick={() => openRel(r)}>
                      <span className="eg-rel-dot" style={{ background: REL_META[r.type].color }} />
                      <span className="eg-rel-main">
                        <span className="eg-rel-title">{r.title}</span>
                        <span className="eg-rel-id">{r.id} · {r.check}</span>
                      </span>
                      <TypeBadge type={r.type} weak={r.supportLevel === 'weak'} />
                      <span className="eg-rel-go">›</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* ---------- interactive graph ---------- */}
              <section className="eg-card">
                <div className="eg-card-head">Evidence graph</div>
                <div className="eg-filters">
                  {FILTERS.map((f) => (
                    <button key={f} className={`eg-filter${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
                      {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                  <button className="eg-filter ghost" onClick={() => { setFilter('ALL'); setDrawer(null); }}>Reset view</button>
                </div>
                <svg className="eg-graph" viewBox="0 0 420 400" role="img" aria-label="Interactive evidence graph">
                  {sc.edges.map((e, i) => {
                    const g = edgeGeom(e);
                    const rel = e.neutral ? null : relById(e.id);
                    const col = rel ? REL_META[rel.type].color : '#3a4553';
                    const weak = rel && rel.supportLevel === 'weak';
                    const st = edgeStyleFor(e);
                    const mid = { x: g.mx, y: g.my };
                    return (
                      <g key={e.id} style={st} className="eg-edge-g">
                        {g.d ? (
                          <path d={g.d} fill="none" stroke={col} strokeWidth={rel ? 2.5 : 1.5}
                            strokeDasharray={weak || e.neutral ? '6 5' : '1'} pathLength={weak || e.neutral ? undefined : 1}
                            className={weak || e.neutral ? '' : 'eg-draw'} style={{ animationDelay: `${0.3 + i * 0.12}s` }} />
                        ) : (
                          <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={col} strokeWidth={rel ? 2.5 : 1.5}
                            strokeDasharray={weak || e.neutral ? '6 5' : '1'} pathLength={weak || e.neutral ? undefined : 1}
                            className={weak || e.neutral ? '' : 'eg-draw'} style={{ animationDelay: `${0.3 + i * 0.12}s` }} />
                        )}
                        {/* hit area */}
                        {g.d
                          ? <path d={g.d} fill="none" stroke="transparent" strokeWidth={18} className="eg-hit"
                              onClick={() => rel && openRel(rel)} />
                          : <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="transparent" strokeWidth={18} className="eg-hit"
                              onClick={() => rel && openRel(rel)} />}
                        {!e.neutral && (
                          <g className="eg-hit" onClick={() => rel && openRel(rel)}>
                            <circle cx={mid.x} cy={mid.y} r={11} fill="#10151c" stroke={col} strokeWidth={1.5} />
                            <text x={mid.x} y={mid.y + 3.5} textAnchor="middle" className="eg-edge-label">{rel.id}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                  {sc.nodes.map((n, i) => {
                    const s = NODE_STYLE[n.kind];
                    const dim = filter !== 'ALL' && !visibleNodeIds.has(n.id);
                    const w = Math.max(76, n.label.length * 7.5 + 26);
                    return (
                      <g key={n.id} className={`eg-node${dim ? ' dim' : ''}`}
                        style={{ animationDelay: `${i * 0.09}s` }}
                        onClick={() => setDrawer({ kind: 'node', data: n })}>
                        <rect x={n.x - w / 2} y={n.y - 19} width={w} height={38} rx={10}
                          fill="#141b25" stroke={s.stroke} strokeWidth={1.6} strokeDasharray={s.dash} />
                        <text x={n.x} y={n.y + 4.5} textAnchor="middle" className="eg-node-label">{n.label}</text>
                      </g>
                    );
                  })}
                </svg>
                <div className="eg-legend">
                  {Object.entries(REL_META).map(([t, m]) => (
                    <span key={t} className="eg-leg"><span className="eg-leg-dot" style={{ background: m.color }} />{t}</span>
                  ))}
                  <span className="eg-leg"><span className="eg-leg-line" />structural</span>
                </div>
                <p className="eg-note">Tap a node or an edge to inspect it. Filter to isolate one relationship type.</p>
              </section>

              {/* ---------- not averaged ---------- */}
              <section className="eg-card eg-avg">
                <div className="eg-card-head">Evidence is not averaged</div>
                <p className="eg-note">TrustGuard does not blend findings into one score. Every relationship stays individually inspectable.</p>
                <div className="eg-avg-row">
                  {sc.relationships.map((r) => (
                    <span key={r.id} className="eg-avg-chip" style={{ '--rc': REL_META[r.type].color }}>
                      {r.id} · {r.type}{r.supportLevel === 'weak' ? ' (weak)' : ''} → remains visible
                    </span>
                  ))}
                </div>
              </section>

              {/* ---------- uncertainty ---------- */}
              <section className="eg-card">
                <div className="eg-card-head">Uncertainty</div>
                {unknownRels.length ? unknownRels.map((r) => (
                  <button key={r.id} className="eg-unc" onClick={() => openRel(r)}>
                    <TypeBadge type="UNKNOWN" />
                    <span className="eg-unc-text">{r.result}</span>
                    <span className="eg-note">{r.uncertainty}</span>
                    <span className="eg-rel-go">›</span>
                  </button>
                )) : (
                  <p className="eg-note">No unknowns in this case — every checked relationship resolved against available evidence.</p>
                )}
              </section>

              {/* ---------- case interpretation ---------- */}
              <section className={`eg-card eg-interp${isLegit ? ' ok' : ''}`}>
                <div className="eg-card-head">Case interpretation</div>
                <p className="eg-interp-line">{sc.interpretation.headline}</p>
                <p className="eg-interp-counts">{countsLine}</p>
                <p className="eg-note">{sc.interpretation.note}</p>
                <p className="eg-note dim">The graph reports relationships. It does not declare scams.</p>
                {!seam && (
                  <button className="eg-btn" onClick={() => setSeam('weakest')}>Need more evidence?</button>
                )}
                {seam === 'weakest' && (
                  <div className="eg-seam">
                    {weakest ? (
                      <>
                        <div className="eg-seam-head">Weakest link</div>
                        <button className="eg-rel" onClick={() => openRel(weakest)}>
                          <span className="eg-rel-dot" style={{ background: REL_META[weakest.type].color }} />
                          <span className="eg-rel-main">
                            <span className="eg-rel-title">{weakest.title}</span>
                            <span className="eg-rel-id">{weakest.id} · needs independent evidence first</span>
                          </span>
                          <TypeBadge type={weakest.type} weak={weakest.supportLevel === 'weak'} />
                          <span className="eg-rel-go">›</span>
                        </button>
                      </>
                    ) : (
                      <p className="eg-note">No weak link — every checked relationship resolved against available evidence.</p>
                    )}
                    <button className="eg-btn" onClick={() => setSeam('next')}>Find the weakest link</button>
                  </div>
                )}
                {seam === 'next' && (
                  <div className="eg-seam">
                    <div className="eg-seam-head">Verification Loop — next stage</div>
                    <p className="eg-note">Idea 4 will start here: take the weakest link, run one independent check, and update this case. Not built yet.</p>
                  </div>
                )}
              </section>

              <p className="eg-foot">Prototype · simulated case data · relationships shown are illustrative</p>
            </>)}

            {/* ---------- drawer ---------- */}
            {drawer && (
              <div className="eg-drawer-wrap" onClick={() => setDrawer(null)}>
                <div className="eg-drawer" onClick={(e) => e.stopPropagation()}>
                  <button className="eg-drawer-x" onClick={() => setDrawer(null)}>✕</button>
                  {drawer.kind === 'claim' && (
                    <>
                      <div className="eg-card-head">{drawer.data.id} · Claim</div>
                      <p className="eg-drawer-quote">“{drawer.data.value}”</p>
                      <div className="eg-drow"><span>Label</span><b>{drawer.data.label}</b></div>
                      <div className="eg-drow"><span>Source</span><b>{drawer.data.source}</b></div>
                      <div className="eg-drow"><span>Evidence location</span><b>{drawer.data.location}</b></div>
                      <div className="eg-drow"><span>Extraction method</span><b>{drawer.data.method}</b></div>
                      <div className="eg-drow"><span>Status</span><b className="eg-claim-status">{drawer.data.status}</b></div>
                      <p className="eg-note">A claimed identity is never shown as verified.</p>
                    </>
                  )}
                  {drawer.kind === 'node' && (
                    <>
                      <div className="eg-card-head">Node · {drawer.data.label}</div>
                      <p className="eg-note">{drawer.data.detail}</p>
                      <div className="eg-drow"><span>Type</span><b>{NODE_KIND[drawer.data.kind].label}</b></div>
                      <div className="eg-drow"><span>Source</span><b>{drawer.data.source}</b></div>
                      <div className="eg-drow"><span>Status</span><b>{drawer.data.status}</b></div>
                    </>
                  )}
                  {drawer.kind === 'rel' && (
                    <>
                      <div className="eg-card-head">Relationship details</div>
                      <div className="eg-rel-type-row">
                        <TypeBadge type={drawer.data.type} weak={drawer.data.supportLevel === 'weak'} />
                        <span className="eg-rel-id">{drawer.data.id} · {drawer.data.title}</span>
                      </div>
                      {drawer.data.supportLevel === 'weak' && (
                        <div className="eg-weak-banner">WEAK SUPPORT — RESEMBLANCE ONLY · cannot outweigh a conflict</div>
                      )}
                      <div className="eg-ab">
                        <div className="eg-ab-col"><span>Claim A</span><b>“{drawer.data.claimA}”</b><i>{drawer.data.sourceA}</i></div>
                        <div className="eg-ab-vs">vs</div>
                        <div className="eg-ab-col"><span>Claim B</span><b>“{drawer.data.claimB}”</b><i>{drawer.data.sourceB}</i></div>
                      </div>
                      <div className="eg-drow"><span>Check</span><b>{drawer.data.check}</b></div>
                      <div className="eg-drow"><span>Method</span><b>{drawer.data.method}</b></div>
                      <div className="eg-drow"><span>Result</span><b>{drawer.data.result}</b></div>
                      <div className="eg-drow"><span>Confidence</span><b>{drawer.data.confidence}</b></div>
                      <p className="eg-note">{drawer.data.uncertainty}</p>
                      <div className="eg-drawer-btns">
                        <button className={`eg-btn sm${whyOpen ? ' on' : ''}`} onClick={() => setWhyOpen(!whyOpen)}>Why?</button>
                        <button className={`eg-btn sm${evOpen ? ' on' : ''}`} onClick={() => setEvOpen(!evOpen)}>View evidence</button>
                      </div>
                      {whyOpen && <p className="eg-why">{drawer.data.why}</p>}
                      {evOpen && (
                        <div className="eg-evidence">
                          {drawer.data.evidence.map((ev, i) => (
                            <div key={i} className="eg-ev-card">
                              <div className="eg-ev-label">{ev.label}</div>
                              <p className="eg-ev-text"><Highlight text={ev.text} highlight={ev.highlight} /></p>
                            </div>
                          ))}
                          <p className="eg-note"><b>Why this matters:</b> {drawer.data.evidenceNote}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
