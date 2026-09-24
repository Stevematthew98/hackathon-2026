// Idea 2 · Forward-to-Check — scenario data + case engine.
//
// "A case, not a file." One forwarded bundle becomes ONE case.
// Bands are rule-based (relationship patterns), never scores, never "AI says fake".

export const PIPELINE_STAGES = [
  { id: 'received', label: 'Evidence received', desc: 'The complete forwarded bundle is held together as one case.' },
  { id: 'claims', label: 'Claims extracted', desc: 'Testable statements are pulled out of the message, PDF and link.' },
  { id: 'identities', label: 'Identities separated', desc: 'Who forwarded, who sent, who is claimed, what is verified — kept apart.' },
  { id: 'relationships', label: 'Evidence relationships checked', desc: 'Claims are compared against each other and against evidence.' },
  { id: 'risk', label: 'Risk interpretation', desc: 'Relationships are read as risk — never as proof.' },
  { id: 'verifyreq', label: 'Verification requirement assessed', desc: 'What one independent check would settle the main uncertainty.' },
];

export const REL_STYLE = {
  CONFLICT: { color: '#f87171', label: 'CONFLICT' },
  ANOMALY: { color: '#fbbf24', label: 'ANOMALY' },
  UNKNOWN: { color: '#9aa5b3', label: 'UNKNOWN' },
  SUPPORT: { color: '#34d399', label: 'SUPPORT' },
};

export const SCENARIOS = {
  aadhaar: {
    id: 'aadhaar',
    demoLabel: 'Aadhaar order',
    caseId: 'CASE #2841',
    // ---- the simulated WhatsApp-style family group ----
    chat: {
      groupName: 'Family Group',
      groupSub: '12 members · simulated chat',
      prior: [
        { from: 'Asha', text: 'Did anyone see the electricity bill?' },
        { from: 'Ravi', text: 'I paid it yesterday, all good.' },
      ],
      sender: { name: 'Unknown number', detail: '+91 ••••• 32109 · not in your contacts', forwarded: true },
      text: 'GOVERNMENT ORDER:\nLink Aadhaar to all bank accounts by Friday or accounts will be frozen.',
      pdf: {
        name: 'Aadhaar-Linking-Order.pdf',
        size: '214 KB',
        previewTitle: 'GOVT OF INDIA',
        previewSub: 'Ministry of Finance · Order F.No. 12/4/2026',
        bodyLines: ['All account holders must link Aadhaar…', 'Non-compliance will result in freezing…'],
        signatory: 'R. Sharma, Under Secretary',
      },
      link: { url: 'bit.ly/aadhaar-bank-link', note: 'Shortened link — real destination hidden' },
    },
    bundle: ['Message text', 'PDF document', 'Link', 'Sender context'],
    identities: [
      { role: 'Forwarded by', value: 'You', status: 'KNOWN' },
      { role: 'Original sender', value: 'Unknown — not in your contacts', status: 'UNKNOWN' },
      { role: 'Claimed identity', value: 'Government official', status: 'CLAIM' },
      { role: 'Verified identity', value: 'Not established', status: 'NOT ESTABLISHED' },
    ],
    claims: [
      { id: 'C1', text: 'This is an official government order.', source: 'Message text + PDF header', origin: 'Taken from the forwarded bundle', state: 'Contested', stateKind: 'conflict' },
      { id: 'C2', text: 'Bank accounts will be frozen.', source: 'Message text, line 2', origin: 'Taken from the forwarded bundle', state: 'Unverified', stateKind: 'unknown' },
      { id: 'C3', text: 'Aadhaar linking is mandatory.', source: 'PDF body, paragraph 1', origin: 'Taken from the forwarded bundle', state: 'Unverified', stateKind: 'unknown' },
      { id: 'C4', text: 'Deadline: Friday.', source: 'Message text, line 2', origin: 'Taken from the forwarded bundle', state: 'No official evidence found', stateKind: 'anomaly' },
      { id: 'C5', text: 'Document is signed by the stated authority.', source: 'PDF signature block', origin: 'Taken from the forwarded bundle', state: 'Cannot verify from a forward', stateKind: 'unknown' },
    ],
    relationships: [
      {
        id: 'R1', type: 'CONFLICT',
        title: 'Organization stated vs organization in document',
        a: 'Organization stated in the message', b: 'Organization represented in the document',
        check: 'Compared the issuing authority named in the message text against the letterhead and file number format in the PDF.',
        result: 'They do not match. The message claims a central order; the document’s file number and formatting are inconsistent with that ministry’s published orders.',
        confidence: 'High', uncertainty: 'Formatting analysis is indicative, not conclusive.',
        source: 'Forwarded bundle (message + PDF)',
      },
      {
        id: 'R2', type: 'ANOMALY',
        title: 'Urgent deadline with no official backing',
        a: 'Urgent Friday deadline', b: 'No supporting official evidence found',
        check: 'Looked for the same order or deadline on official government sources reachable from the prototype’s reference set.',
        result: 'No matching order or deadline found. Genuine compliance orders are published; this one appears only inside the forward.',
        confidence: 'Medium', uncertainty: 'Reference set is limited in the prototype.',
        source: 'Forwarded bundle + reference check (simulated)',
      },
      {
        id: 'R3', type: 'UNKNOWN',
        title: 'Signatory cannot be verified from a forward',
        a: 'Claimed signatory', b: 'Independent identity verification unavailable',
        check: 'Attempted to confirm the named signatory against an independent directory.',
        result: 'No independent confirmation available. A name in a PDF is a claim until verified elsewhere.',
        confidence: '—', uncertainty: 'This is a gap in evidence, not evidence of anything.',
        source: 'Forwarded bundle only',
      },
      {
        id: 'R4', type: 'ANOMALY',
        title: 'Shortened link hides its destination',
        a: 'Link in the message', b: 'Official government domain',
        check: 'Inspected the link as presented in the forward.',
        result: 'The link is shortened, so its real destination is hidden. Official orders link to official domains.',
        confidence: 'High', uncertainty: 'Destination was not opened in the prototype.',
        source: 'Forwarded bundle (link)',
      },
    ],
    graph: {
      nodes: [
        { id: 'message', label: 'Message', x: 52, y: 56, desc: 'The forwarded text as received.' },
        { id: 'pdf', label: 'PDF', x: 180, y: 36, desc: 'Aadhaar-Linking-Order.pdf · 214 KB (simulated).' },
        { id: 'link', label: 'Link', x: 308, y: 56, desc: 'bit.ly/aadhaar-bank-link — destination hidden.' },
        { id: 'claim', label: 'Claim', x: 180, y: 150, desc: '“Accounts will be frozen” — the central claim.' },
        { id: 'org', label: 'Organization', x: 52, y: 256, desc: 'Authority named in message vs in document.' },
        { id: 'sig', label: 'Signatory', x: 180, y: 276, desc: 'R. Sharma, Under Secretary — claimed only.' },
        { id: 'deadline', label: 'Deadline', x: 308, y: 256, desc: '“By Friday” — no official backing found.' },
      ],
      edges: [
        { id: 'E1', from: 'message', to: 'org', type: 'CONFLICT', rel: 'R1' },
        { id: 'E2', from: 'pdf', to: 'org', type: 'CONFLICT', rel: 'R1' },
        { id: 'E3', from: 'message', to: 'deadline', type: 'ANOMALY', rel: 'R2' },
        { id: 'E4', from: 'pdf', to: 'sig', type: 'UNKNOWN', rel: 'R3' },
        { id: 'E5', from: 'link', to: 'org', type: 'ANOMALY', rel: 'R4' },
        { id: 'E6', from: 'message', to: 'claim', type: 'UNKNOWN', rel: 'R3' },
      ],
    },
    verdict: {
      reasons: [
        'Organization information conflicts with the document.',
        'Claimed signatory could not be independently verified.',
        'Urgent deadline has no supporting official evidence.',
      ],
      verifyStep: 'Verify the notice through an official government source before acting or forwarding it.',
      honestyNote: null,
    },
    verification: {
      intro: 'TrustGuard will never recommend verifying a suspicious message using the contact number or link supplied by that message.',
      recommended: 'Search for this order on the ministry’s official website (type the address yourself) or call the ministry’s publicly listed helpline.',
      actionLabel: 'Mark verification complete',
      simulatedResult: 'No such order found on any official source. The deadline does not exist in official records.',
      outcomeNote: 'Relationship R3 (signatory) is now confirmed unverifiable — the case remains HIGH RISK, now with verification on record.',
    },
  },

  job: {
    id: 'job',
    demoLabel: 'Needs verification',
    caseId: 'CASE #2842',
    chat: {
      groupName: 'Family Group',
      groupSub: '12 members · simulated chat',
      prior: [{ from: 'Asha', text: 'Did anyone see the electricity bill?' }],
      sender: { name: 'Unknown number', detail: '+91 ••••• 77881 · not in your contacts', forwarded: true },
      text: 'Part-time data entry job — earn ₹3,000/day from home. WhatsApp HR on +91 ••••• 77881. Limited seats, apply today!',
      pdf: null,
      link: null,
    },
    bundle: ['Message text', 'Contact number', 'Sender context'],
    identities: [
      { role: 'Forwarded by', value: 'You', status: 'KNOWN' },
      { role: 'Original sender', value: 'Unknown — not in your contacts', status: 'UNKNOWN' },
      { role: 'Claimed identity', value: 'Company HR', status: 'CLAIM' },
      { role: 'Verified identity', value: 'Not established', status: 'NOT ESTABLISHED' },
    ],
    claims: [
      { id: 'C1', text: 'Earn ₹3,000/day from home.', source: 'Message text', origin: 'Taken from the forwarded bundle', state: 'Unverified', stateKind: 'unknown' },
      { id: 'C2', text: 'This is a genuine company hiring.', source: 'Implied by the message', origin: 'Inferred — no company is actually named', state: 'Cannot assess', stateKind: 'unknown' },
      { id: 'C3', text: 'Seats are limited — apply today.', source: 'Message text', origin: 'Taken from the forwarded bundle', state: 'Pressure language', stateKind: 'anomaly' },
    ],
    relationships: [
      {
        id: 'R1', type: 'UNKNOWN',
        title: 'Employer identity cannot be checked',
        a: 'Claimed employer', b: 'No company name given',
        check: 'Looked for a named company, website, or registration detail in the bundle.',
        result: 'Nothing to check against. The message names no company at all.',
        confidence: '—', uncertainty: 'This is a gap in evidence, not evidence of anything.',
        source: 'Forwarded bundle only',
      },
      {
        id: 'R2', type: 'ANOMALY',
        title: 'Urgency without substance',
        a: '“Limited seats, apply today”', b: 'No role, company, or terms described',
        check: 'Compared the pressure language against the concrete detail provided.',
        result: 'High pressure, near-zero detail — a pattern worth pausing on, not a conclusion.',
        confidence: 'Medium', uncertainty: 'Legitimate recruiters can also write urgently.',
        source: 'Forwarded bundle (message)',
      },
    ],
    graph: {
      nodes: [
        { id: 'message', label: 'Message', x: 70, y: 80, desc: 'The forwarded job text.' },
        { id: 'claim', label: 'Claim', x: 190, y: 60, desc: '“Earn ₹3,000/day from home.”' },
        { id: 'org', label: 'Organization', x: 310, y: 80, desc: 'No company named.' },
        { id: 'deadline', label: 'Deadline', x: 190, y: 200, desc: '“Apply today” — pressure language.' },
      ],
      edges: [
        { id: 'E1', from: 'claim', to: 'org', type: 'UNKNOWN', rel: 'R1' },
        { id: 'E2', from: 'message', to: 'deadline', type: 'ANOMALY', rel: 'R2' },
        { id: 'E3', from: 'message', to: 'claim', type: 'UNKNOWN', rel: 'R1' },
      ],
    },
    verdict: {
      reasons: [
        'The available evidence is not enough to settle this case.',
        'No company is named, so the employer claim cannot be checked.',
        'One check would settle the main uncertainty.',
      ],
      verifyStep: 'Ask the sender for the company name, then check it on the company’s official website — never through links they send.',
      honestyNote: null,
      singleCheck: 'Confirm the employer: get the company name and check its official careers page.',
    },
    verification: {
      intro: 'TrustGuard will never recommend verifying a suspicious message using the contact number or link supplied by that message.',
      recommended: 'Get the company name from the sender, then look up the company’s official careers page yourself.',
      actionLabel: 'Mark verification complete',
      simulatedResult: 'The role is listed on the company’s official careers page with matching pay details.',
      outcomeNote: 'Relationship R1 (employer) resolved to SUPPORT — the case now reads LOW CONCERN.',
      resolvesTo: 'LOW CONCERN',
    },
  },

  event: {
    id: 'event',
    demoLabel: 'Harmless message',
    caseId: 'CASE #2843',
    chat: {
      groupName: 'Class Group',
      groupSub: '32 members · simulated chat',
      prior: [{ from: 'Prof. Rao', text: 'Assignment 4 deadline extended to Monday.' }],
      sender: { name: 'Prof. Rao (admin)', detail: 'Known contact · group admin', forwarded: false },
      text: 'Reminder: tomorrow’s college event starts at 10 AM in the main auditorium. See you all there!',
      pdf: null,
      link: null,
    },
    bundle: ['Message text', 'Sender context'],
    identities: [
      { role: 'Forwarded by', value: 'You', status: 'KNOWN' },
      { role: 'Original sender', value: 'Prof. Rao — known contact', status: 'KNOWN' },
      { role: 'Claimed identity', value: 'None stated', status: '—' },
      { role: 'Verified identity', value: 'Not established', status: 'NOT ESTABLISHED' },
    ],
    claims: [
      { id: 'C1', text: 'College event starts at 10 AM tomorrow.', source: 'Message text', origin: 'Taken from the forwarded bundle', state: 'Consistent', stateKind: 'support' },
    ],
    relationships: [
      {
        id: 'R1', type: 'SUPPORT',
        title: 'Routine announcement, no pressure',
        a: 'Message content', b: 'No threat, deadline, link, or demand',
        check: 'Checked the message for authority claims, threats, urgency, demands, and spoofed senders.',
        result: 'None present. The message only informs; it asks for nothing.',
        confidence: 'High', uncertainty: 'A calm message can still be wrong about facts — that is not this check’s job.',
        source: 'Forwarded bundle (message)',
      },
      {
        id: 'R2', type: 'SUPPORT',
        title: 'Sender is a known contact',
        a: 'Sender: Prof. Rao (admin)', b: 'Known contact in this group',
        check: 'Compared the sender against the recipient’s known contacts.',
        result: 'Matches a known contact. Nothing about the sender is anomalous.',
        confidence: 'High', uncertainty: 'Contact names can be spoofed outside this prototype’s view.',
        source: 'Sender context',
      },
    ],
    graph: {
      nodes: [
        { id: 'message', label: 'Message', x: 90, y: 90, desc: 'The event reminder text.' },
        { id: 'claim', label: 'Claim', x: 210, y: 70, desc: '“Event starts at 10 AM tomorrow.”' },
        { id: 'org', label: 'Sender', x: 300, y: 110, desc: 'Prof. Rao — known contact.' },
      ],
      edges: [
        { id: 'E1', from: 'message', to: 'claim', type: 'SUPPORT', rel: 'R1' },
        { id: 'E2', from: 'message', to: 'org', type: 'SUPPORT', rel: 'R2' },
      ],
    },
    verdict: {
      reasons: ['No significant conflicts found.', 'No threat, deadline, link, or demand detected.', 'No action needed.'],
      verifyStep: 'Nothing to verify. If plans change, the organizer will announce it here.',
      honestyNote: null,
    },
    verification: null,
  },
};

// Band decision for the prototype: driven by relationship pattern, not a score.
export function bandClass(band) {
  return band === 'HIGH RISK' ? 'high' : band === 'NEEDS REVIEW' ? 'review' : 'low';
}

// Deterministic decision rule (#35): the band is DERIVED from the case's
// relationship types, never baked into a scenario. A CONFLICT anywhere means
// HIGH RISK; otherwise any unresolved UNKNOWN/ANOMALY means NEEDS
// VERIFICATION; all-SUPPORT means LOW CONCERN.
export function decideBand(relationships) {
  const types = (relationships || []).map((r) => r.type);
  if (types.includes('CONFLICT')) return 'HIGH RISK';
  if (types.includes('UNKNOWN') || types.includes('ANOMALY')) return 'NEEDS REVIEW';
  return 'LOW CONCERN';
}
