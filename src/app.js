const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const routes = require('./routes');
const rateLimiter = require('./middleware/rateLimiter');
require('./services/mqttHandler'); // initialize mqtt handlers
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// ── CORS Configuration ──────────────────────────────────────
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins (useful for development)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// ── Request Logging ─────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(rateLimiter);
app.use(express.json());

// ── Swagger Dokumentasi API ──────────────────────────────────
const swaggerUiOptions = {
  customSiteTitle: 'EcoRoute API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #1a3c2e; }
    .swagger-ui .topbar-wrapper img { content: none; }
    .swagger-ui .topbar-wrapper::before {
      content: '🌿 EcoRoute API';
      color: white;
      font-size: 1.2rem;
      font-weight: bold;
    }
  `,
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api', routes);

// ── Test Endpoint (untuk debug) ──────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is responding!', timestamp: new Date().toISOString() });
});

// ── Generic Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Send appropriate status code
  const statusCode = err.status || err.statusCode || 500;
  const errorMessage = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({ 
    error: errorMessage,
    code: err.code,
    path: req.path,
  });
});

module.exports = app;
