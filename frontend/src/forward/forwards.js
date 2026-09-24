// Forward-to-Check engine (Idea 2).
//
// One deterministic engine covers all eight scam families. A forwarded bundle
// becomes ONE case immediately — it is never analyzed piece-by-piece.
// Bands are rule-based (signal counts), never scores, never a "scam verdict":
// they are an assessment, not proof.

export const FAMILIES = [
  { id: 'digital_arrest', label: 'Digital arrest', keywords: ['arrest', 'cbi', 'narcotics', 'digital arrest', 'supreme court', 'trai'] },
  { id: 'govt_order', label: 'Fake government order', keywords: ['govt', 'ministry', 'income tax', 'refund', 'cbdt', 'customs'] },
  { id: 'kyc_deepfake', label: 'KYC / deepfake video', keywords: ['kyc', 're-verification', 'reverification', 'video kyc', 'account blocked'] },
  { id: 'otp', label: 'OTP interception', keywords: ['otp', 'one time password', 'verification code'] },
  { id: 'investment', label: 'Investment / guaranteed returns', keywords: ['double your money', 'guaranteed returns', 'trading', 'crypto', 'profit'] },
  { id: 'job', label: 'Job offer', keywords: ['job offer', 'work from home', 'registration fee', 'hr department'] },
  { id: 'prize', label: 'Prize / lottery', keywords: ['lottery', 'you won', 'prize', 'lucky draw', 'congratulations'] },
  { id: 'loan', label: 'Loan / credit', keywords: ['instant loan', 'pre-approved', 'credit limit', 'processing fee'] },
];

export const SIGNAL_DEFS_FWD = [
  { id: 'authority', label: 'Authority claim' },
  { id: 'threat', label: 'Threatening language' },
  { id: 'urgency', label: 'Manufactured urgency' },
  { id: 'demand', label: 'Demand for money / OTP / action' },
  { id: 'spoof', label: 'Spoofed / unverifiable sender' },
];

export const FORWARDS = [
  {
    id: 'govt-order',
    kind: 'message',
    kindLabel: 'Forwarded WhatsApp message',
    title: '“Income Tax refund” order',
    preview: 'GOVT OF INDIA · refund ₹18,450 · verify within 24 hours',
    sender: { label: 'Unknown — forwarded many times', known: false },
    content: {
      type: 'text',
      lines: [
        'GOVT OF INDIA',
        'Ministry of Finance — Income Tax Department',
        '',
        'Dear Taxpayer,',
        'Your income tax refund of ₹18,450 has been approved.',
        'Verify your bank details within 24 hours to receive it:',
        'bit.ly/it-refund-verify',
        '',
        '— Central Board of Direct Taxes',
      ],
    },
    claim: { text: 'Income Tax Department, Government of India' },
    signals: [
      { id: 'authority', label: 'Authority claim', quote: 'GOVT OF INDIA, Ministry of Finance — Income Tax Department' },
      { id: 'urgency', label: 'Manufactured urgency', quote: 'Verify your bank details within 24 hours' },
      { id: 'demand', label: 'Demand for action', quote: 'bit.ly/it-refund-verify' },
    ],
    reasons: [
      'Claims to be the Income Tax Department',
      'Manufactures a 24-hour deadline to rush you',
      'Pushes a shortened link instead of the official portal',
    ],
    verifyStep: 'Check refunds only on incometax.gov.in — type the address yourself, never tap a forwarded link.',
  },
  {
    id: 'kyc-video',
    kind: 'video',
    kindLabel: 'Forwarded video message',
    title: '“Bank KYC” video',
    preview: '“This is Rajesh from your bank’s KYC cell…”',
    sender: { label: 'Unknown — original not available', known: false },
    content: {
      type: 'video',
      transcript: [
        'Dear customer, this is Rajesh from your bank\u2019s KYC cell.',
        'Your KYC needs re-verification. Please complete it using the link below.',
      ],
    },
    claim: { text: 'Rajesh — bank KYC cell' },
    signals: [
      { id: 'authority', label: 'Authority claim', quote: 'this is Rajesh from your bank\u2019s KYC cell' },
      { id: 'demand', label: 'Demand for action', quote: 'complete it using the link below' },
    ],
    reasons: [
      'Claims to be your bank\u2019s KYC team',
      'Asks you to act through a link inside the message',
    ],
    honestyNote: 'A forwarded video alone can\u2019t prove whether the person is real or synthetic — that needs an independent check.',
    verifyStep: 'Call your bank on the number from its official website — never the number or link in the message.',
  },
  {
    id: 'bank-alert',
    kind: 'sms',
    kindLabel: 'Bank SMS',
    title: 'Routine bank alert',
    preview: 'A/c credited ₹5,000 — no action needed',
    sender: { label: 'Bank SMS sender ID', known: true },
    content: {
      type: 'text',
      lines: [
        'HDFC Bank: Your a/c XX1234 credited \u20B95,000 on 24-Sep.',
        'Avl bal: \u20B982,310. Never share OTPs with anyone.',
      ],
    },
    claim: null,
    signals: [],
    reasons: [
      'No threat, no deadline, no link',
      'Asks for nothing — it only informs',
    ],
    verifyStep: 'Nothing to do. If unsure, check your balance in the bank\u2019s own app.',
  },
];

// Classify the bundle into one of the eight families by keyword scoring.
// Deterministic and inspectable — the trace shows every family's score.
export function classifyFamily(fw) {
  const text = [
    ...(fw.content.type === 'text' ? fw.content.lines : fw.content.transcript),
    fw.claim?.text || '',
    fw.title,
  ].join(' ').toLowerCase();
  const scores = FAMILIES.map((f) => ({
    id: f.id,
    label: f.label,
    score: f.keywords.filter((k) => text.includes(k)).length,
  }));
  const best = scores.reduce((a, b) => (b.score > a.score ? b : a), scores[0]);
  // Require at least two keyword hits: a single incidental word (e.g. "OTP"
  // inside a safety warning) is not enough to name a pattern.
  return { scores, family: best.score >= 2 ? best : null };
}

// Band rule: 3+ signals → HIGH RISK · 1–2 → NEEDS REVIEW · 0 → LOW CONCERN.
// Counts only — never a verdict, never a score.
export function decideBand(signalCount) {
  if (signalCount >= 3) return 'HIGH RISK';
  if (signalCount >= 1) return 'NEEDS REVIEW';
  return 'LOW CONCERN';
}

export function analyzeForward(fw) {
  const { scores, family } = classifyFamily(fw);
  const band = decideBand(fw.signals.length);
  return { family, scores, band, signalCount: fw.signals.length };
}
