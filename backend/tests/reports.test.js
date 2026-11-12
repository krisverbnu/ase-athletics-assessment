// Scouting reports: everyone logged in can read them, but only the scout who
// wrote a report can change or delete it.
jest.mock('../src/utils/prisma', () => ({
  player: { findUnique: jest.fn() },
  scoutReport: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
const request = require('supertest');
const prisma = require('../src/utils/prisma');
const app = require('../src/app');
const { authAs } = require('./helpers');

const author = { id: 1, email: 'demo@ase-athletics.com', name: 'Demo Scout' };
const otherScout = { id: 2, email: 'other@ase-athletics.com', name: 'Other Scout' };

const ratings = Object.fromEntries(
  [
    'technical',
    'physical',
    'mental',
    'tactical',
    'finishing',
    'passing',
    'dribbling',
    'defending',
    'leadership',
    'workRate',
    'overallRating',
  ].map((k) => [k, 8]),
);
const newReport = { playerId: 5, matchDate: '2025-05-10', opponent: 'Arsenal', recommendation: 'MONITOR', ...ratings };

beforeEach(() => {
  jest.clearAllMocks();
  prisma.scoutReport.findUnique.mockResolvedValue({ scoutId: author.id }); // the report belongs to "author"
});

test('a new report is saved under the logged-in scout, whatever the request says', async () => {
  prisma.player.findUnique.mockResolvedValue({ id: 5 });
  prisma.scoutReport.create.mockImplementation(({ data }) => Promise.resolve({ id: 10, ...data }));

  const res = await request(app)
    .post('/api/reports')
    .set(authAs(author))
    .send({ ...newReport, scoutId: 999 });

  expect(res.status).toBe(201);
  expect(prisma.scoutReport.create.mock.calls[0][0].data.scoutId).toBe(author.id);
});

test('a report on a player who does not exist is rejected', async () => {
  prisma.player.findUnique.mockResolvedValue(null);
  const res = await request(app).post('/api/reports').set(authAs(author)).send(newReport);
  expect(res.status).toBe(400);
  expect(prisma.scoutReport.create).not.toHaveBeenCalled();
});

test('ratings outside 1 to 10 are rejected', async () => {
  const res = await request(app)
    .post('/api/reports')
    .set(authAs(author))
    .send({ ...newReport, overallRating: 11 });
  expect(res.status).toBe(400);
  expect(res.body.error.details[0].field).toBe('overallRating');
});

test('the author can edit their report', async () => {
  prisma.scoutReport.update.mockResolvedValue({ id: 10, overallRating: 9 });
  const res = await request(app).put('/api/reports/10').set(authAs(author)).send({ overallRating: 9 });
  expect(res.status).toBe(200);
});

test('another scout cannot edit it', async () => {
  const res = await request(app).put('/api/reports/10').set(authAs(otherScout)).send({ overallRating: 1 });
  expect(res.status).toBe(403);
  expect(prisma.scoutReport.update).not.toHaveBeenCalled();
});

test('another scout cannot delete it', async () => {
  const res = await request(app).delete('/api/reports/10').set(authAs(otherScout));
  expect(res.status).toBe(403);
  expect(prisma.scoutReport.delete).not.toHaveBeenCalled();
});

test('the author can delete it', async () => {
  const res = await request(app).delete('/api/reports/10').set(authAs(author));
  expect(res.status).toBe(204);
  expect(prisma.scoutReport.delete).toHaveBeenCalledWith({ where: { id: 10 } });
});

test('editing a report that does not exist gives a 404', async () => {
  prisma.scoutReport.findUnique.mockResolvedValue(null);
  const res = await request(app).put('/api/reports/999').set(authAs(author)).send({ overallRating: 9 });
  expect(res.status).toBe(404);
});
