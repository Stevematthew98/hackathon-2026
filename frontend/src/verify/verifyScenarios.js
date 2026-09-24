// Idea 4 · The Verification Loop — per-case weakest-link configs.
//
// Consumes the Idea 3 case data (graphScenarios) read-only. It does NOT
// create verdicts or scores: outcomes fold new independent evidence into the
// case, and the verdict band is recomputed from relationship types only.
//
// Language rules (locked): no "genuine", no "scam", no numeric scores,
// claimed identities stay claims until independently verified.

export const VERDICT_META = {
  'NEEDS REVIEW': {
    color: '#fbbf24',
    meaning: 'Available evidence does not yet settle this case.',
  },
  'HIGH RISK': {
    color: '#f87171',
    meaning: 'Independent evidence conflicts with a load-bearing claim.',
  },
  'LOW RISK': {
    color: '#34d399',
    meaning: 'Available evidence is consistent with the independently verified information.',
  },
  UNRESOLVED: {
    color: '#9aa5b3',
    meaning: 'No conclusion was forced because independent evidence was not obtained.',
  },
};

const OUTCOME = {
  negative: {
    key: 'negative',
    label: 'No such officer / case',
    edgeAfter: 'CONFLICT',
    verdict: 'HIGH RISK',
    resultText: '“No such officer/case was confirmed.”',
    verdictNote: 'Independent verification conflicts with the caller’s claimed identity and authority.',
    nextAction: 'Do not send money, OTPs, credentials, or personal documents. End contact and preserve the evidence.',
    sourceType: 'Independent department verification',
  },
  positive: {
    key: 'positive',
    label: 'Officer and case confirmed',
    edgeAfter: 'SUPPORT',
    verdict: 'LOW RISK',
    resultText: '“Officer/case confirmed through an independent source.”',
    verdictNote: 'Available evidence is consistent with the independently verified information.',
    nextAction: 'No immediate action is required from TrustGuard.',
    sourceType: 'Independent department verification',
  },
  inconclusive: {
    key: 'inconclusive',
    label: 'Unable to verify',
    edgeAfter: 'UNKNOWN',
    verdict: 'NEEDS REVIEW',
    resultText: 'Verification inconclusive — the department could neither confirm nor deny.',
    verdictNote: 'TrustGuard cannot resolve this case from the available evidence.',
    nextAction: 'Do not act until independent verification is available.',
    sourceType: 'Independent department verification',
  },
};

const BANK_OUTCOME = {
  negative: {
    key: 'negative',
    label: 'The bank has no record of this call',
    edgeAfter: 'CONFLICT',
    verdict: 'HIGH RISK',
    resultText: '“The bank has no record of placing this call.”',
    verdictNote: 'Independent verification conflicts with the caller’s claimed identity.',
    nextAction: 'Do not share OTPs, credentials, or personal documents. End contact and preserve the evidence.',
    sourceType: 'Bank callback via card-printed number',
  },
  positive: {
    key: 'positive',
    label: 'Yes, the bank confirmed the call',
    edgeAfter: 'SUPPORT',
    verdict: 'LOW RISK',
    resultText: '“Yes, the bank confirmed the call.”',
    verdictNote: 'Consistent with available evidence.',
    nextAction: 'No immediate action is required from TrustGuard.',
    sourceType: 'Bank callback via card-printed number',
  },
  inconclusive: {
    key: 'inconclusive',
    label: 'Unable to verify',
    edgeAfter: 'UNKNOWN',
    verdict: 'NEEDS REVIEW',
    resultText: 'Verification inconclusive — the bank could neither confirm nor deny.',
    verdictNote: 'TrustGuard cannot resolve this case from the available evidence.',
    nextAction: 'Do not act until independent verification is available.',
    sourceType: 'Bank callback via card-printed number',
  },
};

export const VERIFY_CASES = {
  'digital-arrest': {
    id: 'digital-arrest',
    tabLabel: 'Digital Arrest Case',
    caseId: 'CASE #2841',
    caseType: 'Digital Arrest / Impersonation',
    pageTitle: 'The Verification Loop',
    whyHere: 'Available evidence does not yet settle this case.',
    initialVerdict: 'NEEDS REVIEW',
    relatedRels: ['R1', 'R2', 'R4'],
    relMeta: {
      R1: { type: 'CONFLICT', label: 'Caller identity vs warrant signatory', color: '#f87171' },
      R2: { type: 'ANOMALY', label: 'Caller number vs official directory', color: '#f0a832' },
      R4: { type: 'UNKNOWN', label: 'Caller voice vs reference voice', color: '#8fa0b8' },
    },
    links: [
      {
        id: 'officer-affiliation',
        n: 1,
        question: 'Is Inspector Ravi Kumar actually associated with the Cyber Crime Branch?',
        loadBearing: 'This is the load-bearing claim where the available evidence is thinnest.',
        affects: ['caller identity', 'claimed authority', 'claimed investigation'],
        whyWeakest:
          'The caller’s entire authority rests on this affiliation — the name (R1), the number (R2) and the voice (R4) are all suspicious or unverifiable on their own. If the affiliation itself is independently disproven, the authority claim collapses; if it is confirmed, the remaining evidence must be weighed honestly. No other single check touches this many relationships at once.',
        chain: {
          nodes: ['Caller', 'Inspector Ravi Kumar', 'Cyber Crime Branch'],
          connectors: ['claims to be', 'claims affiliation with'],
          edgeLabel: 'Official affiliation',
        },
        evidenceAvailable: ['caller statement', 'phone number', 'transcript', 'extracted identity claim'],
        evidenceMissing: ['independent confirmation of officer identity', 'independent confirmation of case'],
        whyMatters:
          'This claim is load-bearing because the caller’s authority depends on it. Everything threatening on this call — the arrest, the urgency, the payment demand — only carries weight if the caller is who he claims to be.',
        recommendation: {
          title: 'ONE INDEPENDENT CHECK',
          action:
            'Contact the Cyber Crime Branch using contact information published by an official police source and ask whether Inspector Ravi Kumar is associated with this case.',
          doNot: [
            'call the number provided by the caller',
            'click the link provided by the caller',
            'use contact information supplied by the claimant',
          ],
          independentLine: 'Use an independent source.',
          whyIndependent: 'The verification path must not depend on evidence controlled by the person being verified.',
          whyThisCheck:
            'TrustGuard selected this verification because resolving this claim affects multiple unresolved relationships in the case.',
          whyOne:
            'The goal is to resolve the highest-value uncertainty first rather than overwhelm the user with a checklist.',
        },
        outcomes: OUTCOME,
        historyWhat: 'Officer identity — affiliation with Cyber Crime Branch',
        historyWhy: 'Load-bearing claim: the caller’s authority depends on it',
      },
      {
        id: 'case-reference',
        n: 2,
        question: 'Does the claimed case reference actually exist?',
        loadBearing: 'With the officer link exhausted, the case reference is the next thinnest claim.',
        affects: ['claimed investigation', 'payment demand', 'threat credibility'],
        whyWeakest:
          'The officer-affiliation check could not be completed, so the next single check targets the other load-bearing claim: the investigation itself. A real case reference can be confirmed against an official record; a fabricated one cannot survive that check.',
        chain: {
          nodes: ['Caller', 'Case reference (as stated on call)', 'Official case record'],
          connectors: ['claims case', 'confirm against'],
          edgeLabel: 'Case existence',
        },
        evidenceAvailable: ['call transcript', 'reference number as spoken by caller'],
        evidenceMissing: ['independent confirmation of the case record'],
        whyMatters:
          'The threats on this call are attached to a specific case. If no such case exists in official records, the threats have no foundation.',
        recommendation: {
          title: 'NEXT SINGLE CHECK',
          action:
            'Contact the official department using independently sourced contact information and ask them to confirm the case reference.',
          doNot: [
            'call the number provided by the caller',
            'click the link provided by the caller',
            'use contact information supplied by the claimant',
          ],
          independentLine: 'Use an independent source.',
          whyIndependent: 'The verification path must not depend on evidence controlled by the person being verified.',
          whyThisCheck:
            'TrustGuard selected this verification because it is the next claim whose resolution would change the most relationships in the case.',
          whyOne:
            'The goal is to resolve the highest-value uncertainty first rather than overwhelm the user with a checklist.',
        },
        outcomes: OUTCOME,
        historyWhat: 'Case reference — existence in official records',
        historyWhy: 'Next weakest link after the officer check was inconclusive',
      },
    ],
    quiz: {
      prompt: 'The caller gave you a phone number and a website link. Which source can you actually trust for this check?',
      options: [
        { label: 'The phone number the caller gave you', correct: false, why: 'Controlled by the claimant. If the caller is lying, this number reaches the lie.' },
        { label: 'The link in the caller\u2019s SMS', correct: false, why: 'Also supplied by the claimant — same problem, different shape.' },
        { label: 'The Cyber Crime Branch number from the official police website', correct: true, why: 'Published by the department itself. The caller cannot change it, spoof it, or intercept it.' },
        { label: 'A number the caller\u2019s \u201ccolleague\u201d confirms', correct: false, why: 'Still traces back to the claimant\u2019s circle. A second voice is not a second source.' },
      ],
    },
  },

  'legit-bank': {
    id: 'legit-bank',
    tabLabel: 'Legitimate Bank Call',
    caseId: 'CASE #2845',
    caseType: 'Bank verification call',
    pageTitle: 'The Verification Loop',
    whyHere: 'The caller’s identity is still a claim until it is independently verified.',
    initialVerdict: 'NEEDS REVIEW',
    relatedRels: ['R1', 'R2'],
    relMeta: {
      R1: { type: 'SUPPORT', label: 'Caller number vs official bank directory', color: '#34d399' },
      R2: { type: 'SUPPORT', label: 'Caller request vs legitimate process', color: '#34d399' },
    },
    links: [
      {
        id: 'bank-identity',
        n: 1,
        question: 'Is this actually the bank’s fraud team?',
        loadBearing: 'This is the load-bearing claim where the available evidence is thinnest.',
        affects: ['caller identity', 'claimed authority'],
        whyWeakest:
          'The number matches the bank’s listed number (R1) and the request pattern is routine (R2) — but both of those are observations about the call, not proof of who is on it. One independent callback resolves the identity question directly, and nothing else in the case needs a check first.',
        chain: {
          nodes: ['Caller', 'City Trust Bank fraud team', 'Official bank staff record'],
          connectors: ['claims to be', 'confirm against'],
          edgeLabel: 'Staff identity',
        },
        evidenceAvailable: ['call transcript', 'caller number (matches directory listing)', 'routine request pattern'],
        evidenceMissing: ['independent confirmation that the caller is the bank’s staff'],
        whyMatters:
          'This claim is load-bearing because every reassuring signal in the case — the matching number, the polite request — only means something if the caller is genuinely the bank.',
        recommendation: {
          title: 'ONE INDEPENDENT CHECK',
          action:
            'Hang up and call the number printed on the back of your bank card, then ask the bank whether they placed this call.',
          doNot: [
            'call back the number that called you',
            'use a number read out by the caller',
            'share OTPs or credentials during the callback',
          ],
          independentLine: 'Use an independent source.',
          whyIndependent: 'The verification path must not depend on evidence controlled by the person being verified.',
          whyThisCheck:
            'TrustGuard selected this verification because resolving this claim affects every other relationship in the case.',
          whyOne:
            'The goal is to resolve the highest-value uncertainty first rather than overwhelm the user with a checklist.',
        },
        outcomes: BANK_OUTCOME,
        historyWhat: 'Bank caller identity — staff confirmation',
        historyWhy: 'Load-bearing claim: every reassuring signal depends on it',
      },
    ],
    quiz: {
      prompt: 'Your phone screen says the call is from the bank. Which source can you actually trust for this check?',
      options: [
        { label: 'The name on your phone screen — it says the bank', correct: false, why: 'Caller ID can be spoofed. A label on your screen is a claim, not evidence.' },
        { label: 'The number the caller asks you to dial', correct: false, why: 'Supplied by the claimant. Same problem as trusting the caller directly.' },
        { label: 'The number printed on the back of your bank card', correct: true, why: 'Issued by the bank and in your hand before this call existed. The caller cannot touch it.' },
        { label: 'The bank\u2019s number from a sponsored search result', correct: false, why: 'Ads can be faked. Use the card, or type the bank\u2019s official site address yourself.' },
      ],
    },
  },
};

export const VERIFY_IDS = ['digital-arrest', 'legit-bank'];
