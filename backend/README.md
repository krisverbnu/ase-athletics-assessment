# Backend

Express 5 + Prisma API for the ASE Athletics scouting platform.

See the [main README](../README.md) for features, setup, tests and decisions, and [docs/api-documentation.md](../docs/api-documentation.md) for every endpoint.

```bash
npm install
npm run dev            # http://localhost:5001 (needs backend/.env, see .env.example)
npm run db:migrate     # create the tables
npm run db:seed        # load ASE's data and the demo account (clears existing data)
npm test               # Jest + Supertest
npm run lint
```
