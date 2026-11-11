// Load secrets from the .env file into process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Only let our own frontend call this API (CLIENT_URL is set on Render)
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Read JSON request bodies (e.g. a new player sent from a form)
app.use(express.json());

// Health check: a simple "are you alive?" route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Render picks the port itself; locally we use 5001 (macOS AirPlay already uses 5000)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
