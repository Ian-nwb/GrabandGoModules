import { PrismaClient } from '@prisma/client';

// Initialize the Prisma Client
const prisma = new PrismaClient({
  // Log queries during development to help you debug
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * We export the single instance of the client.
 * Your feature services (like auth.service.js) will import this 
 * to interact with the database.
 */
export default prisma;