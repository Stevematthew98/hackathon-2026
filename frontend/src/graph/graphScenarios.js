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
      checkable: false,
      checkableNote: 'No authoritative reference voice exists — this cannot be checked independently.',
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
    {
      id: 'R6', type: 'UNKNOWN', title: 'Claimed officer affiliation vs official department record',
      claimA: 'Inspector Ravi Kumar serves in the Cyber Crime Branch', sourceA: 'Caller statement',
      claimB: 'Official department record', sourceB: 'Not yet consulted',
      check: 'Independent department lookup', method: 'Not yet performed',
      result: 'No independent source has been consulted about this affiliation yet.',
      confidence: '—',
      uncertainty: 'The affiliation is the load-bearing claim of this case. Until an independent source confirms or denies it, the caller’s authority is unverified.',
      why: 'Everything threatening on this call — the arrest, the urgency, the payment demand — only carries weight if the caller is who he claims to be. That affiliation has never been checked against an independent source.',
      evidence: [
        { label: 'Caller transcript', text: 'I am Inspector Ravi Kumar from Cyber Crime Branch.', highlight: 'Inspector Ravi Kumar' },
      ],
      evidenceNote: 'The claim exists only in the caller’s own words so far.',
      identityBearing: true,
      authorityBearing: true,
      checkable: true,
      materialScope: ['caller identity', 'claimed authority', 'threat credibility'],
      verificationSpec: {
        question: 'Is Inspector Ravi Kumar actually associated with the Cyber Crime Branch?',
        chain: {
          nodes: ['Caller', 'Inspector Ravi Kumar', 'Cyber Crime Branch'],
          connectors: ['claims to be', 'claims affiliation with'],
          edgeLabel: 'Official affiliation',
        },
        whyMatters: 'The caller’s authority depends on this affiliation, but the current evidence does not independently establish it.',
        unresolvedNote: 'No independent source has been consulted yet — the claim exists only in the caller’s own words.',
        action: 'Contact the Cyber Crime Branch using contact information published by an official police source and ask whether Inspector Ravi Kumar is associated with this case.',
        doNot: [
          'call the number provided by the caller',
          'click the link provided by the caller',
          'use contact information supplied by the claimant',
        ],
        independentLine: 'Use an independent source.',
        // Canonical demo outcome for this claim. The Idea 4 auto-run plays
        // this outcome (DEMO MODE — the live product performs the real check).
        scriptedOutcome: 'denied',
        outcomes: {
          confirmed: {
            label: 'Officer and case confirmed',
            resultText: '“Officer/case confirmed through an independent source.”',
            nextAction: 'No immediate action is required from TrustGuard.',
            sourceType: 'Independent department verification',
          },
          denied: {
            label: 'No such officer / case',
            resultText: '“No such officer/case was confirmed.”',
            nextAction: 'Do not send money, OTPs, credentials, or personal documents. End contact and preserve the evidence.',
            sourceType: 'Independent department verification',
          },
          inconclusive: {
            label: 'Unable to verify',
            resultText: 'Verification inconclusive — the department could neither confirm nor deny.',
            nextAction: 'Do not act until independent verification is available.',
            sourceType: 'Independent department verification',
          },
        },
      },
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
    { id: 'R6', from: 'name', to: 'org' },
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
    {
      id: 'R3', type: 'UNKNOWN', title: 'Caller staff identity vs bank staff record',
      claimA: 'Caller is City Trust Bank fraud-team staff', sourceA: 'Caller statement',
      claimB: 'Bank staff record', sourceB: 'Not yet consulted',
      check: 'Independent callback verification', method: 'Not yet performed',
      result: 'The caller’s identity as bank staff has not been independently confirmed.',
      confidence: '—',
      uncertainty: 'A matching number and a routine request are observations about the call — not proof of who is on it.',
      why: 'Every reassuring signal in this case only means something if the caller genuinely is the bank.',
      evidence: [
        { label: 'Call transcript', text: '“Hello, this is Priya from City Trust Bank…”', highlight: 'Priya from City Trust Bank' },
      ],
      evidenceNote: 'The staff identity is claimed, not confirmed.',
      identityBearing: true,
      authorityBearing: true,
      checkable: true,
      materialScope: ['caller identity', 'claimed authority'],
      verificationSpec: {
        question: 'Is this actually the bank’s fraud team?',
        chain: {
          nodes: ['Caller', 'City Trust Bank fraud team', 'Official bank staff record'],
          connectors: ['claims to be', 'confirm against'],
          edgeLabel: 'Staff identity',
        },
        whyMatters: 'The caller’s identity is still a claim until it is independently verified.',
        unresolvedNote: 'No independent callback has been made yet.',
        action: 'Hang up and call the number printed on the back of your bank card, then ask the bank whether they placed this call.',
        doNot: [
          'call back the number that called you',
          'use a number read out by the caller',
          'share OTPs or credentials during the callback',
        ],
        independentLine: 'Use an independent source.',
        // Canonical demo outcome for this claim. The Idea 4 auto-run plays
        // this outcome (DEMO MODE — the live product performs the real check).
        scriptedOutcome: 'confirmed',
        outcomes: {
          confirmed: {
            label: 'Yes, the bank confirmed the call',
            resultText: '“Yes, the bank confirmed the call.”',
            nextAction: 'No immediate action is required from TrustGuard.',
            sourceType: 'Bank callback via card-printed number',
          },
          denied: {
            label: 'The bank has no record of this call',
            resultText: '“The bank has no record of placing this call.”',
            nextAction: 'Do not share OTPs, credentials, or personal documents. End contact and preserve the evidence.',
            sourceType: 'Bank callback via card-printed number',
          },
          inconclusive: {
            label: 'Unable to verify',
            resultText: 'Verification inconclusive — the bank could neither confirm nor deny.',
            nextAction: 'Do not act until independent verification is available.',
            sourceType: 'Bank callback via card-printed number',
          },
        },
      },
    },
  ],
  nodes: [
    { id: 'caller', label: 'Caller', kind: 'person', x: 90, y: 70, detail: 'The person on the call.', source: 'Call metadata', status: 'UNDER REVIEW' },
    { id: 'bank', label: 'City Trust Bank', kind: 'claim', x: 90, y: 210, detail: 'Organization claimed by the caller.', source: 'Caller statement', status: 'CLAIM' },
    { id: 'phone', label: 'Phone Number', kind: 'evidence', x: 230, y: 70, detail: 'The caller’s number, captured from call metadata.', source: 'Call metadata', status: 'CHECKED' },
    { id: 'directory', label: 'Bank Directory', kind: 'source', x: 230, y: 210, detail: 'The bank’s officially published directory.', source: 'Official directory', status: 'AUTHORITATIVE' },
    { id: 'request', label: 'Branch Visit Request', kind: 'claim', x: 350, y: 140, detail: 'The caller asked the customer to visit a branch — nothing sensitive requested.', source: 'Caller statement', status: 'CLAIM' },
    { id: 'staffrecord', label: 'Staff Record', kind: 'unavailable', x: 350, y: 280, detail: 'No independent staff record has been consulted yet.', source: '—', status: 'UNAVAILABLE' },
  ],
  edges: [
    { id: 'E0a', from: 'caller', to: 'bank', neutral: true, label: 'claims' },
    { id: 'E0b', from: 'caller', to: 'phone', neutral: true, label: 'calling from' },
    { id: 'R1', from: 'phone', to: 'directory' },
    { id: 'R2', from: 'request', to: 'bank' },
    { id: 'R3', from: 'caller', to: 'staffrecord' },
  ],
  interpretation: {
    headline: 'Consistent with available evidence.',
    counts: '2 SUPPORT · 0 CONFLICTS · 0 ANOMALIES',
    note: 'This is not a guarantee of authenticity. Starting an investigation does not mean accusing the person.',
  },
};


// ---------------------------------------------------------------- customs parcel SMS
// Scenario C — deliberately thin evidence. Nothing independent connects the
// sender, the parcel reference, or the payment demand to the claimed
// department, so this case demonstrates honest abstention (NEEDS REVIEW).
export const CUSTOMS_SMS = {
  id: 'customs-sms',
  tabLabel: 'Customs SMS Case',
  caseId: 'CASE #2849',
  caseType: 'Parcel / customs fee SMS',
  statusLine: 'Analyzing relationships between claims and evidence',
  evidence: [
    'SMS text',
    'Sender number',
    'Parcel reference',
    'Payment link',
  ],
  rawStatement: '“Customs Dept: Your parcel PKG-88213 is held. Pay Rs. 2,140 clearance fee within 24 hrs: customs-clear-fee.com/pay”',
  extractNote: 'AI extracts meaning into structured claims. It does not determine truth.',
  claims: [
    { id: 'C1', label: 'Claimed sender', value: 'Customs Clearance Dept', source: 'SMS text', location: 'SMS · header', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C2', label: 'Parcel reference', value: 'PKG-88213', source: 'SMS text', location: 'SMS · body', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C3', label: 'Fee demand', value: 'Rs. 2,140 within 24 hours', source: 'SMS text', location: 'SMS · body', method: 'AI extraction', status: 'CLAIM' },
    { id: 'C4', label: 'Sender number', value: '+91 ••••• 55671', source: 'SMS metadata', location: 'SMS record', method: 'Deterministic capture', status: 'CLAIM' },
    { id: 'C5', label: 'Payment link', value: 'customs-clear-fee.com/pay', source: 'SMS text', location: 'SMS · body', method: 'Deterministic capture', status: 'CLAIM' },
  ],
  relationships: [
    {
      id: 'R1', type: 'UNKNOWN', title: 'Claimed sender vs verifiable identity',
      claimA: 'Customs Clearance Dept', sourceA: 'SMS text',
      claimB: 'Official sender record', sourceB: 'Not available',
      check: 'Sender identity check', method: 'Not available',
      result: 'No independent source ties this number to the claimed department.',
      confidence: '—',
      uncertainty: 'The sender cannot be confirmed or ruled out from the available evidence. The system is comfortable saying: I don’t know.',
      why: 'The entire message borrows authority from a department name — but nothing independent connects the sender to that department.',
      evidence: [
        { label: 'SMS header', text: 'From: +91 ••••• 55671 · No registered sender ID for a customs department.', highlight: 'No registered sender ID' },
      ],
      evidenceNote: 'Missing evidence is shown as missing — never filled in with a guess.',
      identityBearing: true,
      authorityBearing: true,
      checkable: true,
      materialScope: ['sender authority', 'message credibility'],
      verificationSpec: {
        question: 'Is this sender actually the Customs Clearance Department?',
        chain: {
          nodes: ['SMS', 'Customs Clearance Dept', 'Official department record'],
          connectors: ['claims sender', 'confirm against'],
          edgeLabel: 'Sender identity',
        },
        whyMatters: 'The entire message borrows authority from a department name — but nothing independent connects the sender to that department.',
        unresolvedNote: 'No independent source ties this number to the claimed department.',
        action: 'Contact the customs office through contact information you obtain yourself — not the SMS — and ask whether this message came from them.',
        doNot: [
          'click the link in the SMS',
          'call the number in the SMS',
          'reply to the SMS',
        ],
        independentLine: 'Use an independent source.',
        // Canonical demo outcome for this claim. The Idea 4 auto-run plays
        // this outcome (DEMO MODE — the live product performs the real check).
        scriptedOutcome: 'inconclusive',
        outcomes: {
          confirmed: {
            label: 'Yes, the department confirmed the message',
            resultText: '“Yes — this message was sent by the department.”',
            nextAction: 'Follow only the official payment channel the department confirms.',
            sourceType: 'Customs office via independently obtained contact',
          },
          denied: {
            label: 'The department did not send this',
            resultText: '“No such message was sent by the department.”',
            nextAction: 'Do not pay, click the link, or reply. Delete the SMS and preserve it as evidence.',
            sourceType: 'Customs office via independently obtained contact',
          },
          inconclusive: {
            label: 'Unable to verify',
            resultText: 'Verification inconclusive — the office could neither confirm nor deny.',
            nextAction: 'Do not pay or click anything until independent verification is available.',
            sourceType: 'Customs office via independently obtained contact',
          },
        },
      },
    },
    {
      id: 'R2', type: 'UNKNOWN', title: 'Parcel reference vs carrier records',
      claimA: 'PKG-88213', sourceA: 'SMS text',
      claimB: 'Carrier / customs record', sourceB: 'Not available in prototype',
      check: 'Reference lookup', method: 'Not available',
      result: 'No independent record is available to check this reference against.',
      confidence: '—',
      uncertainty: 'A real parcel could exist — or the reference could be invented. The available evidence cannot tell.',
      why: 'The payment demand hangs on this reference. Without an independent record, the reference is just characters in a message.',
      evidence: [
        { label: 'Reference', text: 'PKG-88213 appears only in the SMS itself. No corroborating record is on file.', highlight: 'only in the SMS itself' },
      ],
      evidenceNote: 'A claim that only the claimant repeats is not evidence.',
      identityBearing: false,
      authorityBearing: false,
      checkable: true,
      materialScope: ['claimed parcel', 'payment demand', 'link credibility'],
      verificationSpec: {
        question: 'Is there actually a parcel held for you under reference PKG-88213?',
        chain: {
          nodes: ['SMS', 'Parcel PKG-88213', 'Official parcel record'],
          connectors: ['claims parcel', 'confirm against'],
          edgeLabel: 'Parcel existence',
        },
        whyMatters: 'The payment demand hangs on this reference. Without an independent record, the reference is just characters in a message.',
        unresolvedNote: 'No independent record is available to check this reference against yet.',
        action: 'Contact the courier or customs office through contact information you obtain yourself — not the SMS — and ask whether a parcel with this reference is held for you.',
        doNot: [
          'click the link in the SMS',
          'call the number in the SMS',
          'pay anything through the SMS link',
        ],
        independentLine: 'Use an independent source.',
        // Canonical demo outcome for this claim. The Idea 4 auto-run plays
        // this outcome (DEMO MODE — the live product performs the real check).
        scriptedOutcome: 'inconclusive',
        outcomes: {
          confirmed: {
            label: 'Yes, the parcel is confirmed',
            resultText: '“Yes — a parcel with this reference is held, and the fee can be paid at the official counter.”',
            nextAction: 'No immediate action is required from TrustGuard. Pay only through the official counter or site.',
            sourceType: 'Courier / customs check via official contact',
          },
          denied: {
            label: 'No such parcel or reference on record',
            resultText: '“No parcel or reference matching this SMS exists on record.”',
            nextAction: 'Do not pay, click the link, or reply. Delete the SMS and preserve it as evidence.',
            sourceType: 'Courier / customs check via official contact',
          },
          inconclusive: {
            label: 'Unable to verify',
            resultText: 'Verification inconclusive — the office could neither confirm nor deny.',
            nextAction: 'Do not pay or click anything until independent verification is available.',
            sourceType: 'Courier / customs check via official contact',
          },
        },
      },
    },
    {
      id: 'R3', type: 'ANOMALY', title: 'Payment link domain vs official domains',
      claimA: 'customs-clear-fee.com', sourceA: 'SMS text',
      claimB: 'Known official domains', sourceB: 'Public records',
      check: 'Domain comparison', method: 'Deterministic comparison',
      result: 'The domain does not match any known official customs domain.',
      confidence: 'Medium',
      uncertainty: 'An unfamiliar domain is suspicious, not disproof — but never pay through a link you did not independently verify.',
      why: 'Official bodies do not collect clearance fees through lookalike domains sent in SMS links.',
      evidence: [
        { label: 'Link domain', text: 'customs-clear-fee.com — not present in the list of known official customs domains.', highlight: 'not present' },
      ],
      evidenceNote: 'An anomaly raises the question; only an independent check can answer it.',
    },
  ],
  nodes: [
    { id: 'msg', label: 'SMS message', kind: 'evidence', x: 210, y: 60, detail: 'The SMS as received. Everything claimed inside it is unverified.', source: 'SMS text', status: 'UNDER REVIEW' },
    { id: 'sender', label: 'Customs Clearance Dept', kind: 'claim', x: 90, y: 190, detail: 'Sender name claimed in the SMS header.', source: 'SMS text', status: 'CLAIM' },
    { id: 'number', label: 'Sender number', kind: 'evidence', x: 330, y: 190, detail: 'The number the SMS came from, captured from metadata.', source: 'SMS metadata', status: 'CHECKED' },
    { id: 'ref', label: 'PKG-88213', kind: 'claim', x: 90, y: 300, detail: 'Parcel reference as stated in the SMS.', source: 'SMS text', status: 'CLAIM' },
    { id: 'paylink', label: 'Payment link', kind: 'evidence', x: 330, y: 300, detail: 'The payment URL inside the SMS.', source: 'SMS text', status: 'UNDER REVIEW' },
    { id: 'official', label: 'Official records', kind: 'unavailable', x: 210, y: 300, detail: 'No independent official record is reachable in this prototype.', source: '—', status: 'UNAVAILABLE' },
  ],
  edges: [
    { id: 'E0a', from: 'msg', to: 'sender', neutral: true, label: 'claims' },
    { id: 'E0b', from: 'msg', to: 'number', neutral: true, label: 'sent from' },
    { id: 'E0c', from: 'msg', to: 'ref', neutral: true, label: 'mentions' },
    { id: 'E0d', from: 'msg', to: 'paylink', neutral: true, label: 'contains' },
    { id: 'R1', from: 'sender', to: 'official' },
    { id: 'R2', from: 'ref', to: 'official' },
    { id: 'R3', from: 'paylink', to: 'official' },
  ],
  interpretation: {
    headline: 'Too little independent evidence to settle this case.',
    counts: '2 UNKNOWN · 1 ANOMALY · 0 CONFLICTS · 0 SUPPORT',
    note: 'Decision interpretation is handled by the Decision-Safe Output layer.',
  },
};

export const CASES = {
  'digital-arrest': DIGITAL_ARREST,
  'legit-bank': LEGIT_BANK,
  'customs-sms': CUSTOMS_SMS,
};

// ---------------------------------------------------------------- workbench support
// What each graph node *is* for the purpose of a check (workbench input types).
export const NODE_WK = {
  'digital-arrest': {
    caller: 'person', name: 'person-name', org: 'org', warrant: 'document',
    signatory: 'person-name', seal: 'seal', phone: 'phone',
    directory: 'directory', voice: 'voice',
  },
  'legit-bank': {
    caller: 'person', bank: 'org', phone: 'phone',
    directory: 'directory', request: 'request',
  },
  'customs-sms': {
    msg: 'document', sender: 'org', number: 'phone',
    ref: 'reference', paylink: 'document', official: 'directory',
  },
};

// Which evidence chips each relationship draws on (chip -> relationship navigation).
export const REL_CHIPS = {
  'digital-arrest': {
    R1: ['Call transcript', 'Caller identity claim', 'Warrant'],
    R2: ['Phone number'],
    R3: ['Warrant', 'Document seal'],
    R4: ['Call transcript', 'Caller identity claim', 'Reference voice availability'],
    R5: ['Warrant', 'Document seal'],
    R6: ['Call transcript', 'Caller identity claim'],
  },
  'legit-bank': {
    R1: ['Call transcript', 'Caller phone number', 'Official bank directory'],
    R2: ['Call transcript', 'Caller request'],
    R3: ['Call transcript', 'Caller identity claim'],
  },
  'customs-sms': {
    R1: ['SMS text', 'Sender number'],
    R2: ['SMS text', 'Parcel reference'],
    R3: ['SMS text', 'Payment link'],
  },
};

// Deterministic check methods available in the workbench. Each declares the
// input types it accepts; anything else is an honest METHOD MISMATCH.
export const WORKBENCH_METHODS = [
  {
    id: 'name-compare', label: 'Entity-name comparison',
    needs: ['person-name', 'person-name'], needsLabel: 'two person-name nodes',
    trace: (a, b) => [
      `load node A · "${a.label}" <- ${a.source}`,
      `load node B · "${b.label}" <- ${b.source}`,
      'normalize · lowercase · strip titles and honorifics',
      'compare entity identifiers · deterministic',
      '-> result emitted',
    ],
  },
  {
    id: 'dir-lookup', label: 'Official-directory number lookup',
    needs: ['phone', 'directory'], needsLabel: 'a phone number and a directory',
    trace: (a, b) => [
      `load number · "${a.label}" <- ${a.source}`,
      `open directory · "${b.label}" <- ${b.source} (authoritative)`,
      'exact-match search · no fuzzy matching',
      '-> result emitted',
    ],
  },
  {
    id: 'template-compare', label: 'Seal / template comparison',
    needs: ['seal', 'document'], needsLabel: 'a seal and a document',
    trace: (a, b) => [
      `load observed seal · "${a.label}"`,
      `load document · "${b.label}"`,
      'compare placement · border style · geometry',
      '-> result emitted',
    ],
  },
  {
    id: 'voice-compare', label: 'Reference-voice comparison',
    needs: ['person', 'voice'], needsLabel: 'a caller and a reference voice',
    trace: (a, b) => [
      'load call audio segment',
      `request reference voice · "${b.label}" <- ${b.source}`,
      'reference unavailable -> comparison cannot run',
      '-> result emitted',
    ],
  },
  {
    id: 'layout-compare', label: 'Layout resemblance check',
    needs: ['document', 'org'], needsLabel: 'a document and an organisation',
    trace: (a, b) => [
      `extract layout features · "${a.label}"`,
      `load reference style · "${b.label}"`,
      'compare masthead · columns · spacing (resemblance only)',
      '-> result emitted',
    ],
  },
  {
    id: 'request-compare', label: 'Request pattern scan',
    needs: ['request', 'org'], needsLabel: 'a request and an organisation',
    trace: (a, b) => [
      `scan request text · "${a.label}"`,
      'patterns: OTP request · transfer request · remote access',
      `compare against routine process · "${b.label}"`,
      '-> result emitted',
    ],
  },
];

// Documented node-pair + method -> relationship id. Key: sorted node ids + method.
// Anything compatible but undocumented honestly reports "no relationship detected".
export const WORKBENCH_PAIRS = {
  'digital-arrest': {
    'name|signatory|name-compare': 'R1',
    'directory|phone|dir-lookup': 'R2',
    'seal|warrant|template-compare': 'R3',
    'caller|voice|voice-compare': 'R4',
    'org|warrant|layout-compare': 'R5',
  },
  'legit-bank': {
    'directory|phone|dir-lookup': 'R1',
    'bank|request|request-compare': 'R2',
  },
  'customs-sms': {
    'number|official|dir-lookup': 'R1',
  },
};
