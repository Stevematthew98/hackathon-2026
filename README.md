# hackathon-2026

AI hackathon build — Sept 24, 2026.

## Layout

- `frontend/` — React + Vite app → deployed on **Vercel** (root directory: `frontend`)
- `backend/` — Express API → deployed on **Railway** (root directory: `backend`)

## Local dev

```bash
# backend
cd backend && npm install && npm start      # http://localhost:3001

# frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Backend exposes `GET /api/health` for status checks.
