const express = require('express');
const cors = require('cors');
const path = require('path');

const { listCases, getCase } = require('./trustguard/cases');
const { analyze } = require('./trustguard/pipeline');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'hackathon-2026-backend', time: new Date().toISOString() });
});

// TrustGuard demo evidence (audio, images) served statically — lives at repo root
app.use('/evidence', express.static(path.join(__dirname, '..', 'trustguard', 'evidence')));

app.get('/api/cases', (req, res) => {
  res.json(listCases());
});

app.get('/api/cases/:id', (req, res) => {
  const c = getCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'case not found' });
  res.json(c);
});

app.post('/api/cases/:id/analyze', (req, res) => {
  try {
    res.json(analyze(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
