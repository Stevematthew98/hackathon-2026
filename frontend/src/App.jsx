import { useState } from 'react';
import Guardian from './guardian/Guardian';
import ForwardCheck from './forward/ForwardCheck';
import EvidenceGraph from './graph/EvidenceGraph';
import VerificationLoop from './verify/VerificationLoop';
import './shell.css';

function App() {
  const [page, setPage] = useState(1);
  const [verifyCase, setVerifyCase] = useState(null);
  const goVerify = (caseId) => { setVerifyCase(caseId); setPage(4); };
  if (page === 1) return <Guardian page={page} onNav={setPage} />;
  if (page === 2) return <ForwardCheck page={page} onNav={setPage} />;
  if (page === 4) return <VerificationLoop page={page} onNav={setPage} initialCase={verifyCase || 'digital-arrest'} />;
  return <EvidenceGraph page={page} onNav={setPage} onStartVerify={goVerify} />;
}

export default App;
