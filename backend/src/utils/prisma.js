// One shared Prisma client for the whole app.
// Creating a new client per request would open too many database connections.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
