import { PrismaClient } from '@prisma/client';
import path from 'path';

const newKeys = [
  { key: 'ShubhamNovotion2027', role: 'LEAD_TEAM' },
  { key: 'Nehabhoyar2027', role: 'LEAD_TEAM' },
  { key: 'Prajaktanovotion2027', role: 'LEAD_TEAM' },
  { key: 'SALES_KEY_2026', role: 'SALES_TEAM' },
  { key: 'LEAD_KEY_2026', role: 'LEAD_TEAM' },
  { key: 'MICHAEL_SALES_2026', role: 'SALES_TEAM' },
  { key: 'SARAH_SALES_2026', role: 'SALES_TEAM' }
];

const targetDbs = [
  'backend/prisma/dev.db',
  'functions/dev.db',
  'functions/prisma/dev.db',
  'functions/prisma/prisma/dev.db'
];

async function addKeys() {
  for (const rel of targetDbs) {
    const full = path.resolve(rel);
    console.log(`\nUpdating DB: ${rel}`);
    try {
      const prisma = new PrismaClient({ datasources: { db: { url: `file:${full}` } } });
      
      for (const item of newKeys) {
        const existing = await prisma.accessKey.findUnique({ where: { key: item.key } });
        if (!existing) {
          const created = await prisma.accessKey.create({
            data: {
              key: item.key,
              role: item.role,
              isActive: true,
            }
          });
          console.log(`  + Created key: ${created.key} (${created.role})`);
        } else {
          await prisma.accessKey.update({
            where: { key: item.key },
            data: { isActive: true, role: item.role }
          });
          console.log(`  ✓ Updated/verified key: ${item.key} (${item.role})`);
        }
      }
      
      const all = await prisma.accessKey.findMany();
      console.log(`Total keys now in ${rel}: ${all.length}`);
      await prisma.$disconnect();
    } catch (err) {
      console.error(`Error with ${rel}:`, err.message);
    }
  }
}

addKeys().catch(console.error);
