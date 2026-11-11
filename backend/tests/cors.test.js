// CORS: the API must accept the frontend's address even if CLIENT_URL was saved
// with a trailing slash (a real bug found on the live site)
jest.mock('../src/utils/prisma', () => ({}));
process.env.CLIENT_URL = 'https://ase-athletics-assessment-delta.vercel.app/ , http://localhost:5173';
const request = require('supertest');
const app = require('../src/app');

test('allows the frontend even when CLIENT_URL ends with a slash', async () => {
  const res = await request(app).options('/api/auth/login')
    .set('Origin', 'https://ase-athletics-assessment-delta.vercel.app')
    .set('Access-Control-Request-Method', 'POST');
  expect(res.headers['access-control-allow-origin']).toBe('https://ase-athletics-assessment-delta.vercel.app');
});

test('allows every address in the comma-separated list', async () => {
  const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
  expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
});

test('blocks any other website', async () => {
  const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
  expect(res.headers['access-control-allow-origin']).toBeUndefined();
});
