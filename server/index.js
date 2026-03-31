import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Claude Mastery API running on port ${PORT}`);
  });
}

start().catch(console.error);
