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
import { CASES, REL_META, NODE_KIND, REL_CHIPS } from './graphScenarios';
import CheckWorkbench from './CheckWorkbench';
import DemoWalkthrough3 from './DemoWalkthrough3';
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

export function TypeBadge({ type, weak }) {
  const m = REL_META[type];
  return (
    <span className={`eg-badge t-${type.toLowerCase()}`} style={{ '--rc': m.color }}>
      {type}{weak ? ' · WEAK' : ''}
    </span>
  );
}

export default function EvidenceGraph({ page, onNav, onStartVerify, highlight }) {
  const [caseId, setCaseId] = useState(highlight && CASES[highlight.caseId] ? highlight.caseId : 'digital-arrest');
  const highlightRef = useRef(highlight); // one-shot: open a relationship passed from Idea 5
  const sc = CASES[caseId];
  const [extracting, setExtracting] = useState(true);
  const [shownClaims, setShownClaims] = useState(0);
  const [drawer, setDrawer] = useState(null); // {kind:'claim'|'node'|'rel', data}
  const [filter, setFilter] = useState('ALL');
  const [whyOpen, setWhyOpen] = useState(false);
  const [evOpen, setEvOpen] = useState(false);
  const [backendCount, setBackendCount] = useState(null);
  const [seam, setSeam] = useState(null); // null | 'weakest' | 'next'
  const [tour, setTour] = useState(null); // null | step index
  const [part, setPart] = useState(1); // 1 = relationships, 2 = graph lab
  const [glowKey, setGlowKey] = useState(null);
  const [replay, setReplay] = useState(null); // null | {idx, playing}
  const [flashRels, setFlashRels] = useState([]);
  const [nodePos, setNodePos] = useState(() => Object.fromEntries(sc.nodes.map((n) => [n.id, { x: n.x, y: n.y }])));
  const timers = useRef([]);
  const secRefs = useRef({});
  const screenRef = useRef(null);
  const tickerRef = useRef(null);
  const dragRef = useRef(null);
  const clickSuppress = useRef(false);
  const glowTimer = useRef(null);

  const finishExtraction = () => {
    timers.current.forEach((c) => c());
    timers.current = [];
    setShownClaims(sc.claims.length);
    setExtracting(false);
  };

  const TOUR = [
    { key: 'extract', part: 1, title: 'Claims are extracted', body: 'Watch raw words become structured claims. The AI only translates — it never decides truth.', act: null },
    { key: 'claims', part: 1, title: 'Every claim is inspectable', body: 'Tap any claim card. Its source, evidence location and extraction method are on record.', act: 'claim' },
    { key: 'divider', part: 1, title: 'Two different machines', body: 'AI extraction structures the words. Deterministic checks compare those structures with fixed rules.', act: null },
    { key: 'list', part: 1, title: 'Relationships are the core', body: 'The list is the investigation. Every row carries a full birth certificate — open R1 and look.', act: 'rel' },
    { key: 'graph', part: 2, title: 'The graph supports the list', body: 'Drag the nodes. Filter edge types. Press Replay analysis to watch each check run in order.', act: null },
    { key: 'interp', part: 1, title: 'The weakest link decides what’s next', body: 'Unresolved evidence points at the next check — that is where the Verification Loop begins.', act: 'seam' },
  ];

  const relById = (id) => sc.relationships.find((r) => r.id === id);
  const nodeById = (id) => { const n = sc.nodes.find((x) => x.id === id); const p = nodePos[id]; return p ? { ...n, x: p.x, y: p.y } : n; };
  const homeOf = (id) => { const n = sc.nodes.find((x) => x.id === id); return { x: n.x, y: n.y }; };
  const moved = (id) => { const h = homeOf(id), p = nodePos[id]; return !!p && (p.x !== h.x || p.y !== h.y); };
  const homePos = () => Object.fromEntries(sc.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));

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
    setTour(null);
    setPart(1);
    setGlowKey(null);
    setReplay(null);
    setFlashRels([]);
    setNodePos(Object.fromEntries(sc.nodes.map((n) => [n.id, { x: n.x, y: n.y }])));
    // one-shot highlight from Idea 5: skip the animation, open the relationship
    const hl = highlightRef.current;
    if (hl && hl.caseId === caseId) {
      highlightRef.current = null;
      const rel = sc.relationships.find((r) => r.id === hl.relId);
      setShownClaims(sc.claims.length);
      setExtracting(false);
      if (rel) setDrawer({ kind: 'rel', data: rel });
      return;
    }
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

  // ---- guided tour (routes across both parts) ----
  useEffect(() => {
    if (tour === null) return;
    const step = TOUR[tour];
    if (part !== step.part) { setPart(step.part); return; } // re-runs after the part flips
    setDrawer(null); setWhyOpen(false); setEvOpen(false);
    const el = secRefs.current[step.key];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setGlowKey(step.key);
    if (glowTimer.current) clearTimeout(glowTimer.current);
    glowTimer.current = setTimeout(() => setGlowKey(null), 2600);
    let act = null;
    if (step.act === 'claim') act = setTimeout(() => setDrawer({ kind: 'claim', data: sc.claims[0] }), 850);
    if (step.act === 'rel') act = setTimeout(() => openRel(sc.relationships[0]), 850);
    if (step.act === 'seam') act = setTimeout(() => setSeam('weakest'), 850);
    return () => { if (act) clearTimeout(act); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, part]);

  const startTour = () => {
    if (extracting) {
      finishExtraction();
      setTimeout(() => setTour(0), 400);
    } else setTour(0);
  };

  // Scroll back to top when the user flips parts manually (not during the tour).
  useEffect(() => {
    if (tour === null && screenRef.current) screenRef.current.scrollTo({ top: 0 });
  }, [part, tour]);

  // ---- replay analysis ----
  const relEdges = useMemo(() => sc.edges.filter((e) => !e.neutral), [sc]);
  const replayLog = useMemo(() => {
    const lines = [`claim extraction complete · ${sc.claims.length} structured claims`];
    sc.relationships.forEach((r) => lines.push(`${r.id} · ${r.check} → ${r.type}${r.supportLevel === 'weak' ? ' (weak)' : ''}`));
    lines.push(`replay complete · ${sc.relationships.length} relationships · 0 scores computed`);
    return lines;
  }, [sc]);

  useEffect(() => {
    if (!replay || !replay.playing) return;
    if (replay.idx >= relEdges.length) { setReplay((r) => (r ? { ...r, playing: false } : r)); return; }
    const t = setTimeout(() => setReplay((r) => (r ? { ...r, idx: r.idx + 1 } : r)), 1600);
    return () => clearTimeout(t);
  }, [replay, relEdges]);

  useEffect(() => {
    if (tickerRef.current) tickerRef.current.scrollTop = tickerRef.current.scrollHeight;
  }, [replay]);

  const startReplay = () => { setFilter('ALL'); setDrawer(null); setReplay({ idx: 0, playing: true }); };
  const edgeVisibleInReplay = (e) => {
    if (!replay || e.neutral) return true;
    const i = relEdges.findIndex((x) => x.id === e.id);
    return i < replay.idx;
  };
  const replayShownLines = useMemo(() => {
    if (!replay) return [];
    const out = [replayLog[0]];
    for (let i = 1; i <= replay.idx && i <= relEdges.length; i++) out.push(replayLog[i]);
    if (replay.idx >= relEdges.length) out.push(replayLog[replayLog.length - 1]);
    return out;
  }, [replay, replayLog, relEdges]);

  // ---- evidence chip -> relationships ----
  const flashEvidence = (chip) => {
    const ids = sc.relationships
      .filter((r) => (REL_CHIPS[sc.id]?.[r.id] || []).includes(chip))
      .map((r) => r.id);
    if (!ids.length) return;
    setFlashRels(ids);
    const el = secRefs.current.list;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setFlashRels([]), 2400);
  };

  const techLine = useMemo(() => {
    const types = new Set(sc.relationships.map((r) => r.type)).size;
    return `${sc.claims.length} structured claims · ${sc.relationships.length} deterministic checks · ${types} edge types · 0 scores computed`;
  }, [sc]);

  const openRel = (rel) => { setDrawer({ kind: 'rel', data: rel }); setWhyOpen(false); setEvOpen(false); };

  const edgeStyleFor = (e) => {
    if (e.neutral) return filter === 'ALL' ? {} : { opacity: 0.08 };
    if (replay && !edgeVisibleInReplay(e)) return { opacity: 0.06 };
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
    // Curved edges only hold their shape at home positions; dragged layouts fall back to straight lines.
    if (e.path && !moved(e.from) && !moved(e.to)) return { d: e.path, mx: e.mx ?? (a.x + b.x) / 2, my: e.my ?? (a.y + b.y) / 2 };
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
          <div className="sh-screen eg-screen" ref={screenRef}>

            {/* ---------- case header ---------- */}
            <div className="eg-head">
              <div className="eg-eyebrow">TrustGuard · Evidence Graph</div>
              <h1 className="eg-title">{sc.caseId}</h1>
              <div className="eg-sub">{sc.caseType}</div>
              <div className="eg-status"><span className="eg-pulse" />{sc.statusLine}</div>
              <div className="eg-evrow">
                {sc.evidence.map((e) => (
                  <button key={e} className="eg-evchip as-btn" onClick={() => flashEvidence(e)} title="Show the relationships that use this evidence">{e}</button>
                ))}
              </div>
              <div className="eg-techline">{techLine}</div>
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
            <button className="eg-tour-btn" onClick={startTour}>Take the guided tour · 6 steps</button>

            {/* DEMO WALKTHROUGH — additive presenter script (Idea 3 only) */}
            <DemoWalkthrough3
              caseId={caseId}
              onSwitchCase={(id) => setCaseId(id)}
              onOpenRel={(id) => openRel(sc.relationships.find((r) => r.id === id) || sc.relationships[0])}
              onTakeTour={startTour}
              onShowGraphLab={() => setPart(2)}
              onReplay={() => { setPart(2); startReplay(); }}
              onGoVerify={() => onStartVerify && onStartVerify(caseId)}
            />

            <div className="eg-pager">
              <button className={`eg-pager-btn${part === 1 ? ' on' : ''}`} onClick={() => setPart(1)}>
                <b>Part 1</b><span>Relationships</span>
              </button>
              <button className={`eg-pager-btn${part === 2 ? ' on' : ''}`} onClick={() => setPart(2)}>
                <b>Part 2</b><span>Graph lab</span>
              </button>
            </div>

            {part === 1 && (<>

            {/* ---------- claim extraction stage ---------- */}
            <section className={`eg-card${glowKey === 'extract' ? ' eg-tour-glow' : ''}`} ref={(el) => { secRefs.current.extract = el; }}>
              <div className="eg-card-head">Extracting claims</div>
              <p className="eg-raw">{sc.rawStatement}</p>
              <div className={`eg-claims${glowKey === 'claims' ? ' eg-tour-glow' : ''}`} ref={(el) => { secRefs.current.claims = el; }}>
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
                <button className="eg-skip" onClick={finishExtraction}>
                  Skip animation
                </button>
              )}
            </section>

            {!extracting && (<>
              {/* ---------- AI vs deterministic divider ---------- */}
              <div className={`eg-divider${glowKey === 'divider' ? ' eg-tour-glow' : ''}`} ref={(el) => { secRefs.current.divider = el; }}>
                <div className="eg-div-row"><b>AI EXTRACTION</b><span>Turned the words into structured claims. It did not decide truth.</span></div>
                <div className="eg-div-line" />
                <div className="eg-div-row"><b>DETERMINISTIC CHECK</b><span>Compares the structures with fixed rules — same input, same result.</span></div>
                <div className="eg-div-line" />
                <div className="eg-div-row"><b>RELATIONSHIP</b><span>The check’s result, with its birth certificate. Never “AI detected”.</span></div>
              </div>

              {/* ---------- relationship list (primary) ---------- */}
              <section className={`eg-card${glowKey === 'list' ? ' eg-tour-glow' : ''}`} ref={(el) => { secRefs.current.list = el; }}>
                <div className="eg-card-head">Evidence relationships</div>
                <p className="eg-list-sub">The list is the investigation. The graph in Part 2 supports it.</p>
                <div className="eg-rels">
                  {sc.relationships.map((r) => (
                    <button key={r.id} className={`eg-rel${flashRels.includes(r.id) ? ' eg-flash' : ''}`} onClick={() => openRel(r)}>
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
              <section className={`eg-card eg-interp${isLegit ? ' ok' : ''}${glowKey === 'interp' ? ' eg-tour-glow' : ''}`} ref={(el) => { secRefs.current.interp = el; }}>
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
                    <p className="eg-note">Take the weakest link, run one independent check, and fold the result back into this case.</p>
                    <button className="eg-btn" onClick={() => onStartVerify && onStartVerify(caseId)}>
                      Start Verification Loop →
                    </button>
                  </div>
                )}
              </section>

              <p className="eg-foot">Prototype · simulated case data · relationships shown are illustrative</p>
            </>)}
            </>)}

            {part === 2 && (<>
{/* ---------- interactive graph ---------- */}
              <section className={`eg-card${glowKey === 'graph' ? ' eg-tour-glow' : ''}`} ref={(el) => { secRefs.current.graph = el; }}>
                <div className="eg-card-head">Evidence graph</div>
                <div className="eg-replay-row">
                  {!replay ? (
                    <button className="eg-btn sm" onClick={startReplay}>▶ Replay analysis</button>
                  ) : (
                    <>
                      <button className="eg-btn sm" onClick={() => setReplay((r) => (r ? { ...r, playing: !r.playing } : r))}>
                        {replay.playing ? '⏸ Pause' : '▶ Resume'}
                      </button>
                      <button className="eg-btn sm ghost" onClick={startReplay}>Restart</button>
                      <button className="eg-btn sm ghost" onClick={() => setReplay((r) => (r ? { ...r, idx: relEdges.length, playing: false } : r))}>Skip to end</button>
                      <button className="eg-btn sm ghost" onClick={() => setReplay(null)}>Close</button>
                    </>
                  )}
                </div>
                {replay && (
                  <>
                    <div className="eg-replay-meta">Analysis replay · {Math.min(replay.idx, relEdges.length)}/{relEdges.length} checks</div>
                    <div className="eg-ticker" ref={tickerRef}>
                      {replayShownLines.map((l, i) => <div key={i} className="eg-tick-line">{l}</div>)}
                    </div>
                  </>
                )}
                <div className="eg-filters">
                  {FILTERS.map((f) => (
                    <button key={f} className={`eg-filter${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
                      {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                  <button className="eg-filter ghost" onClick={() => { setFilter('ALL'); setDrawer(null); setReplay(null); setNodePos(homePos()); }}>Reset view</button>
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
                        onPointerDown={(e) => {
                          e.currentTarget.setPointerCapture(e.pointerId);
                          dragRef.current = { id: n.id, sx: e.clientX, sy: e.clientY, moved: false };
                        }}
                        onPointerMove={(e) => {
                          const d = dragRef.current;
                          if (!d || d.id !== n.id) return;
                          const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
                          if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
                          if (!d.moved) return;
                          const svg = e.currentTarget.ownerSVGElement;
                          const r = svg.getBoundingClientRect();
                          const h = homeOf(n.id);
                          const nx = Math.min(380, Math.max(40, h.x + (dx * 420) / r.width));
                          const ny = Math.min(370, Math.max(30, h.y + (dy * 400) / r.height));
                          setNodePos((p) => ({ ...p, [n.id]: { x: Math.round(nx), y: Math.round(ny) } }));
                        }}
                        onPointerUp={() => {
                          if (dragRef.current && dragRef.current.moved) clickSuppress.current = true;
                          dragRef.current = null;
                        }}
                        onPointerCancel={() => { dragRef.current = null; }}
                        onClick={() => {
                          if (clickSuppress.current) { clickSuppress.current = false; return; }
                          setDrawer({ kind: 'node', data: n });
                        }}>
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
                <p className="eg-note">Drag nodes to rearrange · tap a node or an edge to inspect · Replay the analysis to watch each check run.</p>
              </section>

              {/* ---------- check workbench ---------- */}
              <CheckWorkbench key={caseId} sc={sc} onOpenRel={openRel} />
            </>)}

            {/* ---------- guided tour card ---------- */}
            {tour !== null && (
              <div className="eg-tour">
                <div className="eg-tour-top"><span>GUIDED TOUR</span><span>{tour + 1} / {TOUR.length}</span></div>
                <div className="eg-tour-title">{TOUR[tour].title}</div>
                <p className="eg-tour-body">{TOUR[tour].body}</p>
                <div className="eg-tour-btns">
                  <button className="eg-btn sm ghost" disabled={tour === 0} onClick={() => setTour(tour - 1)}>Back</button>
                  {tour < TOUR.length - 1
                    ? <button className="eg-btn sm" onClick={() => setTour(tour + 1)}>Next</button>
                    : <button className="eg-btn sm" onClick={() => setTour(null)}>Done</button>}
                  <button className="eg-tour-skip" onClick={() => setTour(null)}>Skip</button>
                </div>
              </div>
            )}

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
