import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Novotion CRM database with Pre-Sales Leads & After-Sales Client Support...');

  // 1. Seed Admin
  const adminPasswordHash = bcrypt.hashSync('AdminPassword123!', 10);
  await prisma.userAdmin.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
    },
  });

  // 2. Seed Default Access Keys
  const defaultKeys = [
    { key: 'LEAD_KEY_2026', role: 'LEAD_TEAM' },
    { key: 'SALES_KEY_2026', role: 'SALES_TEAM' },
    { key: 'MICHAEL_SALES_2026', role: 'SALES_TEAM' },
    { key: 'SARAH_SALES_2026', role: 'SALES_TEAM' },
  ];

  for (const k of defaultKeys) {
    await prisma.accessKey.upsert({
      where: { key: k.key },
      update: { role: k.role, isActive: true },
      create: {
        key: k.key,
        role: k.role,
        isActive: true,
      },
    });
  }

  // Clear existing records
  await prisma.salesInteraction.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.supportTicket.deleteMany({});

  const now = new Date();

  // Helper date generator
  const createDate = (year: number, month: number, day: number, hour: number = 10) => {
    return new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  };

  // 3. Seed Pre-Sales Leads (with stages, deal values, and follow-up dates)
  const preSalesLeads = [
    {
      candidateName: 'TechScale Dynamics Inc',
      phoneNumber: '+1 (415) 890-1122',
      email: 'marcus.vance@techscale.io',
      visaStatus: 'Citizen',
      linkedinUrl: 'https://linkedin.com/company/techscale',
      chatBrief: 'Enterprise cloud migration suite. Discussing multi-seat tier license.',
      jobProfile: 'Cloud Platform Architecture',
      createdByName: 'Prajakta Zode',
      temperature: 'Hot',
      stage: 'Won',
      dealValueUsd: 48500,
      currentStatus: 'Converted',
      salesRepName: 'Michael Scott',
      nextFollowUpDate: createDate(2026, 9, 1),
      createdAt: createDate(2026, 8, 4),
      feedback: 'Contract signed. Final placement/license fee secured at $48,500.',
    },
    {
      candidateName: 'Nexus AI Laboratories',
      phoneNumber: '+1 (206) 555-7890',
      email: 'ananya.sharma@nexusai.dev',
      visaStatus: 'Citizen',
      linkedinUrl: 'https://linkedin.com/company/nexusai',
      chatBrief: 'AI inference pipeline and LLM training compute cluster.',
      jobProfile: 'Machine Learning Infrastructure',
      createdByName: 'Alex Morgan',
      temperature: 'Hot',
      stage: 'Won',
      dealValueUsd: 32000,
      currentStatus: 'Converted',
      salesRepName: 'Sarah Jenkins',
      nextFollowUpDate: createDate(2026, 8, 30),
      createdAt: createDate(2026, 8, 6),
      feedback: 'Client accepted formal quotation and executed MSA.',
    },
    {
      candidateName: 'CyberVault Defense Systems',
      phoneNumber: '+1 (617) 443-9081',
      email: 'liam.oc@cybervault.net',
      visaStatus: 'GC',
      linkedinUrl: 'https://linkedin.com/company/cybervault',
      chatBrief: 'Zero-trust network access and SOC monitoring setup.',
      jobProfile: 'Cybersecurity Suite',
      createdByName: 'Prajakta Zode',
      temperature: 'Hot',
      stage: 'Proposal Sent',
      dealValueUsd: 26000,
      currentStatus: 'Unconverted (Active)',
      salesRepName: 'Michael Scott',
      nextFollowUpDate: createDate(2026, 8, 29),
      createdAt: createDate(2026, 8, 11),
      feedback: 'Proposal sent to CISO. Follow-up demo call scheduled for Thursday.',
    },
    {
      candidateName: 'DataFlow Stream Technologies',
      phoneNumber: '+1 (512) 789-2244',
      email: 'chloe.dubois@dataflow.ai',
      visaStatus: 'Citizen',
      linkedinUrl: 'https://linkedin.com/company/dataflow',
      chatBrief: 'Real-time Databricks lakehouse integration.',
      jobProfile: 'Big Data Pipeline',
      createdByName: 'Sunil Kumar',
      temperature: 'Hot',
      stage: 'Proposal Sent',
      dealValueUsd: 22000,
      currentStatus: 'Unconverted (Active)',
      salesRepName: 'Michael Scott',
      nextFollowUpDate: createDate(2026, 8, 28),
      createdAt: createDate(2026, 8, 14),
      feedback: 'Pricing tier presented. Awaiting budget committee signoff.',
    },
    {
      candidateName: 'Fintech Vertex Capital',
      phoneNumber: '+1 (312) 670-3399',
      email: 'derrick.hall@vertexcap.io',
      visaStatus: 'H1B',
      linkedinUrl: 'https://linkedin.com/company/vertexcapital',
      chatBrief: 'High frequency trading execution algorithms and low-latency APIs.',
      jobProfile: 'Quantitative Trading Suite',
      createdByName: 'Alex Morgan',
      temperature: 'Warm',
      stage: 'Contacted',
      dealValueUsd: 18500,
      currentStatus: 'Unconverted (Active)',
      salesRepName: 'Sarah Jenkins',
      nextFollowUpDate: createDate(2026, 8, 31),
      createdAt: createDate(2026, 8, 16),
      feedback: 'Initial pitch meeting completed. Technical specs shared.',
    },
    {
      candidateName: 'DevOpsStream Global',
      phoneNumber: '+1 (408) 991-8844',
      email: 'kavita.patel@devopsstream.com',
      visaStatus: 'Citizen',
      linkedinUrl: 'https://linkedin.com/company/devopsstream',
      chatBrief: 'Multi-region Kubernetes auto-scaling orchestration.',
      jobProfile: 'DevOps Infrastructure',
      createdByName: 'Prajakta Zode',
      temperature: 'Warm',
      stage: 'Contacted',
      dealValueUsd: 16500,
      currentStatus: 'Unconverted (Active)',
      salesRepName: 'Michael Scott',
      nextFollowUpDate: createDate(2026, 9, 2),
      createdAt: createDate(2026, 8, 18),
      feedback: 'Discussion on implementation timeline and SLA expectations.',
    },
    {
      candidateName: 'OmniCloud Microservices',
      phoneNumber: '+1 (212) 800-4521',
      email: 'ethan.wright@omnicloud.co',
      visaStatus: 'Citizen',
      linkedinUrl: 'https://linkedin.com/company/omnicloud',
      chatBrief: 'Serverless event streaming platform evaluation.',
      jobProfile: 'Cloud Platform Solutions',
      createdByName: 'Deep Patel',
      temperature: 'Warm',
      stage: 'New',
      dealValueUsd: 14000,
      currentStatus: 'Unconverted (Active)',
      salesRepName: 'Alex Rivera',
      nextFollowUpDate: createDate(2026, 8, 27),
      createdAt: createDate(2026, 8, 19),
      feedback: 'Inbound lead received through website contact form.',
    },
    {
      candidateName: 'Legacy Core Banking Corp',
      phoneNumber: '+1 (206) 912-3344',
      email: 'nadia.volkova@corebank.tech',
      visaStatus: 'GC',
      linkedinUrl: 'https://linkedin.com/company/corebanking',
      chatBrief: 'Mainframe modernization project.',
      jobProfile: 'Financial Core Systems',
      createdByName: 'Sunil Kumar',
      temperature: 'Warm',
      stage: 'Lost',
      dealValueUsd: 17500,
      currentStatus: 'Lost',
      salesRepName: 'Sarah Jenkins',
      nextFollowUpDate: null,
      createdAt: createDate(2026, 8, 12),
      feedback: 'Chose incumbent vendor. Lead marked as Lost.',
    },
    {
      candidateName: 'Alpha Logistics Tech',
      phoneNumber: '+1 (773) 402-9911',
      email: 'jason.becker@alphalogistics.org',
      visaStatus: 'Citizen',
      linkedinUrl: 'https://linkedin.com/company/alphalogistics',
      chatBrief: 'Fleet telematics and route optimization engine.',
      jobProfile: 'Logistics AI Suite',
      createdByName: 'Prajakta Zode',
      temperature: 'Cold',
      stage: 'New',
      dealValueUsd: 12000,
      currentStatus: 'No Response',
      salesRepName: 'Michael Scott',
      nextFollowUpDate: null,
      createdAt: createDate(2026, 8, 8),
      feedback: 'Sent 3 automated intro emails, no response received.',
    },
  ];

  for (const leadData of preSalesLeads) {
    const { feedback, ...fields } = leadData;
    const created = await prisma.lead.create({
      data: {
        ...fields,
        isCold: fields.temperature === 'Cold',
      },
    });

    await prisma.salesInteraction.create({
      data: {
        leadId: created.id,
        salesRepName: created.salesRepName || 'Michael Scott',
        status: created.stage === 'Won' ? 'Converted' : 
                created.stage === 'Lost' ? 'Not Interested' : 
                created.currentStatus === 'No Response' ? 'No Response' : 'Interested',
        candidateFeedback: feedback,
        updatedAt: created.createdAt,
      },
    });
  }

  // 4. Seed After-Sales Support & Client Accounts (STRICTLY NO DEAL VALUES)
  const afterSalesSupportData = [
    {
      clientName: 'Apex Health Systems',
      contactPerson: 'Dr. Rebecca Stern',
      email: 'rstern@apexhealth.org',
      phone: '+1 (415) 332-9011',
      accountStatus: 'Active',
      ticketSubject: 'FHIR API Endpoint SSL Certificate Renewal',
      description: 'Production HL7/FHIR gateway SSL certificate expires in 10 days. Need rotation without API downtime.',
      priority: 'High',
      assignedAgent: 'David Chen (DevOps Support)',
      status: 'In Progress',
      resolutionDate: createDate(2026, 8, 28),
      activityLogs: 'Certificate bundle generated in DigiCert. Maintenance window set for tonight 11:00 PM EST.',
      createdAt: createDate(2026, 8, 20),
    },
    {
      clientName: 'BluePeak Media Networks',
      contactPerson: 'Carlos Delgado',
      email: 'carlos.d@bluepeak.tv',
      phone: '+1 (212) 551-8890',
      accountStatus: 'Onboarding',
      ticketSubject: 'SSO Okta SAML 2.0 Integration Setup',
      description: 'Provisioning initial 120 user accounts and mapping active directory groups to CRM roles.',
      priority: 'Medium',
      assignedAgent: 'Elena Rostova (Integration Engineer)',
      status: 'Open',
      resolutionDate: createDate(2026, 8, 29),
      activityLogs: 'Metadata XML uploaded to Okta. Waiting for customer IT admin verification test.',
      createdAt: createDate(2026, 8, 22),
    },
    {
      clientName: 'Vanguard Retail Chain',
      contactPerson: 'Miranda Hobbs',
      email: 'm.hobbs@vanguardretail.com',
      phone: '+1 (312) 440-1299',
      accountStatus: 'In Support',
      ticketSubject: 'POS Inventory Webhook Latency Spikes',
      description: 'Occasional 3-second delay during peak 12:00 PM checkout spikes across Midwest stores.',
      priority: 'High',
      assignedAgent: 'Alex Rivera (Tier 3 Support)',
      status: 'In Progress',
      resolutionDate: createDate(2026, 8, 27),
      activityLogs: 'Redis cache cluster capacity increased to 8GB. Query indexing deployed to DB replica.',
      createdAt: createDate(2026, 8, 24),
    },
    {
      clientName: 'Solstice Renewable Energy',
      contactPerson: 'Hans Gruber',
      email: 'h.gruber@solstice-energy.de',
      phone: '+49 89 2311 4455',
      accountStatus: 'Renewal Due',
      ticketSubject: 'Annual SLA Review & Dedicated Support Tier Upgrade',
      description: 'Customer annual service agreement up for renewal on Sept 15. Reviewing 24/7 incident response add-on.',
      priority: 'Medium',
      assignedAgent: 'Sarah Jenkins (Account Manager)',
      status: 'Open',
      resolutionDate: createDate(2026, 9, 5),
      activityLogs: 'Usage analytics report shared with client executive team.',
      createdAt: createDate(2026, 8, 15),
    },
    {
      clientName: 'AeroSpace Horizon Ltd',
      contactPerson: 'Flight Ops Support',
      email: 'ops@aerospacehorizon.co.uk',
      phone: '+44 20 7946 0912',
      accountStatus: 'Active',
      ticketSubject: 'Quarterly Automated Security Audit Report',
      description: 'Provide SOC2 compliance penetration test summary and data encryption audit logs.',
      priority: 'Low',
      assignedAgent: 'David Chen (DevOps Support)',
      status: 'Resolved',
      resolutionDate: createDate(2026, 8, 25),
      activityLogs: 'Audit PDF generated and securely transmitted via encrypted portal.',
      createdAt: createDate(2026, 8, 10),
    },
    {
      clientName: 'Beacon Financial Trust',
      contactPerson: 'Anthony Davis',
      email: 'a.davis@beaconft.com',
      phone: '+1 (617) 229-8700',
      accountStatus: 'Active',
      ticketSubject: 'Custom Daily CSV Export Automation',
      description: 'Configure automated daily SFTP export of reconciliation logs at 00:00 UTC.',
      priority: 'Low',
      assignedAgent: 'Elena Rostova (Integration Engineer)',
      status: 'Closed',
      resolutionDate: createDate(2026, 8, 21),
      activityLogs: 'Cron task configured and tested with 100% delivery verification.',
      createdAt: createDate(2026, 8, 5),
    },
  ];

  for (const ticket of afterSalesSupportData) {
    await prisma.supportTicket.create({
      data: ticket,
    });
  }

  console.log('Seeded ' + preSalesLeads.length + ' Pre-Sales Leads and ' + afterSalesSupportData.length + ' After-Sales Support Tickets.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
