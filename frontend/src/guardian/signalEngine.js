// Signal-detection engine for Idea 1.
//
// The engine evaluates transcript lines against deterministic pattern rules as the
// call unfolds. It is deliberately rule-based (not a black-box model) so every
// fired signal can show the exact phrase and timestamp that triggered it.
//
// Contract:
//   - One signal alone means nothing. The engine only COUNTS; it never judges.
//   - 4+ signals = tripwire (start an investigation). Never a verdict.

const SIGNAL_DEFS = [
  {
    id: 'unknown_number',
    label: 'Unknown number',
    hint: 'Caller is not in contacts and cannot be verified',
    // Fires from call metadata at t=0, not from speech.
    fromMetadata: true,
  },
  {
    id: 'authority',
    label: 'Authority claim',
    hint: 'Caller claims an official title or organisation',
    patterns: [
      /i am (inspector|officer|sub-inspector)/i,
      /\bcyber crime\b/i,
      /\bcrime branch\b/i,
      /\b(cbi|ed|narcotics|police)\b/i,
    ],
  },
  {
    id: 'threat',
    label: 'Threatening language',
    hint: 'Arrest, prosecution or punishment is invoked',
    patterns: [
      /\barrest/i,
      /\bwarrant\b/i,
      /\bjail\b/i,
      /money laundering/i,
      /case .* filed/i,
      /non-cooperation/i,
    ],
  },
  {
    id: 'urgency',
    label: 'Manufactured urgency',
    hint: 'An artificial deadline forces a rushed decision',
    patterns: [
      /do not disconnect/i,
      /don'?t hang up/i,
      /stay on the line/i,
      /right now/i,
      /immediately/i,
      /one hour/i,
      /today itself/i,
    ],
  },
  {
    id: 'demand',
    label: 'Demand for money / OTP / action',
    hint: 'Payment, OTP or an irreversible action is requested',
    patterns: [
      /\btransfer\b/i,
      /\bupi\b/i,
      /security deposit/i,
      /\botp\b/i,
      /bank account/i,
      /penalt/i,
    ],
  },
];

// Rule-based claimed-identity extractor: turns the caller's own words into a
// structured CLAIM. Never treated as verified — testing it is Idea 3's job.
const CLAIM_RE = /i am (?:(inspector|officer|sub-inspector)\s+)?([a-z]+ [a-z]+)[,.]?\s+from the ([a-z]+(?: [a-z]+)*)/i;

export function createEngine({ callerUnknown }) {
  const fired = new Map(); // signalId -> { t, quote }
  let claim = null;

  function fire(def, t, quote) {
    if (fired.has(def.id)) return null;
    const evt = { id: def.id, label: def.label, hint: def.hint, t, quote };
    fired.set(def.id, evt);
    return evt;
  }

  return {
    defs: SIGNAL_DEFS,

    // Called once when the call is answered.
    start(t = 0) {
      const out = [];
      if (callerUnknown) {
        const def = SIGNAL_DEFS[0];
        const evt = fire(def, t, 'Incoming number is unknown and unverifiable');
        if (evt) out.push(evt);
      }
      return out;
    },

    // Evaluate newly-heard transcript lines. Returns newly fired signals.
    processLines(lines) {
      const out = [];
      for (const line of lines) {
        if (line.speaker !== 'caller') continue;
        // Claimed-identity extraction (rule-based, labeled as claim).
        if (!claim) {
          const m = line.text.match(CLAIM_RE);
          if (m) {
            claim = {
              name: titleCase(m[2]),
              title: m[1] ? titleCase(m[1]) : null,
              org: titleCase(m[3]),
              quote: line.text,
              t: line.t,
            };
          }
        }
        for (const def of SIGNAL_DEFS) {
          if (def.fromMetadata || fired.has(def.id)) continue;
          if (def.patterns.some((re) => re.test(line.text))) {
            const evt = fire(def, line.t, line.text);
            if (evt) out.push(evt);
          }
        }
      }
      return out;
    },

    getClaim() {
      return claim;
    },

    count() {
      return fired.size;
    },
  };
}

function titleCase(s) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export const TRIPWIRE_THRESHOLD = 4;

export const PATTERN_COUNT = SIGNAL_DEFS.filter((d) => d.patterns)
  .reduce((n, d) => n + d.patterns.length, 0);
