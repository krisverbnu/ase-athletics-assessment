// Calls the real Express app over HTTP (supertest), with the database replaced by a
// fake. Checks the things every request depends on: login protection, input
// validation and the error format.
jest.mock('../src/utils/prisma', () => ({
  player: { findMany: jest.fn(), count: jest.fn() },
  user: { findUnique: jest.fn() },
  $transaction: jest.fn((queries) => Promise.all(queries)),
}));
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');
const app = require('../src/app');

const token = jwt.sign({ sub: 1, email: 'demo@ase-athletics.com', name: 'Demo Scout' }, process.env.JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

describe('API', () => {
  test('health check is public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('player list needs a login token', async () => {
    const res = await request(app).get('/api/players');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/log in/i);
  });

  test('a fake or expired token is rejected', async () => {
    const res = await request(app).get('/api/players').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('returns players with pagination when logged in', async () => {
    prisma.player.findMany.mockResolvedValue([{ id: 1, name: 'Harry Kane' }]);
    prisma.player.count.mockResolvedValue(1);
    const res = await request(app).get('/api/players?page=1&limit=20').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Harry Kane');
  });

  test('rejects bad filters with a 400 and the field that is wrong', async () => {
    const res = await request(app).get('/api/players?position=Striker').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('position');
  });

  test('login validates the email before touching the database', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toContain('email');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test('unknown email and wrong password get the same message', async () => {
    // Same answer either way, so nobody can use the login form to find out who has an account
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever1' });

    prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'demo@ase-athletics.com', passwordHash: bcrypt.hashSync('demo123', 4) });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'demo@ase-athletics.com', password: 'wrong-password' });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  test('unknown routes return a 404 in the standard error format', async () => {
    const res = await request(app).get('/api/nope').set(auth);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error.message');
  });
});
