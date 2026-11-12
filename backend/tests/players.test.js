// Player create, edit and delete, with the database replaced by a fake
jest.mock('../src/utils/prisma', () => ({
  player: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
const request = require('supertest');
const prisma = require('../src/utils/prisma');
const app = require('../src/app');
const { authAs } = require('./helpers');

const auth = authAs({ id: 1, email: 'demo@ase-athletics.com', name: 'Demo Scout' });
const newPlayer = { name: 'Test Striker', position: 'Forward', age: 22, team: 'Getafe', nationality: 'Spain' };

// Prisma's own "record not found" error, which the error handler turns into a 404
const notFoundError = Object.assign(new Error('Record not found'), { code: 'P2025' });

beforeEach(() => jest.clearAllMocks());

test('creates a player and leaves an unknown market value empty, not 0', async () => {
  prisma.player.create.mockImplementation(({ data }) => Promise.resolve({ id: 91, ...data }));
  const res = await request(app).post('/api/players').set(auth).send(newPlayer);

  expect(res.status).toBe(201);
  const saved = prisma.player.create.mock.calls[0][0].data;
  expect(saved.goals).toBe(0); // counts default to 0...
  expect(saved.marketValue).toBeUndefined(); // ...but a missing value stays missing
});

test('lists every missing required field at once', async () => {
  const res = await request(app).post('/api/players').set(auth).send({ name: 'No Details' });
  expect(res.status).toBe(400);
  expect(res.body.error.details.map((d) => d.field)).toEqual(
    expect.arrayContaining(['position', 'age', 'team', 'nationality']),
  );
  expect(prisma.player.create).not.toHaveBeenCalled();
});

test('drops fields the API does not know about', async () => {
  prisma.player.create.mockImplementation(({ data }) => Promise.resolve({ id: 92, ...data }));
  await request(app)
    .post('/api/players')
    .set(auth)
    .send({ ...newPlayer, id: 1, isAdmin: true });
  const saved = prisma.player.create.mock.calls[0][0].data;
  expect(saved).not.toHaveProperty('isAdmin');
  expect(saved).not.toHaveProperty('id');
});

test('updates only the fields sent', async () => {
  prisma.player.update.mockResolvedValue({ id: 3, marketValue: 20_000_000 });
  const res = await request(app).put('/api/players/3').set(auth).send({ marketValue: 20_000_000 });
  expect(res.status).toBe(200);
  expect(prisma.player.update.mock.calls[0][0]).toMatchObject({ where: { id: 3 }, data: { marketValue: 20_000_000 } });
});

test('editing or deleting a player that does not exist gives a 404', async () => {
  prisma.player.update.mockRejectedValue(notFoundError);
  prisma.player.delete.mockRejectedValue(notFoundError);
  expect((await request(app).put('/api/players/999').set(auth).send({ age: 30 })).status).toBe(404);
  expect((await request(app).delete('/api/players/999').set(auth)).status).toBe(404);
});

test('deletes a player', async () => {
  prisma.player.delete.mockResolvedValue({});
  const res = await request(app).delete('/api/players/3').set(auth);
  expect(res.status).toBe(204);
});

test('rejects an id that is not a number', async () => {
  const res = await request(app).get('/api/players/abc').set(auth);
  expect(res.status).toBe(400);
});
