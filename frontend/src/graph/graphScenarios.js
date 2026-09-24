// Idea 3 · The Evidence Graph — structured demo case data.
//
// "The graph does not detect scams. The graph detects relationships
//  between claims and evidence."
//
// Relationship shape (per spec §29):
//   { id, type, claimA, sourceA, claimB, sourceB, check, method,
//     result, confidence, uncertainty, why, evidence[] }
// No overall scam score anywhere. Claimed identities are never verified.

export const REL_META = {
  CONFLICT: {
    color: '#f87171',
    label: 'CONFLICT',
    meaning: 'Two claims cannot both be true under the case context.',
  },
  ANOMALY: {
    color: '#fbbf24',
    label: 'ANOMALY',
    meaning: 'Something looks wrong or unexpected, but it does NOT prove fraud.',
  },
  UNKNOWN: {
    color: '#9aa5b3',
    label: 'UNKNOWN',
    meaning: 'The system cannot verify the relationship — required evidence is unavailable.',
  },
  SUPPORT: {
    color: '#34d399',
    label: 'SUPPORT',
    meaning: 'Independent evidence supports a claim.',
  },
};

export const NODE_KIND = {
  person: { label: 'Person' },
  claim: { label: 'Claimed' },
  evidence: { label: 'Evidence' },
  source: { label: 'Source' },
  reference: { label: 'Reference' },
  unavailable: { label: 'Unavailable' },
};

// ---------------------------------------------------------------- digital arrest
export const DIGITAL_ARREST = {
  id: 'digital-arrest',
  tabLabel: 'Digital Arrest Case',
  caseId: 'CASE #2841',
  caseType: 'Digital Arrest / Impersonation',
  statusLine: 'Analyzing relationships between claims and evidence',
  evidence: [
    'Call transcript',
    'Caller identity claim',
    'Warrant',
    'Phone number',
    'Document seal',
    'Reference voice availability',
  ],
  rawStatement: '“I am Inspector Ravi Kumar from Cyber Crime Branch.”',
  extractNote: 'AI extracts meaning into structured claims. It does not determine truth.',
  claims: [
    { id: 'C1', label: 'Claimed name', value: 'Ravi Kumar', source: 'Caller statement', location: 'Call transcript · line 1', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C2', label: 'Claimed organization', value: 'Cyber Crime Branch', source: 'Caller statement', location: 'Call transcript · line 1', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C3', label: 'Claimed role', value: 'Inspector', source: 'Caller statement', location: 'Call transcript · line 1', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C4', label: 'Document signatory', value: 'Arjun Sharma', source: 'Warrant document', location: 'Warrant · signature block', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C5', label: 'Caller phone', value: '+91 ••••• 32109', source: 'Call metadata', location: 'Call record', method: 'Deterministic capture', status: 'CLAIM' },
    { id: 'C6', label: 'Document presented as', value: 'Official government warrant', source: 'Warrant document', location: 'Warrant · header', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C7', label: 'Voice identity', value: '“Voice belongs to Inspector Ravi Kumar”', source: 'Call audio', location: 'Call recording', method: 'AI extraction · implicit', status: 'CLAIM — UNVERIFIABLE' },
  ],
  relationships: [
    {
      id: 'R1', type: 'CONFLICT', title: 'Caller identity vs warrant signatory',
      claimA: 'Ravi Kumar', sourceA: 'Caller statement',
      claimB: 'Arjun Sharma', sourceB: 'Warrant signature block',
      check: 'Entity-name comparison', method: 'Deterministic comparison',
      result: 'The name in the caller’s identity claim does not match the name on the warrant signature. Two different names are presented as the issuing authority.',
      confidence: 'High',
      uncertainty: 'A name mismatch is strongly indicative of inconsistency. It is not, by itself, proof of fraud.',
      why: 'Two different names are presented as the same authority in this case: “Ravi Kumar” in the caller’s claim and “Arjun Sharma” as the warrant signatory. Both cannot be the issuing authority at once.',
      evidence: [
        { label: 'Caller transcript', text: 'I am Inspector Ravi Kumar from Cyber Crime Branch.', highlight: 'Ravi Kumar' },
        { label: 'Warrant', text: '…this warrant is issued under my authority. Signed by Arjun Sharma.', highlight: 'Arjun Sharma' },
      ],
      evidenceNote: 'The caller’s claimed identity and the warrant’s stated signatory do not match.',
    },
    {
      id: 'R2', type: 'ANOMALY', title: 'Caller number vs official directory',
      claimA: '+91 ••••• 32109', sourceA: 'Call metadata',
      claimB: 'Police directory record', sourceB: 'Official directory',
      check: 'Directory lookup', method: 'Deterministic lookup',
      result: 'Directory lookup returned no matching record.',
      confidence: 'High',
      uncertainty: 'A missing record does not mean the number is fake — directories can be incomplete or outdated.',
      why: 'The supplied phone number was not found in the available directory. This does not by itself prove fraud.',
      evidence: [
        { label: 'Directory lookup', text: 'Search: +91 ••••• 32109 → 0 records found in the available police directory.', highlight: '0 records found' },
      ],
      evidenceNote: 'No matching record — an anomaly, not a verdict.',
    },
    {
      id: 'R3', type: 'ANOMALY', title: 'Warrant seal vs expected template',
      claimA: 'Seal on the warrant', sourceA: 'Warrant document',
      claimB: 'Expected seal format', sourceB: 'Reference template',
      check: 'Seal and template comparison', method: 'Deterministic comparison',
      result: 'The seal placement and template do not match the expected format for this issuing body.',
      confidence: 'Medium',
      uncertainty: 'A format mismatch is suspicious, not disproof — genuine documents can vary by office and year.',
      why: 'The seal on the presented warrant differs from the expected format: wrong placement, wrong border style. Unexpected — but format alone cannot settle the case.',
      evidence: [
        { label: 'Warrant seal', text: 'Seal observed: circular stamp, top-right corner, thin double border.', highlight: 'top-right corner' },
        { label: 'Expected format', text: 'Expected: rectangular seal, bottom-left, single embossed border.', highlight: 'bottom-left' },
      ],
      evidenceNote: 'Compare the observed seal against the expected format — the difference is visible.',
    },
    {
      id: 'R4', type: 'UNKNOWN', title: 'Caller voice vs reference voice',
      claimA: 'Caller voice', sourceA: 'Call audio',
      claimB: 'Reference voice of the claimed officer', sourceB: 'Not available',
      check: 'Voice comparison', method: 'Not available',
      result: 'No authoritative reference voice is available for comparison.',
      confidence: '—',
      uncertainty: 'This relationship could not be established because the required reference evidence is unavailable. The system is comfortable saying: I don’t know.',
      why: 'No authoritative reference voice is available for comparison — so this relationship stays UNKNOWN rather than being guessed at.',
      evidence: [
        { label: 'Reference voice', text: 'No reference recording found for the claimed officer in available sources.', highlight: 'No reference recording found' },
      ],
      evidenceNote: 'Missing evidence is shown as missing — never filled in with a guess.',
    },
    {
      id: 'R5', type: 'SUPPORT', supportLevel: 'weak', title: 'Warrant layout vs official template',
      claimA: 'Warrant letterhead layout', sourceA: 'Warrant document',
      claimB: 'Official template style', sourceB: 'Reference template',
      check: 'Layout resemblance check', method: 'Visual comparison (AI-assisted)',
      result: 'The document formatting resembles an official template.',
      confidence: 'Low',
      uncertainty: 'WEAK SUPPORT — RESEMBLANCE ONLY. Resemblance does not establish authenticity, and weak support can never outweigh a conflict.',
      why: 'The layout looks similar to an official template — that is resemblance, not confirmation. Nothing authoritative verifies this document.',
      evidence: [
        { label: 'Warrant layout', text: 'Letterhead uses a similar masthead and column layout to the reference template.', highlight: 'similar masthead' },
      ],
      evidenceNote: 'Resemblance is shown honestly: weak, cosmetic, and unable to outweigh the CONFLICT above.',
    },
  ],
  nodes: [
    { id: 'caller', label: 'Caller', kind: 'person', x: 70, y: 70, detail: 'The person on the call. Everything about their identity is a claim until independently verified.', source: 'Call metadata', status: 'UNVERIFIED' },
    { id: 'name', label: 'Ravi Kumar', kind: 'claim', x: 70, y: 180, detail: 'Name claimed by the caller — extracted from the caller’s own words.', source: 'Caller statement', status: 'CLAIM' },
    { id: 'org', label: 'Cyber Crime Branch', kind: 'claim', x: 70, y: 290, detail: 'Organization claimed by the caller.', source: 'Caller statement', status: 'CLAIM' },
    { id: 'warrant', label: 'Warrant', kind: 'evidence', x: 350, y: 70, detail: 'The document presented on the call, claimed to be an official warrant.', source: 'Warrant document', status: 'UNDER REVIEW' },
    { id: 'signatory', label: 'Arjun Sharma', kind: 'claim', x: 350, y: 180, detail: 'Name found in the warrant signature block.', source: 'Warrant signature', status: 'CLAIM' },
    { id: 'seal', label: 'Document Seal', kind: 'evidence', x: 350, y: 290, detail: 'The seal as it appears on the presented warrant.', source: 'Warrant document', status: 'UNDER REVIEW' },
    { id: 'phone', label: 'Phone Number', kind: 'evidence', x: 210, y: 70, detail: 'The caller’s number, captured from call metadata.', source: 'Call metadata', status: 'CHECKED' },
    { id: 'directory', label: 'Police Directory', kind: 'source', x: 210, y: 180, detail: 'The available official directory used for lookup.', source: 'Official directory', status: 'AUTHORITATIVE' },
    { id: 'voice', label: 'Reference Voice', kind: 'unavailable', x: 210, y: 290, detail: 'No authoritative reference voice exists for the claimed officer.', source: '—', status: 'UNAVAILABLE' },
  ],
  edges: [
    { id: 'E0a', from: 'caller', to: 'name', neutral: true },
    { id: 'E0b', from: 'caller', to: 'org', neutral: true },
    { id: 'E0c', from: 'warrant', to: 'signatory', neutral: true, label: 'signed by' },
    { id: 'R1', from: 'name', to: 'signatory', path: 'M70,180 C160,112 280,112 350,180', mx: 210, my: 128 },
    { id: 'R2', from: 'phone', to: 'directory' },
    { id: 'R3', from: 'seal', to: 'warrant', path: 'M350,290 C404,218 404,142 350,70', mx: 397, my: 180 },
    { id: 'R4', from: 'caller', to: 'voice' },
    { id: 'R5', from: 'warrant', to: 'org', path: 'M350,70 C350,372 70,372 70,290', mx: 210, my: 368 },
  ],
  interpretation: {
    headline: 'Multiple evidence relationships require caution.',
    counts: '1 CONFLICT · 2 ANOMALIES · 1 UNKNOWN · 1 WEAK SUPPORT',
    note: 'Decision interpretation is handled by the Decision-Safe Output layer.',
  },
};

// ---------------------------------------------------------------- legitimate bank call
export const LEGIT_BANK = {
  id: 'legit-bank',
  tabLabel: 'Legitimate Bank Call',
  caseId: 'CASE #2845',
  caseType: 'Bank verification call',
  statusLine: 'Analyzing relationships between claims and evidence',
  evidence: [
    'Call transcript',
    'Caller phone number',
    'Official bank directory',
    'Caller request',
  ],
  rawStatement: '“Hello, this is Priya from City Trust Bank. Please visit your branch to update your KYC.”',
  extractNote: 'AI extracts meaning into structured claims. It does not determine truth.',
  claims: [
    { id: 'C1', label: 'Claimed name', value: 'Priya', source: 'Caller statement', location: 'Call transcript · line 1', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C2', label: 'Claimed organization', value: 'City Trust Bank', source: 'Caller statement', location: 'Call transcript · line 1', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C3', label: 'Caller request', value: '“Please visit your branch”', source: 'Caller statement', location: 'Call transcript · line 2', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C4', label: 'Caller phone', value: '+91 ••••• 88412', source: 'Call metadata', location: 'Call record', method: 'Deterministic capture', status: 'CLAIM' },
    { id: 'C5', label: 'Sensitive demand', value: 'None detected — no OTP request, no transfer request', source: 'Call transcript', location: 'Full transcript scan', method: 'Deterministic scan', status: 'CLAIM' },
  ],
  relationships: [
    {
      id: 'R1', type: 'SUPPORT', supportLevel: 'strong', title: 'Caller number vs official bank directory',
      claimA: '+91 ••••• 88412', sourceA: 'Call metadata',
      claimB: 'City Trust Bank directory record', sourceB: 'Official bank directory',
      check: 'Exact number comparison', method: 'Deterministic comparison',
      result: 'Matching record found. The caller’s number matches the bank’s officially listed customer-care number exactly.',
      confidence: 'High',
      uncertainty: 'A matching number is strong evidence of consistency. It is not a guarantee of authenticity — numbers can be spoofed.',
      why: 'An authoritative source independently confirms the claimed information: the number on the call is the bank’s own listed number.',
      evidence: [
        { label: 'Official directory', text: 'City Trust Bank · Customer care: +91 ••••• 88412 → EXACT MATCH.', highlight: 'EXACT MATCH' },
      ],
      evidenceNote: 'Strong support means authoritative confirmation — not resemblance.',
    },
    {
      id: 'R2', type: 'SUPPORT', supportLevel: 'weak', title: 'Caller request vs legitimate process',
      claimA: '“Please visit your branch”', sourceA: 'Caller statement',
      claimB: 'Standard bank process', sourceB: 'Public bank guidance',
      check: 'Request pattern check', method: 'Deterministic scan',
      result: 'The request asks for nothing sensitive: no OTP, no transfer, no remote access. Consistent with a routine branch visit request.',
      confidence: 'Medium',
      uncertainty: 'Behavior alone cannot prove identity — but the absence of pressure tactics is consistent with legitimate process.',
      why: 'The caller asked the customer to visit a branch in person instead of extracting anything over the call — consistent with how banks handle KYC updates.',
      evidence: [
        { label: 'Transcript scan', text: 'Scanned for: OTP request · transfer request · remote-access request → none found.', highlight: 'none found' },
      ],
      evidenceNote: 'What the caller did NOT ask for is part of the evidence.',
    },
  ],
  nodes: [
    { id: 'caller', label: 'Caller', kind: 'person', x: 90, y: 70, detail: 'The person on the call.', source: 'Call metadata', status: 'UNDER REVIEW' },
    { id: 'bank', label: 'City Trust Bank', kind: 'claim', x: 90, y: 210, detail: 'Organization claimed by the caller.', source: 'Caller statement', status: 'CLAIM' },
    { id: 'phone', label: 'Phone Number', kind: 'evidence', x: 230, y: 70, detail: 'The caller’s number, captured from call metadata.', source: 'Call metadata', status: 'CHECKED' },
    { id: 'directory', label: 'Bank Directory', kind: 'source', x: 230, y: 210, detail: 'The bank’s officially published directory.', source: 'Official directory', status: 'AUTHORITATIVE' },
    { id: 'request', label: 'Branch Visit Request', kind: 'claim', x: 350, y: 140, detail: 'The caller asked the customer to visit a branch — nothing sensitive requested.', source: 'Caller statement', status: 'CLAIM' },
  ],
  edges: [
    { id: 'E0a', from: 'caller', to: 'bank', neutral: true, label: 'claims' },
    { id: 'E0b', from: 'caller', to: 'phone', neutral: true, label: 'calling from' },
    { id: 'R1', from: 'phone', to: 'directory' },
    { id: 'R2', from: 'request', to: 'bank' },
  ],
  interpretation: {
    headline: 'Consistent with available evidence.',
    counts: '2 SUPPORT · 0 CONFLICTS · 0 ANOMALIES',
    note: 'This is not a guarantee of authenticity. Starting an investigation does not mean accusing the person.',
  },
};

export const CASES = { 'digital-arrest': DIGITAL_ARREST, 'legit-bank': LEGIT_BANK };
