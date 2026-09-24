import { useState } from 'react';
import Guardian from './guardian/Guardian';
import ForwardCheck from './forward/ForwardCheck';
import EvidenceGraph from './graph/EvidenceGraph';
import './shell.css';

function App() {
  const [page, setPage] = useState(1);
  if (page === 1) return <Guardian page={page} onNav={setPage} />;
  if (page === 2) return <ForwardCheck page={page} onNav={setPage} />;
  return <EvidenceGraph page={page} onNav={setPage} />;
}

export default App;
