// Guardrails on login and sign-up: rate limiting and the optional company-only sign-up
jest.mock('../src/utils/prisma', () => ({
  user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
}));
const request = require('supertest');
const prisma = require('../src/utils/prisma');
const app = require('../src/app');

const wrongLogin = (email, ip = '1.1.1.1') =>
  request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({ email, password: 'wrong-password' });

describe('login rate limit', () => {
  test('blocks an account after 10 wrong passwords, even from different IP addresses', async () => {
    for (let i = 0; i < 10; i += 1) {
      expect((await wrongLogin('target@example.com', `10.0.0.${i}`)).status).toBe(401);
    }
    const blocked = await wrongLogin('target@example.com', '10.0.0.99');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toMatch(/wait 15 minutes/);
  });

  test('other accounts are not affected', async () => {
    expect((await wrongLogin('someone-else@example.com')).status).toBe(401);
  });

  test('a blocked request never reaches the database', async () => {
    prisma.user.findUnique.mockClear();
    await wrongLogin('target@example.com');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('sign-up', () => {
  const signUp = (email, ip) => request(app).post('/api/auth/register').set('X-Forwarded-For', ip)
    .send({ name: 'Test Scout', email, password: 'password123' });

  beforeEach(() => {
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve({ id: 5, ...data }));
  });
  afterEach(() => { delete process.env.ALLOWED_EMAIL_DOMAINS; });

  test('anyone can register when no domain list is set (the assessment setup)', async () => {
    expect((await signUp('reviewer@gmail.com', '2.2.2.1')).status).toBe(201);
  });

  test('with a domain list, other emails are refused on the email field', async () => {
    process.env.ALLOWED_EMAIL_DOMAINS = 'aseathletics.com';
    const res = await signUp('outsider@gmail.com', '2.2.2.2');
    expect(res.status).toBe(403);
    expect(res.body.error.details[0].field).toBe('email');
    expect(res.body.error.message).toMatch(/@aseathletics\.com/);
  });

  test('with a domain list, club emails still work', async () => {
    process.env.ALLOWED_EMAIL_DOMAINS = ' @ASEathletics.com , ase.com';
    expect((await signUp('scout@aseathletics.com', '2.2.2.3')).status).toBe(201);
  });

  test('allows 5 sign-ups per connection per hour, then blocks', async () => {
    for (let i = 0; i < 5; i += 1) expect((await signUp(`bot${i}@example.com`, '3.3.3.3')).status).toBe(201);
    expect((await signUp('bot6@example.com', '3.3.3.3')).status).toBe(429);
    expect((await signUp('real@example.com', '4.4.4.4')).status).toBe(201); // a different visitor is fine
  });
});
