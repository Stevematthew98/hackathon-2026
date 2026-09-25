// Cross-Model Verification scenarios (Page 6, optional lab).
//
// One evidence item per case, examined by three independent models. Each
// model uses a different method and reports a structured finding in the
// SAME vocabulary as the Evidence Graph (SUPPORT / CONFLICT / UNKNOWN) —
// no scores, no percentages, no verdicts.
//
// All model outputs here are SCRIPTED for the demo (DEMO MODE). In the live
// product each model would run for real. Findings are recorded into the
// shared case state and appear in the Evidence Graph with cross-model
// provenance; they are base relationships (never "verified", never
// material), so the locked Page 5 decision narratives cannot shift.

export const FINDING_LABEL = {
  SUPPORT: 'Consistent',
  CONFLICT: 'Inconsistent',
  UNKNOWN: 'Cannot determine',
};

export const XMODEL_CASES = {
  'digital-arrest': {
    evidenceLabel: 'Call audio',
    evidenceNote: 'The recorded call, as captured on the device.',
    models: [
      {
        id: 'svd',
        name: 'Synthetic-voice detector',
        method: 'Spectral artifact scan',
        finding: 'UNKNOWN',
        claimA: 'Call audio stream',
        sourceA: 'Call recording',
        claimB: 'Synthetic-voice artifact patterns',
        sourceB: 'Model reference set',
        check: 'Spectral artifact scan',
        result: 'No clear synthetic-voice artifacts detected in the compressed call audio.',
        uncertainty:
          'Absence of artifacts is not proof of a human speaker — compression destroys the traces this model looks for.',
        why: 'A cloned or synthetic voice would change what the caller’s words are worth.',
      },
      {
        id: 'cpath',
        name: 'Call-path forensics',
        method: 'Signaling and routing analysis',
        finding: 'CONFLICT',
        claimA: 'Observed call routing path',
        sourceA: 'Call metadata',
        claimB: 'Official department exchange routing',
        sourceB: 'Telecom routing records',
        check: 'Call-path comparison',
        result: 'The call arrived over an internet relay path — inconsistent with an official department landline exchange.',
        uncertainty: 'Routing describes the path, not the person. A relay alone identifies nobody.',
        why: 'The caller claims an official landline identity; the path tells a different story.',
      },
      {
        id: 'splice',
        name: 'Splice detector',
        method: 'Waveform continuity analysis',
        finding: 'SUPPORT',
        claimA: 'Recording continuity',
        sourceA: 'Call recording',
        claimB: 'Single uninterrupted take',
        sourceB: 'Waveform analysis',
        check: 'Edit-point scan',
        result: 'One continuous recording — no splice or edit points found.',
        uncertainty: 'A continuous recording can still be fully synthetic or performed live. Continuity is not authenticity.',
        why: 'Edits would suggest the audio was assembled; none were found.',
      },
    ],
  },
  'legit-bank': {
    evidenceLabel: 'Call audio',
    evidenceNote: 'The recorded call, as captured on the device.',
    models: [
      {
        id: 'svd',
        name: 'Synthetic-voice detector',
        method: 'Spectral artifact scan',
        finding: 'UNKNOWN',
        claimA: 'Call audio stream',
        sourceA: 'Call recording',
        claimB: 'Synthetic-voice artifact patterns',
        sourceB: 'Model reference set',
        check: 'Spectral artifact scan',
        result: 'No clear synthetic-voice artifacts detected in the compressed call audio.',
        uncertainty:
          'Absence of artifacts is not proof of a human speaker — compression destroys the traces this model looks for.',
        why: 'A cloned or synthetic voice would change what the caller’s words are worth.',
      },
      {
        id: 'cpath',
        name: 'Call-path forensics',
        method: 'Signaling and routing analysis',
        finding: 'SUPPORT',
        claimA: 'Observed call routing path',
        sourceA: 'Call metadata',
        claimB: 'Bank’s published customer-care exchange',
        sourceB: 'Official bank directory',
        check: 'Call-path comparison',
        result: 'The call path terminates at the bank’s published customer-care exchange — matching the directory record.',
        uncertainty: 'Caller-ID and routing can be spoofed. This corroborates the directory match, nothing more.',
        why: 'The path agrees with the bank’s own published records.',
      },
      {
        id: 'splice',
        name: 'Splice detector',
        method: 'Waveform continuity analysis',
        finding: 'SUPPORT',
        claimA: 'Recording continuity',
        sourceA: 'Call recording',
        claimB: 'Single uninterrupted take',
        sourceB: 'Waveform analysis',
        check: 'Edit-point scan',
        result: 'One continuous recording — no splice or edit points found.',
        uncertainty: 'A continuous recording can still be fully synthetic or performed live. Continuity is not authenticity.',
        why: 'Edits would suggest the audio was assembled; none were found.',
      },
    ],
  },
  'customs-sms': {
    evidenceLabel: 'Payment link',
    evidenceNote: 'customs-clear-fee.com/pay — as it arrived in the SMS.',
    models: [
      {
        id: 'domage',
        name: 'Domain-age lookup',
        method: 'WHOIS record check',
        finding: 'CONFLICT',
        claimA: 'customs-clear-fee.com registration age',
        sourceA: 'WHOIS record',
        claimB: 'Expected department domain history',
        sourceB: 'Domain registration norms',
        check: 'Domain-age comparison',
        result: 'The domain was registered 6 days ago. Official departments do not collect fees through week-old domains.',
        uncertainty: 'Domain age is circumstantial — a new domain is not proof of fraud.',
        why: 'The link borrows a department’s authority; its history does not match.',
      },
      {
        id: 'repfeed',
        name: 'URL-reputation feed',
        method: 'Threat-feed lookup',
        finding: 'UNKNOWN',
        claimA: 'customs-clear-fee.com reputation',
        sourceA: 'Threat intelligence feeds',
        claimB: 'Known-good / known-bad lists',
        sourceB: 'Feed records',
        check: 'Reputation lookup',
        result: 'No reputation record — the domain is too new for feeds to have seen it.',
        uncertainty: 'No record is not a clean record.',
        why: 'Reputation feeds only know what they have already seen.',
      },
      {
        id: 'redir',
        name: 'Redirect-chain analysis',
        method: 'Link-resolution trace',
        finding: 'CONFLICT',
        claimA: 'Observed redirect chain',
        sourceA: 'Link-resolution trace',
        claimB: 'Official payment-page behavior',
        sourceB: 'Web norms for official payments',
        check: 'Redirect-hop analysis',
        result: 'The link hops through two unrelated redirectors before landing — atypical for an official payment page.',
        uncertainty: 'Redirectors alone do not prove malicious intent.',
        why: 'Official payment pages resolve directly; this one does not.',
      },
    ],
  },
};

export const XMODEL_IDS = Object.keys(XMODEL_CASES);
