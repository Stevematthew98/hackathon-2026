import { useState } from 'react';
import Guardian from './guardian/Guardian';
import ForwardCheck from './forward/ForwardCheck';
import './shell.css';

function App() {
  const [page, setPage] = useState(1);
  return page === 1
    ? <Guardian page={page} onNav={setPage} />
    : <ForwardCheck page={page} onNav={setPage} />;
}

export default App;
