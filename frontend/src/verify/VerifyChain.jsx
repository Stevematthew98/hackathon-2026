// Idea 4 · VerifyChain — the verification target as a vertical evidence chain.
//
// Reuses the Idea 3 relationship vocabulary (REL_META) — not a new graph
// engine. The chain edge animates when independent evidence changes it:
// UNKNOWN → CONFLICT or UNKNOWN → SUPPORT.
import { REL_META } from '../graph/graphScenarios';
import './VerificationLoop.css';

export default function VerifyChain({ chain, edgeType, animating, onEdgeClick, compact }) {
  const meta = REL_META[edgeType] || REL_META.UNKNOWN;
  const [n0, n1, n2] = chain.nodes;
  const [c0, c1] = chain.connectors;
  return (
    <div className={`vc-chain${compact ? ' compact' : ''}`}>
      <div className="vc-node">{n0}</div>
      <div className="vc-conn">{c0}<span className="vc-arrow">↓</span></div>
      <div className="vc-node">{n1}</div>
      <div className="vc-conn">{c1}<span className="vc-arrow">↓</span></div>
      <button
        className={`vc-edge${animating ? ' vc-edge-flip' : ''}${onEdgeClick ? ' clickable' : ''}`}
        style={{ borderColor: meta.color, background: `${meta.color}14` }}
        onClick={onEdgeClick}
        title={onEdgeClick ? 'Why this matters' : undefined}
      >
        <span className="vc-edge-label">{chain.edgeLabel}</span>
        <span className="vc-edge-badge" style={{ background: meta.color }}>
          {meta.label}
        </span>
      </button>
      <div className="vc-conn"><span className="vc-arrow">↓</span></div>
      <div className="vc-node">{n2}</div>
    </div>
  );
}
