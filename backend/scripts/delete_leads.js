import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("Starting deletion of all leads and interactions...");

  const countInteractionsBefore = await prisma.salesInteraction.count();
  const countLeadsBefore = await prisma.lead.count();
  console.log(`Found ${countLeadsBefore} leads and ${countInteractionsBefore} sales interactions.`);

  const deletedInteractions = await prisma.salesInteraction.deleteMany({});
  console.log(`Deleted ${deletedInteractions.count} sales interactions.`);

  const deletedLeads = await prisma.lead.deleteMany({});
  console.log(`Deleted ${deletedLeads.count} leads.`);

  const countLeadsAfter = await prisma.lead.count();
  const countInteractionsAfter = await prisma.salesInteraction.count();
  const countAdmins = await prisma.userAdmin.count();
  const countKeys = await prisma.accessKey.count();

  console.log("--- Status after deletion ---");
  console.log(`Remaining leads: ${countLeadsAfter}`);
  console.log(`Remaining interactions: ${countInteractionsAfter}`);
  console.log(`Admin users preserved: ${countAdmins}`);
  console.log(`Access keys preserved: ${countKeys}`);
}

run()
  .catch((err) => {
    console.error("Error deleting leads:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
