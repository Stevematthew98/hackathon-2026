import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CALL_SCRIPT,
  CALLER_NUMBER_FULL,
  CALLER_NUMBER_MASKED,
  SCRIPT_END,
} from './callScript';
import { createEngine, TRIPWIRE_THRESHOLD, PATTERN_COUNT } from './signalEngine';
import PageHead from '../PageHead';
import './Guardian.css';

const API = import.meta.env.VITE_API_URL || '';

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

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem('tg-stats-v1')) || { calls: 0, cases: 0, signals: 0 };
  } catch {
    return { calls: 0, cases: 0, signals: 0 };
  }
}

export default function Guardian({ page, onNav }) {
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
  const [caseId, setCaseId] = useState(null);
  const [serverSave, setServerSave] = useState(null); // null | saving | saved | local
  const [saveMeta, setSaveMeta] = useState(null);
  const [casePayload, setCasePayload] = useState(null);
  // pro upgrades
  const [trace, setTrace] = useState([]);
  const [traceOpen, setTraceOpen] = useState(false);
  const [stats, setStats] = useState(loadStats);
  const [caseTab, setCaseTab] = useState('overview');

  const engineRef = useRef(null);
  const timeRef = useRef(0);
  const processedRef = useRef(0);
  const transcriptEndRef = useRef(null);
  const traceEndRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const pushTrace = (entries) => {
    setTrace((p) => [...p, ...entries].slice(-80));
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
      const callerLines = due.filter((l) => l.speaker === 'caller');
      if (callerLines.length || newly.length) {
        const entries = callerLines
          .filter((l) => !newly.some((n) => n.quote === l.text))
          .map((l) => ({ t: l.t, kind: 'eval', text: `line evaluated · ${PATTERN_COUNT} patterns checked · no match` }));
        const matches = newly.map((n) => ({ t: n.t, kind: 'match', text: `MATCH ${n.label} → "${n.quote}"` }));
        pushTrace([...entries, ...matches]);
      }
      if (newly.length) {
        setFired((p) => [...p, ...newly]);
        setExpandedSignal(newly[newly.length - 1].id); // auto-expand latest hit
      }
    }, 250);
    return () => clearInterval(iv);
  }, [phase]);

  // ---- tripwire: 4+ signals start an investigation. Never a verdict. ----
  // CORRECTION 1: the case is created IMMEDIATELY here — before any tap.
  // Tapping the notification later only OPENS the already-created case.
  useEffect(() => {
    if (fired.length >= TRIPWIRE_THRESHOLD && !tripwire) {
      setTripwire(true);
      const snap = buildCaseSnapshot();
      setClaim(snap.claimedIdentity);
      setFinalDuration(snap.durationSec);
      setCasePayload(snap);
      saveCaseToServer(snap);
      pushTrace([{ t: timeRef.current, kind: 'trip', text: `TRIPWIRE · ${snap.signals.length}/5 signals — case ${snap.id} created, no verdict` }]);
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

  useEffect(() => {
    if (traceOpen) traceEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [trace, traceOpen]);

  const heardLines = useMemo(
    () => CALL_SCRIPT.filter((l) => l.t <= callTime),
    [callTime]
  );

  // ---------------- actions ----------------
  const saveCaseToServer = (payload) => {
    if (!API) { setServerSave('local'); return; }
    setServerSave('saving');
    const t0 = performance.now();
    fetch(`${API}/api/guardian/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error('save failed');
        setSaveMeta({ status: r.status, ms: Math.round(performance.now() - t0) });
        setServerSave('saved');
      })
      .catch(() => setServerSave('local'));
  };

  // Builds the case object from the live event. Called the instant the
  // tripwire fires — the case exists before the user taps anything.
  const buildCaseSnapshot = () => {
    const eng = engineRef.current;
    return {
      id: caseId,
      createdAt: casePayload?.createdAt || new Date().toISOString(),
      durationSec: Math.floor(timeRef.current),
      numberMasked: CALLER_NUMBER_MASKED,
      claimedIdentity: eng ? eng.getClaim() : null,
      signals: fired,
      transcript: CALL_SCRIPT.filter((l) => l.t <= timeRef.current),
    };
  };

  const recordStats = (wasTripwire, signalCount) => {
    setStats((s) => {
      const n = { calls: s.calls + 1, cases: s.cases + (wasTripwire ? 1 : 0), signals: s.signals + signalCount };
      try { localStorage.setItem('tg-stats-v1', JSON.stringify(n)); } catch { /* noop */ }
      return n;
    });
  };

  // Tapping the notification only OPENS the already-created case.
  const openCase = () => {
    const snap = buildCaseSnapshot();
    setClaim(snap.claimedIdentity);
    setFinalDuration(snap.durationSec);
    setCasePayload(snap);
    saveCaseToServer(snap);
    recordStats(true, snap.signals.length);
    pushTrace([{ t: timeRef.current, kind: 'trip', text: `case ${snap.id} opened by user · snapshot finalized` }]);
    setSheetOpen(false);
    setPlaying(false);
    setPhase('case');
  };

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
    setExpandedSignal(initial.length ? initial[0].id : null);
    setCaseId('TG-2026-' + Math.floor(1000 + Math.random() * 9000));
    setServerSave(null);
    setSaveMeta(null);
    setCasePayload(null);
    setCaseTab('overview');
    setTrace([
      { t: 0, kind: 'meta', text: 'event: incoming call answered' },
      { t: 0, kind: 'meta', text: 'metadata: caller unknown · not in contacts · unverifiable' },
      { t: 0, kind: 'match', text: 'MATCH Unknown number → signal 1/5' },
      { t: 0, kind: 'meta', text: `monitoring: 5 signal rules armed · ${PATTERN_COUNT} patterns · event-only capture` },
    ]);
    setPhase('live');
  };

  const endCall = () => {
    if (tripwire) {
      // The case already exists (created at tripwire); refresh it with the
      // complete event and re-sync. endCall() never creates the case.
      const snap = buildCaseSnapshot();
      setClaim(snap.claimedIdentity);
      setFinalDuration(snap.durationSec);
      setCasePayload(snap);
      saveCaseToServer(snap);
      recordStats(true, snap.signals.length);
      pushTrace([{ t: timeRef.current, kind: 'trip', text: `event ended · case ${snap.id} finalized with full transcript` }]);
      setPhase('case');
    } else {
      setClaim(engineRef.current ? engineRef.current.getClaim() : null);
      setFinalDuration(Math.floor(timeRef.current));
      setPlaying(false);
      recordStats(false, fired.length);
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

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: `Signals · ${casePayload?.signals.length ?? 0}` },
    { id: 'transcript', label: 'Transcript' },
    { id: 'data', label: 'Data' },
  ];

  // The case rendered below is the object created at tripwire time,
  // refreshed when the event ended. Tapping "Tap to check" only opens it.
  const cp = casePayload;

  // ---------------- screens ----------------
  return (
    <div className="g-root">
      <PageHead page={page} onNav={onNav} label="Page 1 of 5 · The Case Builds Itself" />

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

                <div className="g-stats">
                  <div className="g-stat"><b>{stats.calls}</b><span>calls checked</span></div>
                  <div className="g-stat"><b>{stats.cases}</b><span>cases built</span></div>
                  <div className="g-stat"><b>{stats.signals}</b><span>signals caught</span></div>
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
                  <div className="g-how-step"><b>2</b><span>A rule engine counts suspicious signals. One alone means nothing.</span></div>
                  <div className="g-how-step"><b>3</b><span>4+ signals trip the wire — the case builds itself. You tap once.</span></div>
                </div>

                <button className="g-primary" disabled={!permission} onClick={() => setPhase('incoming')}>
                  Simulate incoming scam call
                </button>
                {!permission && <p className="g-warn">Grant permission to enable protection.</p>}
                <p className="g-fine">
                  Prototype — telecom capture is simulated; this page does not
                  intercept real calls. Event-only processing: analysis runs only
                  while the event is active. No tripwire → captured audio and
                  transcript are discarded — nothing stored, nothing sent. A
                  created case holds exactly what is shown to you, and is sent to
                  the TrustGuard demo server.
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
                  <div className="g-wave-live" aria-hidden="true">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span key={i} style={{ animationDelay: `${((i * 0.13) % 1.1).toFixed(2)}s` }} />
                    ))}
                  </div>
                  <div className="g-checking"><span className="g-pulse blue" />Checking this call…</div>
                </div>

                {tripwire && !sheetOpen && (
                  <button className="g-trip-banner" onClick={() => setSheetOpen(true)}>
                    <span className="g-trip-dot" />Suspicious pattern detected — tap to check
                  </button>
                )}

                <div className="g-signals">
                  <div className="g-signals-title">Signals · {fired.length}/5</div>
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

                <div className="g-trace">
                  <button className="g-trace-head" onClick={() => setTraceOpen(!traceOpen)}>
                    <span className="g-card-title">Engine trace</span>
                    <span className="g-trace-meta">{PATTERN_COUNT} patterns · rule-based</span>
                    <span className="g-chev">{traceOpen ? '▾' : '▸'}</span>
                  </button>
                  {traceOpen && (
                    <div className="g-trace-body">
                      {trace.map((e, i) => (
                        <div key={i} className={`g-tline ${e.kind}`}>
                          <span className="g-tt">[ {e.t.toFixed(2)}s ]</span> {e.text}
                        </div>
                      ))}
                      <div ref={traceEndRef} />
                    </div>
                  )}
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
                      <p>TrustGuard started a case from this call.</p>
                      <div className="g-sheet-signals">
                        {fired.map((f) => (
                          <span key={f.id} className="g-sheet-chip">✓ {f.label}</span>
                        ))}
                      </div>
                      <p className="g-sheet-micro">This is not a verdict. It’s the start of a check.</p>
                      <button className="g-primary" onClick={openCase}>Tap to check</button>
                      <button className="g-ghost" onClick={() => setSheetOpen(false)}>Not now</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============ CASE ============ */}
            {phase === 'case' && cp && (
              <div className="g-pane g-fade g-case">
                <div className="g-case-head">
                  <div>
                    <div className="g-case-id">{cp.id}</div>
                    <div className="g-case-time">{new Date(cp.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {fmt(cp.durationSec)} call</div>
                    <div className="g-sync">
                      {serverSave === 'saving' && 'Saving to TrustGuard server…'}
                      {serverSave === 'saved' && `Saved to TrustGuard server${saveMeta ? ` · ${saveMeta.ms}ms` : ''}`}
                      {serverSave === 'local' && 'Saved on this device'}
                    </div>
                  </div>
                  <span className="g-chip review">Under review</span>
                </div>

                <div className="g-tabs">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      className={`g-tab${caseTab === t.id ? ' on' : ''}`}
                      onClick={() => setCaseTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {caseTab === 'overview' && (
                  <>
                    <div className="g-card g-claim">
                      <div className="g-card-row">
                        <div className="g-card-title">Claimed identity</div>
                        <span className="g-chip unverified">Unverified claim</span>
                      </div>
                      {cp.claimedIdentity ? (
                        <>
                          <p className="g-claim-text">
                            Caller claimed to be <b>{cp.claimedIdentity.title ? cp.claimedIdentity.title + ' ' : ''}{cp.claimedIdentity.name}</b>
                            {cp.claimedIdentity.org ? <>, {cp.claimedIdentity.org}</> : null}
                          </p>
                          <p className="g-fine">“{cp.claimedIdentity.quote}” · {fmt(cp.claimedIdentity.t)}</p>
                        </>
                      ) : (
                        <p className="g-fine">No identity claim extracted from this call.</p>
                      )}
                    </div>

                    <div className="g-card">
                      <div className="g-card-title">Phone number</div>
                      <button className="g-num" onClick={() => setNumberRevealed(!numberRevealed)}>
                        {numberRevealed ? CALLER_NUMBER_FULL : CALLER_NUMBER_MASKED}
                        <span className="g-fine">{numberRevealed ? ' · tap to mask' : ' · tap to reveal'}</span>
                      </button>
                    </div>

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
                            <span key={i} style={{ height: `${h}%` }} className={i / WAVEFORM.length <= playPos / Math.max(cp.durationSec, 1) ? 'on' : ''} />
                          ))}
                        </div>
                        <span className="g-play-t">{fmt(playPos)} / {fmt(cp.durationSec)}</span>
                      </div>
                      <p className="g-fine">Simulated playback · never autoplayed</p>
                    </div>
                  </>
                )}

                {caseTab === 'signals' && (
                  <div className="g-card">
                    <div className="g-card-title">Signals that fired · {cp.signals.length} of 5</div>
                    {cp.signals.map((f) => (
                      <div key={f.id} className="g-ev-signal">
                        <div className="g-ev-head"><span className="g-signal-box hit sm">✓</span><b>{f.label}</b><span className="g-signal-t">{fmt(f.t)}</span></div>
                        <div className="g-signal-hint">{f.hint}</div>
                        <div className="g-signal-quote">“{f.quote}”</div>
                      </div>
                    ))}
                    <p className="g-fine">Signals start the investigation — the verdict comes from the full analysis.</p>
                  </div>
                )}

                {caseTab === 'transcript' && (
                  <div className="g-card">
                    <div className="g-card-title">Transcript</div>
                    <div className="g-full-transcript" style={{ maxHeight: 'none' }}>
                      {cp.transcript.map((l, i) => (
                        <div key={i} className={`g-line ${l.speaker}`}>
                          <span className="g-who">{l.speaker === 'caller' ? 'Caller' : 'You'} · {fmt(l.t)}</span>
                          <p>{l.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {caseTab === 'data' && (
                  <>
                    <div className="g-card">
                      <div className="g-card-title">Case object</div>
                      <pre className="g-json">{JSON.stringify(cp, null, 2)}</pre>
                    </div>
                    <div className="g-card">
                      <div className="g-card-title">Backend sync</div>
                      <div className="g-kv"><span>Endpoint</span><code>POST /api/guardian/cases</code></div>
                      <div className="g-kv"><span>Status</span><code>{saveMeta ? `${saveMeta.status} Created` : serverSave === 'local' ? 'offline — local only' : '…'}</code></div>
                      <div className="g-kv"><span>Latency</span><code>{saveMeta ? `${saveMeta.ms} ms` : '—'}</code></div>
                      <div className="g-kv"><span>Host</span><code>hackathon-2026-backend · Railway</code></div>
                    </div>
                  </>
                )}

                <div className="g-card g-transp">
                  <div className="g-card-title">What was captured</div>
                  <p>Audio, transcript, number, time. Nothing else — and nothing between calls. Prototype: the case is sent to the TrustGuard demo server.</p>
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
