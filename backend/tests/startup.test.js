// startup check: the server shouldn't start if a required setting is missing
const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

const INDEX = path.join(__dirname, '..', 'src', 'index.js');

// run index.js as its own process with only the settings we pass in
// cwd is a temp folder so dotenv can't fill the gaps from backend/.env
function startServer(settings) {
  return spawnSync(process.execPath, [INDEX], {
    cwd: os.tmpdir(),
    env: { PATH: process.env.PATH, ...settings },
    encoding: 'utf8',
    timeout: 10000,
  });
}

test('refuses to start and names every missing setting', () => {
  const result = startServer({ JWT_SECRET: 'x' });
  expect(result.status).toBe(1); // 1 = stopped because of an error
  expect(result.stderr).toContain('Missing environment variables: DATABASE_URL, CLIENT_URL');
});

test('refuses to start with nothing set', () => {
  const result = startServer({});
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('DATABASE_URL, JWT_SECRET, CLIENT_URL');
});
