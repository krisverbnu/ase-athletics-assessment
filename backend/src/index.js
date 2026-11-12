// Start the server. Load the app in app.js.
require('dotenv').config();

//prevent login if secret is missing, check client and database urls too
// check before starting the server, so that the server doesn't start if the env vars are missing
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'];
const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Add them to backend/.env (see .env.example).`);
  process.exit(1);
}

const app = require('./app');

// use render port if available, otherwise default to 5001
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API running on port ${PORT} (docs: http://localhost:${PORT}/api/docs)`));
