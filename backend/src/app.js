// Builds the Express app. index.js starts it; tests import it without starting a server.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const openapi = require('./docs/openapi');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (e.g. stops the site being embedded in other pages)
app.use(helmet());

// Only our frontend(s) may call the API. CLIENT_URL can list several, comma-separated.
// A browser's origin never ends in "/", so trailing slashes are removed to avoid a silent mismatch.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : '*' }));

// Read JSON bodies, max 100 kB so nobody can flood us with huge requests
app.use(express.json({ limit: '100kb' }));

// Interactive API documentation at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'ASE Athletics API' }));
app.get('/', (req, res) => res.json({ name: 'ASE Athletics API', docs: '/api/docs', health: '/api/health' }));

app.use('/api', routes);

// Anything not matched above: 404, then the error handler formats every error
app.use(notFound);
app.use(errorHandler);

module.exports = app;
