import { useEffect, useState } from 'react';
import './TrustGuard.css';

const API = import.meta.env.VITE_API_URL || '';

const STATUS_COLORS = {
  match: '#22c55e',
  mismatch: '#ef4444',
  unverifiable: '#f59e0b',
};

// Fixed layout for the evidence graph (viewBox 900x400)
const NODES = {
  E1: { x: 130, y: 90, label: 'E1 · Voice note' },
  E2: { x: 130, y: 200, label: 'E2 · Warrant photo' },
  E3: { x: 130, y: 310, label: 'E3 · Chat messages' },
  E4: { x: 450, y: 145, label: 'E4 · Claimed identity' },
  E5: { x: 450, y: 265, label: 'E5 · Phone number' },
  E6: { x: 130, y: 380, label: 'E6 · 23:47 timing' },
  PATTERNS: { x: 770, y: 90, label: 'Scam-pattern knowledge' },
  DIRECTORY: { x: 770, y: 200, label: 'Official directory' },
  FORMAT: { x: 770, y: 265, label: 'Official number format' },
  HOURS: { x: 770, y: 340, label: 'Official working hours' },
};

const EDGES = [
  { from: 'E1', to: 'E4', linkIndex: 0, label: 'voice ↔ identity' },
  { from: 'E1', to: 'PATTERNS', linkIndex: 1, label: 'script match' },
  { from: 'E2', to: 'FORMAT', linkIndex: 2, label: 'format fail' },
  { from: 'E5', to: 'DIRECTORY', linkIndex: 3, label: 'not listed' },
  { from: 'E6', to: 'HOURS', linkIndex: 4, label: '23:47 anomaly' },
];

function EvidenceGraph({ links }) {
  return (
    <svg viewBox="0 0 900 420" className="graph" role="img" aria-label="Evidence graph">
      {EDGES.map((e) => {
        const a = NODES[e.from];
        const b = NODES[e.to];
        const status = links?.[e.linkIndex]?.status || 'unverifiable';
        const color = STATUS_COLORS[status];
        return (
          <g key={`${e.from}-${e.to}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="2" opacity="0.85" />
            <text
              x={(a.x + b.x) / 2}
              y={(a.y + b.y) / 2 - 8}
              textAnchor="middle"
              className="edge-label"
              fill={color}
            >
              {e.label}
            </text>
          </g>
        );
      })}
      {Object.entries(NODES).map(([id, n]) => (
        <g key={id}>
          <rect x={n.x - 78} y={n.y - 20} width="156" height="40" rx="8" className="node" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" className="node-label">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function SimBadge() {
  return <span className="sim-badge">simulated</span>;
}

export default function TrustGuard() {
  const [caseData, setCaseData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/cases/case-01`)
      .then((r) => r.json())
      .then(setCaseData)
      .catch(() => setCaseData(null));
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/cases/case-01/analyze`, { method: 'POST' });
      setResult(await r.json());
    } finally {
      setLoading(false);
    }
  };

  const verdict = result?.pipeline?.find((s) => s.stage === 'Explainable result');

  return (
    <div className="tg">
      <header className="tg-header">
        <div>
          <p className="tg-kicker">Innovators Conclave 2026 · Track 01 AI · PS-02</p>
          <h1>TrustGuard</h1>
          <p className="tg-tagline">A case, not a file — cross-modal consistency, verification loop, decision-safe output.</p>
        </div>
      </header>

      {!caseData && <p className="tg-loading">Loading case… (is the backend running?)</p>}

      {caseData && (
        <section className="tg-case">
          <h2>Case 01 — {caseData.title}</h2>
          <p className="tg-sub">{caseData.subtitle}</p>
          <p className="tg-claim">
            Claimed identity: <strong>{caseData.claimedIdentity}</strong> · {caseData.phone} · received {caseData.receivedAt}
          </p>

          <div className="tg-evidence">
            {caseData.evidence.map((e) => (
              <div key={e.id} className="ev-card">
                <div className="ev-id">
                  {e.id} · {e.kind} {e.simulated && <SimBadge />}
                </div>
                <div className="ev-label">{e.label}</div>
                <p>{e.description}</p>
                {e.file && (
                  <audio controls src={`${API}/evidence/${e.file}`} className="ev-audio">
                    Your browser does not support audio.
                  </audio>
                )}
              </div>
            ))}
          </div>

          <button className="tg-run" onClick={runAnalysis} disabled={loading}>
            {loading ? 'Analyzing…' : result ? 'Re-run analysis' : 'Run TrustGuard analysis'}
          </button>
        </section>
      )}

      {result && (
        <>
          <section className="tg-stages">
            <h2>Pipeline trace</h2>
            {result.pipeline.map((s) => (
              <details key={s.stage} className="stage" open={s.stage !== 'Feature extraction'}>
                <summary>{s.stage}</summary>
                {s.summary && <p>{s.summary}</p>}
                {s.findings && (
                  <ul>
                    {s.findings.map((f, i) => (
                      <li key={i}>
                        <strong>[{f.evidence || f.check}]</strong> {f.detail || `${f.result} — ${f.note}`}{' '}
                        {f.simulated && <SimBadge />}
                      </li>
                    ))}
                  </ul>
                )}
                {s.links && (
                  <ul>
                    {s.links.map((l, i) => (
                      <li key={i}>
                        <span className={`dot dot-${l.status}`} /> {l.from} → {l.to}: <strong>{l.status}</strong> — {l.note}
                      </li>
                    ))}
                  </ul>
                )}
                {s.rationale && (
                  <>
                    <p>{s.rationale}</p>
                    <p className="tg-uncertain">
                      <strong>Uncertainty stated, not hidden:</strong>
                    </p>
                    <ul>
                      {s.uncertainty.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </>
                )}
                {s.verdict && (
                  <div className={`verdict verdict-${s.level || 'high'}`}>
                    <div className="verdict-level">{s.verdict}</div>
                    <ul>
                      {s.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                    <p className="tg-next">
                      <strong>Do this next:</strong>
                    </p>
                    <ul>
                      {s.nextActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>
            ))}
          </section>

          <section className="tg-graph-wrap">
            <h2>Evidence graph — contradictions stay visible</h2>
            <EvidenceGraph links={result.pipeline.find((s) => s.stage === 'Cross-modal analysis')?.links} />
            <div className="legend">
              <span><span className="dot dot-match" /> consistent</span>
              <span><span className="dot dot-mismatch" /> contradiction</span>
              <span><span className="dot dot-unverifiable" /> unverifiable</span>
            </div>
          </section>

          <section className="tg-verify">
            <h2>Verification loop</h2>
            <p>
              <strong>Weakest link:</strong> {result.verificationLoop.weakestLink}
            </p>
            <ol>
              {result.verificationLoop.challenges.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
