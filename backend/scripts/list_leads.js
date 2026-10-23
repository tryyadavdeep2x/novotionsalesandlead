import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const leads = await prisma.lead.findMany({
    select: { 
      id: true, 
      candidateName: true, 
      createdByName: true, 
      sourcedBy: true, 
      sourcedFrom: true,
      email: true, 
      createdAt: true 
    }
  });
  console.log("Total leads count:", leads.length);
  console.log("Leads summary:");
  leads.forEach((l, i) => {
    console.log(`${i + 1}. [${l.id}] Name: "${l.candidateName}" | Email: "${l.email}" | CreatedBy: "${l.createdByName}" | SourcedBy: "${l.sourcedBy}" | SourcedFrom: "${l.sourcedFrom}" | CreatedAt: ${l.createdAt.toISOString()}`);
  });
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
