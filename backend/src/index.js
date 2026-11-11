// Starts the server. All the app setup lives in app.js.
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Add it to backend/.env (see .env.example).');
  process.exit(1);
}

const app = require('./app');

// Render picks the port itself; locally we use 5001 (macOS AirPlay already uses 5000)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API running on port ${PORT} (docs: http://localhost:${PORT}/api/docs)`));
