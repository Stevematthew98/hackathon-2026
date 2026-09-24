const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'hackathon-2026-backend', time: new Date().toISOString() });
});

// ---- Idea 1: Guardian live-tripwire case store ----
// Cases built by the client-side signal engine are persisted here so the
// verdict pipeline (Ideas 3-5) and the police-report export can retrieve them.
const guardianCases = new Map();

app.post('/api/guardian/cases', (req, res) => {
  const body = req.body || {};
  if (!body.id || !Array.isArray(body.signals)) {
    return res.status(400).json({ error: 'case id and signals[] are required' });
  }
  const storedAt = new Date().toISOString();
  guardianCases.set(body.id, { ...body, storedAt });
  res.status(201).json({ id: body.id, storedAt, signals: body.signals.length });
});

app.get('/api/guardian/cases/:id', (req, res) => {
  const c = guardianCases.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'guardian case not found' });
  res.json(c);
});

app.get('/api/guardian/cases', (req, res) => {
  res.json([...guardianCases.values()].map((c) => ({
    id: c.id, storedAt: c.storedAt, signals: c.signals.length, durationSec: c.durationSec,
  })));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
