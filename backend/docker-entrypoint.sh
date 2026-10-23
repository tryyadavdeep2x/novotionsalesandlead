#!/bin/sh
set -e

echo '[Novotion API] Checking database schema with Prisma db push...'
npx prisma db push --skip-generate

echo '[Novotion API] Checking initial database seed...'
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const adminCount = await prisma.userAdmin.count();
    if (adminCount === 0) {
      console.log('[Novotion API] No admin user detected. Running prisma:seed...');
      process.exit(42);
    } else {
      console.log('[Novotion API] Database already initialized with ' + adminCount + ' admin(s). Skipping seed.');
      process.exit(0);
    }
  } catch (err) {
    console.error('[Novotion API] Error checking database status:', err.message);
    process.exit(42);
  } finally {
    await prisma['$disconnect']().catch(() => {});
  }
}
check();
" || npm run prisma:seed

echo '[Novotion API] Starting application server...'
exec "$@"