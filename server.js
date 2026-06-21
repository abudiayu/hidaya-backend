const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json({ limit: '20mb' }));        // large enough for base64 docs
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Health check (also handles root / for Render health pings) ───────────────
app.get('/', (_, res) =>
  res.json({ success: true, data: { message: 'Hidaya API running ✅', version: '2.0' } })
);
app.get('/api/health', (_, res) =>
  res.json({ success: true, data: { message: 'Hidaya API running ✅' } })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/students',    require('./routes/students'));
app.use('/api/teachers',    require('./routes/teachers'));
app.use('/api/assistants',  require('./routes/assistants'));
app.use('/api/tasks',       require('./routes/tasks'));
app.use('/api/payments',    require('./routes/payments'));
app.use('/api/results',     require('./routes/results'));
app.use('/api/attendance',  require('./routes/attendance'));
app.use('/api/topics',      require('./routes/topics'));
app.use('/api/timetable',   require('./routes/timetable'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/zakat',       require('./routes/zakat'));
app.use('/api/settings',    require('./routes/settings'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Hidaya backend running → http://localhost:${PORT}`)
);
