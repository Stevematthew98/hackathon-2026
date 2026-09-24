import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CALL_SCRIPT,
  CALLER_NUMBER_FULL,
  CALLER_NUMBER_MASKED,
  CASE_ID,
  SCRIPT_END,
} from './callScript';
import { createEngine, TRIPWIRE_THRESHOLD } from './signalEngine';
import './Guardian.css';

const WAVEFORM = [
  22, 38, 30, 52, 44, 28, 60, 36, 48, 26, 55, 40, 32, 62, 46, 30, 50, 38, 58, 34,
  42, 28, 54, 44, 36, 60, 48, 32, 40, 56, 30, 46, 52, 36, 28, 58, 44, 38, 50, 32,
  60, 42, 34, 48, 28, 54, 40, 46, 36, 58, 30, 44, 52, 38, 28, 50,
];

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function todayStamp() {
  return new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export default function Guardian() {
  const [phase, setPhase] = useState('idle'); // idle | incoming | live | case | discarded
  const [permission, setPermission] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [fired, setFired] = useState([]);
  const [tripwire, setTripwire] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [numberRevealed, setNumberRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [playPos, setPlayPos] = useState(0);
  const [claim, setClaim] = useState(null);
  const [finalDuration, setFinalDuration] = useState(0);

  const engineRef = useRef(null);
  const timeRef = useRef(0);
  const processedRef = useRef(0);
  const transcriptEndRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  // ---- call clock: advances time, feeds new transcript lines to the engine ----
  useEffect(() => {
    if (phase !== 'live') return;
    const iv = setInterval(() => {
      const next = +(timeRef.current + 0.25).toFixed(2);
      timeRef.current = next;
      const due = [];
      while (
        processedRef.current < CALL_SCRIPT.length &&
        CALL_SCRIPT[processedRef.current].t <= next
      ) {
        due.push(CALL_SCRIPT[processedRef.current]);
        processedRef.current += 1;
      }
      let newly = [];
      if (due.length && engineRef.current) newly = engineRef.current.processLines(due);
      setCallTime(next);
      if (newly.length) setFired((p) => [...p, ...newly]);
    }, 250);
    return () => clearInterval(iv);
  }, [phase]);

  // ---- tripwire: 4+ signals start an investigation. Never a verdict. ----
  useEffect(() => {
    if (fired.length >= TRIPWIRE_THRESHOLD && !tripwire) {
      setTripwire(true);
      setSheetOpen(true);
      try { navigator.vibrate && navigator.vibrate(40); } catch { /* noop */ }
    }
  }, [fired, tripwire]);

  // ---- simulated audio playback ----
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setPlayPos((p) => {
        const n = p + 0.5;
        if (n >= finalDuration) { setPlaying(false); return finalDuration; }
        return n;
      });
    }, 500);
    return () => clearInterval(iv);
  }, [playing, finalDuration]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [callTime, phase]);

  const heardLines = useMemo(
    () => CALL_SCRIPT.filter((l) => l.t <= callTime),
    [callTime]
  );

  // ---------------- actions ----------------
  const answer = () => {
    engineRef.current = createEngine({ callerUnknown: true });
    const initial = engineRef.current.start(0);
    timeRef.current = 0;
    processedRef.current = 0;
    setFired(initial);
    setClaim(null);
    setTripwire(false);
    setSheetOpen(false);
    setCallTime(0);
    setPlaying(false);
    setPlayPos(0);
    setTranscriptOpen(false);
    setNumberRevealed(false);
    setConfirmDelete(false);
    setExpandedSignal(null);
    setPhase('live');
  };

  const endCall = () => {
    const eng = engineRef.current;
    setFinalDuration(Math.floor(timeRef.current));
    setClaim(eng ? eng.getClaim() : null);
    setPlaying(false);
    if (tripwire) {
      setPhase('case');
    } else {
      // Privacy rule: no tripwire → captured audio/transcript discarded immediately.
      setPhase('discarded');
    }
  };

  const deleteCase = () => {
    setPhase('idle');
    setFired([]);
    setTripwire(false);
    setClaim(null);
    showToast('Case deleted — everything captured was discarded.');
  };

  const caseLines = useMemo(
    () => CALL_SCRIPT.filter((l) => l.t <= finalDuration),
    [finalDuration]
  );

  const firedIds = new Set(fired.map((f) => f.id));

  // ---------------- screens ----------------
  return (
    <div className="g-root">
      <div className="g-page-head">
        <div className="g-brand">
          <span className="g-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <span className="g-brand-name">TrustGuard</span>
        </div>
        <div className="g-pages" aria-label="Prototype pages">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`g-dot${n === 1 ? ' on' : ''}`} title={n === 1 ? 'Page 1 · The Case Builds Itself' : `Page ${n} · coming next`} />
          ))}
          <span className="g-page-label">Page 1 of 5 · The Case Builds Itself</span>
        </div>
      </div>

      <div className="g-stage">
        <div className="g-phone">
          <div className="g-notch" />
          <div className="g-screen">

            {/* ============ IDLE ============ */}
            {phase === 'idle' && (
              <div className="g-pane g-fade">
                <div className="g-hero">
                  <div className="g-hero-mark" aria-hidden="true">
                    <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M24 4l16 6v12c0 10-6.8 17.4-16 22C14.8 39.4 8 32 8 22V10l16-6z" />
                      <circle cx="24" cy="22" r="6" />
                      <path d="M28.5 26.5L34 32" />
                    </svg>
                  </div>
                  <h1>TrustGuard</h1>
                  <p className="g-sub">The case builds itself.</p>
                  <div className="g-protect on"><span className="g-pulse" />Protection ON</div>
                </div>

                <div className="g-card">
                  <div className="g-card-row">
                    <div>
                      <div className="g-card-title">Call audio permission</div>
                      <div className="g-card-sub">{permission ? 'Granted · revocable anytime' : 'Revoked · protection is off'}</div>
                    </div>
                    <button className={`g-toggle${permission ? ' on' : ''}`} onClick={() => setPermission(!permission)} aria-label="Toggle permission">
                      <span />
                    </button>
                  </div>
                </div>

                <div className="g-how">
                  <div className="g-how-step"><b>1</b><span>A call or message arrives — TrustGuard wakes for that event only.</span></div>
                  <div className="g-how-step"><b>2</b><span>Suspicious signals are counted. One alone means nothing.</span></div>
                  <div className="g-how-step"><b>3</b><span>4+ signals trip the wire — the case builds itself. You tap once.</span></div>
                </div>

                <button className="g-primary" disabled={!permission} onClick={() => setPhase('incoming')}>
                  Simulate incoming scam call
                </button>
                {!permission && <p className="g-warn">Grant permission to enable protection.</p>}
                <p className="g-fine">
                  Prototype simulation — no real calls are intercepted. Event-only:
                  nothing is captured between calls.
                </p>
              </div>
            )}

            {/* ============ INCOMING ============ */}
            {phase === 'incoming' && (
              <div className="g-pane g-call-in g-fade">
                <div className="g-tg-pill">TrustGuard is on — this call will be checked</div>
                <div className="g-avatar-ring"><div className="g-avatar">?</div></div>
                <div className="g-in-name">Unknown number</div>
                <div className="g-in-num">{CALLER_NUMBER_MASKED}</div>
                <div className="g-in-status">Incoming call…</div>
                <div className="g-call-actions">
                  <button className="g-call-btn decline" onClick={() => { setPhase('idle'); showToast('Call declined — nothing was captured.'); }} aria-label="Decline">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M3 8.5C3 8.5 6 5 9 5c1.5 0 2.5.8 3.4 1.9L14 8.5c.6.8.4 2-.5 2.6l-1.6 1.1c.4 1.5 1.6 3.3 3.4 4.7 1.4-1 2.9-2.1 3.7-2.5.9-.5 2-.2 2.6.6l1.2 1.5c.9 1.2.8 2.9-.3 3.9-2.6 2.4-5.9 3.6-9.4 3.1C8.6 22.4 4.6 18.6 3.6 14 3 11.4 2.7 9.9 3 8.5z" transform="rotate(135 12 12)" /></svg>
                  </button>
                  <button className="g-call-btn answer" onClick={answer} aria-label="Answer">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6.6 3.6c.4-.4 1-.5 1.5-.2l2.2 1.3c.5.3.7.9.5 1.5l-.9 2.1c-.2.5-.7.8-1.2.7l-1.1-.2c-.3 1.2.3 3 1.7 4.9 1.4 1.8 3 2.9 4.3 3.1l-.1-1.1c0-.5.3-1 .8-1.2l2.1-.9c.5-.2 1.2 0 1.5.5l1.3 2.2c.3.5.2 1.1-.2 1.5l-1 1c-.5.5-1.2.7-1.9.6-3.2-.6-6.9-3-9.3-6.1-2.4-3.1-3.4-6.5-2.9-9.4.1-.7.5-1.3 1-1.7l1.7-1.6z" /></svg>
                  </button>
                </div>
                <p className="g-fine">Simulated incoming call</p>
              </div>
            )}

            {/* ============ LIVE ============ */}
            {phase === 'live' && (
              <div className="g-pane g-fade">
                <div className="g-live-head">
                  <div className="g-live-num">{CALLER_NUMBER_MASKED}</div>
                  <div className="g-live-timer">{fmt(callTime)}</div>
                  <div className="g-checking"><span className="g-pulse blue" />Checking this call…</div>
                </div>

                {tripwire && !sheetOpen && (
                  <button className="g-trip-banner" onClick={() => setSheetOpen(true)}>
                    <span className="g-trip-dot" />Suspicious pattern detected — tap to view
                  </button>
                )}

                <div className="g-signals">
                  <div className="g-signals-title">Signals</div>
                  {engineRef.current?.defs.map((d) => {
                    const f = fired.find((x) => x.id === d.id);
                    const open = expandedSignal === d.id;
                    return (
                      <div key={d.id} className={`g-signal${f ? ' hit' : ''}`}>
                        <button className="g-signal-head" onClick={() => f && setExpandedSignal(open ? null : d.id)}>
                          <span className={`g-signal-box${f ? ' hit' : ''}`}>{f ? '✓' : ''}</span>
                          <span className="g-signal-label">{d.label}</span>
                          {f && <span className="g-signal-t">{fmt(f.t)}</span>}
                        </button>
                        {f && open && (
                          <div className="g-signal-ev">
                            <div className="g-signal-hint">{d.hint}</div>
                            <div className="g-signal-quote">“{f.quote}”</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <p className="g-signals-note">Signals start an investigation. They never decide it.</p>
                </div>

                <div className="g-transcript">
                  {heardLines.map((l, i) => (
                    <div key={i} className={`g-line ${l.speaker}`}>
                      <span className="g-who">{l.speaker === 'caller' ? 'Caller' : 'You'}</span>
                      <p>{l.text}</p>
                    </div>
                  ))}
                  {callTime >= SCRIPT_END && <p className="g-line-hold">…caller is still on the line.</p>}
                  <div ref={transcriptEndRef} />
                </div>

                <button className="g-end" onClick={endCall}>End call</button>

                {/* tripwire sheet */}
                {tripwire && sheetOpen && (
                  <>
                    <div className="g-scrim" onClick={() => setSheetOpen(false)} />
                    <div className="g-sheet g-slide-up" role="alertdialog" aria-label="Suspicious pattern detected">
                      <div className="g-sheet-grip" />
                      <div className="g-sheet-kicker"><span className="g-trip-dot" />Pattern detected · {fmt(callTime)}</div>
                      <h2>Suspicious pattern detected</h2>
                      <p>We’ve saved everything so far. Check when you’re ready — or keep listening.</p>
                      <p className="g-sheet-micro">This is not a verdict. It’s the start of a check.</p>
                      <button className="g-primary" onClick={endCall}>View case</button>
                      <button className="g-ghost" onClick={() => setSheetOpen(false)}>Not now</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============ CASE ============ */}
            {phase === 'case' && (
              <div className="g-pane g-fade g-case">
                <div className="g-case-head">
                  <div>
                    <div className="g-case-id">{CASE_ID}</div>
                    <div className="g-case-time">{todayStamp()} · {fmt(finalDuration)} call</div>
                  </div>
                  <span className="g-chip review">Under review</span>
                </div>

                {/* audio */}
                <div className="g-card">
                  <div className="g-card-title">Call audio</div>
                  <div className="g-player">
                    <button className="g-play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
                      {playing ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <div className="g-wave" aria-hidden="true">
                      {WAVEFORM.map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }} className={i / WAVEFORM.length <= playPos / Math.max(finalDuration, 1) ? 'on' : ''} />
                      ))}
                    </div>
                    <span className="g-play-t">{fmt(playPos)} / {fmt(finalDuration)}</span>
                  </div>
                  <p className="g-fine">Simulated playback · never autoplayed</p>
                </div>

                {/* transcript */}
                <div className="g-card">
                  <button className="g-card-row" onClick={() => setTranscriptOpen(!transcriptOpen)}>
                    <div className="g-card-title">Transcript</div>
                    <span className="g-chev">{transcriptOpen ? '▾' : '▸'}</span>
                  </button>
                  {transcriptOpen && (
                    <div className="g-full-transcript">
                      {caseLines.map((l, i) => (
                        <div key={i} className={`g-line ${l.speaker}`}>
                          <span className="g-who">{l.speaker === 'caller' ? 'Caller' : 'You'} · {fmt(l.t)}</span>
                          <p>{l.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* number */}
                <div className="g-card">
                  <div className="g-card-title">Phone number</div>
                  <button className="g-num" onClick={() => setNumberRevealed(!numberRevealed)}>
                    {numberRevealed ? CALLER_NUMBER_FULL : CALLER_NUMBER_MASKED}
                    <span className="g-fine">{numberRevealed ? ' · tap to mask' : ' · tap to reveal'}</span>
                  </button>
                </div>

                {/* claimed identity */}
                <div className="g-card g-claim">
                  <div className="g-card-row">
                    <div className="g-card-title">Claimed identity</div>
                    <span className="g-chip unverified">Unverified claim</span>
                  </div>
                  {claim ? (
                    <>
                      <p className="g-claim-text">
                        Caller claimed to be <b>{claim.title ? claim.title + ' ' : ''}{claim.name}</b>
                        {claim.org ? <>, {claim.org}</> : null}
                      </p>
                      <p className="g-fine">“{claim.quote}” · {fmt(claim.t)}</p>
                    </>
                  ) : (
                    <p className="g-fine">No identity claim extracted from this call.</p>
                  )}
                </div>

                {/* signals */}
                <div className="g-card">
                  <div className="g-card-title">Signals that fired · {fired.length} of 5</div>
                  {fired.map((f) => (
                    <div key={f.id} className="g-ev-signal">
                      <div className="g-ev-head"><span className="g-signal-box hit sm">✓</span><b>{f.label}</b><span className="g-signal-t">{fmt(f.t)}</span></div>
                      <div className="g-signal-quote">“{f.quote}”</div>
                    </div>
                  ))}
                  <p className="g-fine">Signals start the investigation — the verdict comes from the full analysis.</p>
                </div>

                {/* transparency */}
                <div className="g-card g-transp">
                  <div className="g-card-title">What was captured</div>
                  <p>Audio, transcript, number, time. Nothing else — and nothing between calls.</p>
                  {!confirmDelete ? (
                    <button className="g-danger-ghost" onClick={() => setConfirmDelete(true)}>Delete case</button>
                  ) : (
                    <div className="g-confirm">
                      <p>Delete this case and discard everything captured?</p>
                      <div className="g-confirm-row">
                        <button className="g-danger" onClick={deleteCase}>Yes, delete</button>
                        <button className="g-ghost" onClick={() => setConfirmDelete(false)}>Keep</button>
                      </div>
                    </div>
                  )}
                </div>

                <button className="g-primary" disabled title="Page 2 · coming next">
                  Continue to analysis →
                </button>
                <p className="g-fine">Next page: the Evidence Graph</p>
                <div className="g-case-foot">No verdict yet — analysis continues.</div>
              </div>
            )}

            {/* ============ DISCARDED ============ */}
            {phase === 'discarded' && (
              <div className="g-pane g-fade g-center">
                <div className="g-hero-mark dim" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M24 4l16 6v12c0 10-6.8 17.4-16 22C14.8 39.4 8 32 8 22V10l16-6z" />
                    <path d="M18 24l5 5 8-9" />
                  </svg>
                </div>
                <h2>No suspicious pattern</h2>
                <p className="g-sub">The tripwire did not fire.<br />Call audio and transcript were discarded —<br />nothing was stored, nothing uploaded.</p>
                <button className="g-primary" onClick={() => { setPhase('idle'); setFired([]); }}>Back to protection</button>
              </div>
            )}

          </div>
        </div>
      </div>

      {toast && <div className="g-toast g-fade">{toast}</div>}

      <p className="g-page-fine">Idea 1 · The Case Builds Itself — prototype. Simulated telecom; real signal engine, case builder and UI states.</p>
    </div>
  );
}
