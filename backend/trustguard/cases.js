// TrustGuard demo case definitions.
// Simulated components are explicitly labelled — the demo never presents
// a simulated check as a measured one.

const CASES = {
  'case-01': {
    id: 'case-01',
    title: 'Digital Arrest Scam',
    subtitle: 'Voice note + fake warrant + threatening chats',
    claimedIdentity: 'Inspector Ravi Kumar, Cyber Crime Branch, Bengaluru',
    phone: '+91-98XXXXXX21',
    receivedAt: '23:47',
    evidence: [
      {
        id: 'E1',
        kind: 'audio',
        label: 'Voice note (Kannada)',
        file: 'case-01/voice-note.mp3',
        description:
          'Caller claims to be a Cyber Crime officer. Demands a "verification" transfer within 2 hours. (Demo audio generated for this prototype.)',
      },
      {
        id: 'E2',
        kind: 'document',
        label: 'Arrest warrant photo',
        file: null,
        simulated: true,
        description:
          'Photo of a printed warrant: letterhead, red stamp, signature, case number. Simulated prop, clearly labelled in the demo.',
      },
      {
        id: 'E3',
        kind: 'chat',
        label: 'Threatening chat messages',
        file: null,
        simulated: true,
        description:
          'Urgency cues ("2 hours", "do not tell anyone"), payment instructions via a personal UPI ID. Simulated transcript.',
      },
      {
        id: 'E4',
        kind: 'identity',
        label: 'Claimed identity',
        description: 'Inspector Ravi Kumar, Cyber Crime Branch, Bengaluru',
      },
      {
        id: 'E5',
        kind: 'metadata',
        label: 'Caller phone number',
        simulated: true,
        description: '+91-98XXXXXX21 — not found in the official directory (simulated lookup).',
      },
      {
        id: 'E6',
        kind: 'metadata',
        label: 'Message timing',
        description: 'Received 23:47 — outside official working hours.',
      },
    ],
  },
};

function listCases() {
  return Object.values(CASES).map(({ id, title, subtitle }) => ({ id, title, subtitle }));
}

function getCase(id) {
  return CASES[id] || null;
}

module.exports = { listCases, getCase };
