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
const prisma = require('./utils/prisma');

// use render port if available, otherwise default to 5001
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () =>
  console.log(`API running on port ${PORT} (docs: http://localhost:${PORT}/api/docs)`),
);

// Clean shutdown. Render sends SIGTERM before replacing this server on every deploy,
// and Ctrl+C sends SIGINT locally. Stop accepting new requests, let the ones already
// running finish, close the database connection, then exit.
function shutdown(signal) {
  console.log(`${signal} received: finishing current requests, then stopping.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Safety net: if something hangs, don't wait forever
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
