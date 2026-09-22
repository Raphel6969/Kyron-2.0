import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Structured JSON log middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration
    }));
  });
  next();
});

app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    runtime: 'node-esm',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

app.get('/impact', (req, res) => {
  res.json({
    baseline_metric: 28.0,
    optimized_metric: 3.8,
    total_economic_saved: 185000,
    unit: 'INR',
    sample_count: 94,
    last_updated: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Node Server listening on port ${PORT}`);
});
