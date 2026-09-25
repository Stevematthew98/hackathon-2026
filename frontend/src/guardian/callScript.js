// Scripted incoming scam call used by the Idea-1 prototype.
// The telecom layer is SIMULATED: no real call is intercepted. Everything else —
// timed transcript, signal detection, case-object creation, UI states — is real.
//
// Compressed timeline: the full call plays out in 7 seconds. The signal
// engine analyses every line as it arrives and the case is ready at 7s.

// t = seconds after answering. speaker: 'caller' | 'you'
export const CALL_SCRIPT = [
  { t: 0.37, speaker: 'caller', text: 'Hello? Am I speaking to the holder of this mobile number?' },
  { t: 0.83, speaker: 'you', text: 'Yes… who is this?' },
  { t: 1.20, speaker: 'caller', text: 'I am Inspector Ravi Kumar, from the Cyber Crime Branch, Mumbai.' },
  { t: 1.93, speaker: 'caller', text: 'Your Aadhaar number has been linked to a money laundering case. A warrant is being prepared in your name.' },
  { t: 2.67, speaker: 'you', text: 'What? That is impossible. I have not done anything.' },
  { t: 3.22, speaker: 'caller', text: 'Do not disconnect this call. Stay on the line while we verify. You have one hour before the case is filed.' },
  { t: 4.14, speaker: 'caller', text: 'To keep the investigation secret, transfer a refundable security deposit of fifty thousand rupees via UPI right now.' },
  { t: 5.07, speaker: 'you', text: 'I need to think. I want to call my family first.' },
  { t: 5.62, speaker: 'caller', text: 'If you tell anyone, it will be treated as non-cooperation and you will be arrested today itself.' },
  { t: 6.45, speaker: 'caller', text: 'Are you still there? The senior officer is waiting on the other line.' },
];

export const CALLER_NUMBER_FULL = '+91 98765 43210';
export const CALLER_NUMBER_MASKED = '+91 98••• ••210';
export const CASE_ID = 'TG-2026-1042';

export const SCRIPT_END = 7;
