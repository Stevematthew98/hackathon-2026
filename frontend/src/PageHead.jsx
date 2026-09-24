export default function PageHead({ page, onNav, label }) {
  return (
    <div className="g-page-head">
      <div className="g-brand">
        <span className="g-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <span className="g-brand-name">TrustGuard</span>
        <span className="g-live-tag"><span className="g-pulse" />live prototype</span>
      </div>
      <div className="g-pages" aria-label="Prototype pages">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`g-dot${n === page ? ' on' : ''}`}
            disabled={n > 2}
            onClick={() => n <= 2 && onNav(n)}
            title={n === 1 ? 'Page 1 · The Case Builds Itself' : n === 2 ? 'Page 2 · Forward-to-Check' : `Page ${n} · coming next`}
            aria-label={n === 1 ? 'Go to page 1' : n === 2 ? 'Go to page 2' : `Page ${n}, coming next`}
          />
        ))}
        <span className="g-page-label">{label}</span>
      </div>
    </div>
  );
}
