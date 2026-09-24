// Idea 3 · Check Workbench — run your own deterministic comparison.
//
// Pick two graph nodes and a check method. The page runs the same
// deterministic logic behind the documented relationships and shows the
// execution trace. It never invents a verdict: undocumented pairs honestly
// report "no relationship detected", and wrong input types are rejected as
// METHOD MISMATCH.
import { useEffect, useRef, useState } from 'react';
import { WORKBENCH_METHODS, WORKBENCH_PAIRS, NODE_WK } from './graphScenarios';
import { TypeBadge } from './EvidenceGraph';
import './EvidenceGraph.css';

function later(ms, fn) { const t = setTimeout(fn, ms); return () => clearTimeout(t); }

export default function CheckWorkbench({ sc, onOpenRel }) {
  const wk = NODE_WK[sc.id];
  const [aId, setAId] = useState(sc.nodes[0].id);
  const [bId, setBId] = useState(sc.nodes[1].id);
  const [mId, setMId] = useState('name-compare');
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [trace, setTrace] = useState([]);
  const [outcome, setOutcome] = useState(null); // {kind, ...}
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach((c) => c()), []);

  const nodeById = (id) => sc.nodes.find((n) => n.id === id);
  const method = WORKBENCH_METHODS.find((m) => m.id === mId);

  const run = () => {
    timers.current.forEach((c) => c());
    timers.current = [];
    setTrace([]);
    setOutcome(null);
    const A = nodeById(aId);
    const B = nodeById(bId);

    const playSteps = (steps, done) => {
      setPhase('running');
      steps.forEach((s, i) => timers.current.push(later(350 + i * 550, () => setTrace((t) => [...t, s]))));
      timers.current.push(later(350 + steps.length * 550, () => { setPhase('done'); done(); }));
    };

    if (aId === bId) {
      playSteps(
        [`load node · "${A.label}"`, 'validate inputs · a comparison needs two different nodes', '-> check not started'],
        () => setOutcome({ kind: 'same' })
      );
      return;
    }

    // Canonical order: first node matches needs[0] (order-independent input).
    let X = A, Y = B;
    const fits = (x, y) => wk[x.id] === method.needs[0] && wk[y.id] === method.needs[1];
    let ok = fits(X, Y);
    if (!ok && fits(Y, X)) { X = B; Y = A; ok = true; }

    if (!ok) {
      playSteps(
        [
          `load node A · "${A.label}" <- ${A.source}`,
          `load node B · "${B.label}" <- ${B.source}`,
          `validate inputs · "${method.label}" needs ${method.needsLabel}`,
          '-> method cannot run on these inputs',
        ],
        () => setOutcome({ kind: 'mismatch', method, ka: wk[A.id], kb: wk[B.id] })
      );
      return;
    }

    const key = [X.id, Y.id].sort().join('|') + '|' + method.id;
    const relId = (WORKBENCH_PAIRS[sc.id] || {})[key];
    playSteps(method.trace(X, Y), () => {
      if (relId) {
        setOutcome({ kind: 'rel', rel: sc.relationships.find((r) => r.id === relId) });
      } else {
        setOutcome({ kind: 'none', la: X.label, lb: Y.label, method: method.label });
      }
    });
  };

  return (
    <section className="eg-card">
      <div className="eg-card-head">Check workbench</div>
      <p className="eg-list-sub">Run the same deterministic checks behind the relationships above — on any two nodes you pick.</p>

      <div className="eg-wb-grid">
        <label className="eg-wb-field"><span>Node A</span>
          <select value={aId} onChange={(e) => setAId(e.target.value)}>
            {sc.nodes.map((n) => <option key={n.id} value={n.id}>{n.label} · {wk[n.id]}</option>)}
          </select>
        </label>
        <label className="eg-wb-field"><span>Node B</span>
          <select value={bId} onChange={(e) => setBId(e.target.value)}>
            {sc.nodes.map((n) => <option key={n.id} value={n.id}>{n.label} · {wk[n.id]}</option>)}
          </select>
        </label>
        <label className="eg-wb-field"><span>Check method</span>
          <select value={mId} onChange={(e) => setMId(e.target.value)}>
            {WORKBENCH_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      </div>

      <div className="eg-wb-methods">
        {WORKBENCH_METHODS.map((m) => (
          <button key={m.id} className={`eg-wb-m${m.id === mId ? ' on' : ''}`} onClick={() => setMId(m.id)}>
            <b>{m.label}</b><span>needs {m.needsLabel}</span>
          </button>
        ))}
      </div>

      <button className="eg-btn" onClick={run} disabled={phase === 'running'}>
        {phase === 'running' ? 'Running check…' : 'Run check'}
      </button>

      {(phase === 'running' || phase === 'done') && (
        <div className="eg-wb-trace">
          {trace.map((s, i) => (
            <div key={i} className="eg-wb-line"><span className="eg-wb-t">{(i * 0.55).toFixed(1)}s</span>{s}</div>
          ))}
          {phase === 'running' && <div className="eg-wb-line"><span className="eg-spinner sm" /></div>}
        </div>
      )}

      {phase === 'done' && outcome?.kind === 'rel' && (
        <div className="eg-wb-result">
          <div className="eg-wb-res-head ok">CHECK RESULT — DOCUMENTED RELATIONSHIP</div>
          <div className="eg-rel-type-row">
            <TypeBadge type={outcome.rel.type} weak={outcome.rel.supportLevel === 'weak'} />
            <span className="eg-rel-id">{outcome.rel.id} · {outcome.rel.title}</span>
          </div>
          <p className="eg-note">{outcome.rel.result}</p>
          <div className="eg-drow"><span>Confidence</span><b>{outcome.rel.confidence}</b></div>
          <button className="eg-btn sm" onClick={() => onOpenRel(outcome.rel)}>Open full birth certificate</button>
        </div>
      )}

      {phase === 'done' && outcome?.kind === 'none' && (
        <div className="eg-wb-result none">
          <div className="eg-wb-res-head">CHECK RESULT — NO RELATIONSHIP DETECTED</div>
          <p className="eg-note">The check ran correctly on “{outcome.la}” and “{outcome.lb}” and found nothing to report. Absence of a relationship is not evidence of consistency — it only means this check produced nothing.</p>
        </div>
      )}

      {phase === 'done' && outcome?.kind === 'mismatch' && (
        <div className="eg-wb-result mismatch">
          <div className="eg-wb-res-head warn">METHOD MISMATCH</div>
          <p className="eg-note">“{outcome.method.label}” needs {outcome.method.needsLabel}. It cannot compare a {outcome.ka} node with a {outcome.kb} node. Pick matching inputs, or a different method.</p>
        </div>
      )}

      {phase === 'done' && outcome?.kind === 'same' && (
        <div className="eg-wb-result mismatch">
          <div className="eg-wb-res-head warn">PICK TWO DIFFERENT NODES</div>
          <p className="eg-note">A comparison needs two distinct inputs.</p>
        </div>
      )}
    </section>
  );
}
