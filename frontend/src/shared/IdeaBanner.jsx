// Shared idea banner — one glance tells the jury which idea this page is,
// what it does, and the principle behind it. Kept deliberately compact:
// an eyebrow, one line, one micro-principle. No walls of text.
import './IdeaBanner.css';

export default function IdeaBanner({ eyebrow, line, micro }) {
  return (
    <div className="ib-banner">
      <div className="ib-eyebrow">{eyebrow}</div>
      <p className="ib-line">{line}</p>
      {micro && <p className="ib-micro">{micro}</p>}
    </div>
  );
}
