import { useState } from 'react';
import Guardian from './guardian/Guardian';
import ForwardCheck from './forward/ForwardCheck';
import EvidenceGraph from './graph/EvidenceGraph';
import VerificationLoop from './verify/VerificationLoop';
import DecisionOutput from './decision/DecisionOutput';
import CrossModel from './crossmodel/CrossModel';
import './shell.css';

function App() {
  const [page, setPage] = useState(1);
  const [verifyCase, setVerifyCase] = useState(null);
  const [graphHighlight, setGraphHighlight] = useState(null);
  const goVerify = (caseId) => { setVerifyCase(caseId); setPage(4); };
  const goGraph = (caseId, relId) => { setGraphHighlight({ caseId, relId, key: Date.now() }); setPage(3); };
  // navigating by dots clears a one-shot graph highlight
  const nav = (n) => { if (n !== 3) setGraphHighlight(null); setPage(n); };
  if (page === 1) return <Guardian page={page} onNav={nav} />;
  if (page === 2) return <ForwardCheck page={page} onNav={nav} />;
  if (page === 4) return <VerificationLoop page={page} onNav={nav} initialCase={verifyCase || 'digital-arrest'} />;
  if (page === 5) return <DecisionOutput page={page} onNav={nav} initialCase={verifyCase || 'digital-arrest'} onContinueVerify={goVerify} onViewGraph={goGraph} />;
  if (page === 6) return <CrossModel page={page} onNav={nav} />;
  return <EvidenceGraph key={graphHighlight ? `g-${graphHighlight.key}` : 'g-plain'} page={page} onNav={nav} onStartVerify={goVerify} highlight={graphHighlight} />;
}

export default App;
