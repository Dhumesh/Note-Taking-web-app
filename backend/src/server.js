import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { connectDB, isDBConnected } from './config/db.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));

// Return 503 when DB is down so frontend gets a clear error instead of ECONNREFUSED
app.use('/api/auth', (req, res, next) => {
  if (!isDBConnected()) return res.status(503).json({ message: 'Database unavailable. Start MongoDB or set MONGODB_URI in backend/.env' });
  next();
});
app.use('/api/notes', (req, res, next) => {
  if (!isDBConnected()) return res.status(503).json({ message: 'Database unavailable. Start MongoDB or set MONGODB_URI in backend/.env' });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, db: isDBConnected() }));

// Global error handler so uncaught errors return 500 instead of crashing
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  connectDB(); // connect in background; server stays up even if DB fails
});
