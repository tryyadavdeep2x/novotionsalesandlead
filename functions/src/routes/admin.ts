import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Apply ADMIN role guard to all routes in this router
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

// Zod schema for Access Key creation
const keyCreateSchema = z.object({
  key: z.string().min(4, 'Key must be at least 4 characters'),
  role: z.enum(['LEAD_TEAM', 'SALES_TEAM']),
});

// Zod schema for Access Key update
const keyUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['LEAD_TEAM', 'SALES_TEAM']).optional(),
});

// List all Access Keys
router.get('/keys', async (req, res): Promise<any> => {
  try {
    const keys = await prisma.accessKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(keys);
  } catch (error) {
    console.error('Admin fetch keys error:', error);
    return res.status(500).json({ error: 'Failed to fetch access keys' });
  }
});

// Create Access Key
router.post('/keys', async (req, res): Promise<any> => {
  const parseResult = keyCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(', ') });
  }

  try {
    const cleanKey = parseResult.data.key.trim();
    const existing = await prisma.accessKey.findUnique({
      where: { key: cleanKey },
    });

    if (existing) {
      return res.status(409).json({ error: 'Access Key already exists. Please choose a unique key string.' });
    }

    const newKey = await prisma.accessKey.create({
      data: {
        ...parseResult.data,
        key: cleanKey,
      },
    });

    return res.status(201).json(newKey);
  } catch (error) {
    console.error('Admin create key error:', error);
    return res.status(500).json({ error: 'Failed to create access key' });
  }
});

// Update Access Key status/role
router.put('/keys/:id', async (req, res): Promise<any> => {
  const { id } = req.params;
  const parseResult = keyUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(', ') });
  }

  try {
    const updatedKey = await prisma.accessKey.update({
      where: { id: String(id) },
      data: parseResult.data,
    });
    return res.json(updatedKey);
  } catch (error) {
    console.error('Admin update key error:', error);
    return res.status(500).json({ error: 'Failed to update access key' });
  }
});

// Delete Access Key
router.delete('/keys/:id', async (req, res): Promise<any> => {
  const { id } = req.params;

  try {
    await prisma.accessKey.delete({
      where: { id: String(id) },
    });
    return res.json({ message: 'Access Key deleted successfully' });
  } catch (error) {
    console.error('Admin delete key error:', error);
    return res.status(500).json({ error: 'Failed to delete access key' });
  }
});

// Helper for generating sample leads pool if needed
const SAMPLE_COMPANIES = [
  'Nexis Cloud Systems', 'Acuity Tech Global', 'Vanguard Dataworks', 'Beacon Financial Systems',
  'Summit DevOps Corp', 'OmniScale Robotics', 'Crestline AI Labs', 'Starlight Logistics Tech',
  'Pulse Health Informatics', 'Quantum Secure Networks', 'Apex Horizon Energy', 'BlueWave Payments',
  'Vertex Commerce Cloud', 'Catalyst IoT Solutions', 'Hyperion Media Suite', 'Frontier SaaS Holdings',
  'Zenith BioTech Corp', 'Atlas Cyber Defense', 'Horizon Telematics', 'Synergy ERP Platforms'
];

const SAMPLE_JOB_PROFILES = [
  'Cloud Infrastructure Modernization', 'Kubernetes Architecture', 'Cybersecurity Threat Defense',
  'Enterprise Data Pipeline', 'AI/ML Model Deployment', 'Quantitative Financial Engine',
  'Healthcare HL7 API Integration', 'Supply Chain Telematics AI', 'Core Banking Automation'
];

const FIRST_NAMES = ['Ethan', 'Sophia', 'Lucas', 'Emma', 'Aiden', 'Olivia', 'Mason', 'Isabella', 'Liam', 'Mia', 'Noah', 'Ava', 'Jackson', 'Harper', 'Oliver', 'Amelia'];
const LAST_NAMES = ['Wright', 'Chen', 'Vance', 'Sharma', 'Patel', 'Hall', 'Rivera', 'Dubois', 'Becker', 'Volkova', 'Stern', 'Jenkins', 'Scott', 'Davis', 'Taylor', 'Miller'];

function generateRandomSampleLeads(count: number) {
  const generated: any[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const company = SAMPLE_COMPANIES[Math.floor(Math.random() * SAMPLE_COMPANIES.length)] + ' ' + (Math.floor(Math.random() * 900) + 100);
    const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`;
    const phone = `+1 (${Math.floor(Math.random() * 800) + 200}) ${Math.floor(Math.random() * 800) + 200}-${Math.floor(Math.random() * 8999) + 1000}`;
    const tempChoices: ('Hot' | 'Warm' | 'Cold')[] = ['Hot', 'Warm', 'Warm', 'Cold'];
    const temp = tempChoices[Math.floor(Math.random() * tempChoices.length)];
    const dealValue = Math.floor(Math.random() * 25 + 10) * 1000; // $10,000 to $35,000

    generated.push({
      candidateName: company,
      email,
      phoneNumber: phone,
      visaStatus: Math.random() > 0.3 ? 'Citizen' : 'GC',
      linkedinUrl: `https://linkedin.com/company/${domain.split('.')[0]}`,
      chatBrief: `Automated inquiry for enterprise ${SAMPLE_JOB_PROFILES[i % SAMPLE_JOB_PROFILES.length]}.`,
      jobProfile: SAMPLE_JOB_PROFILES[i % SAMPLE_JOB_PROFILES.length],
      createdByName: 'Lead Generation Team',
      temperature: temp,
      isCold: temp === 'Cold',
      dealValueUsd: dealValue,
      stage: 'New',
      currentStatus: 'No Response',
    });
  }
  return generated;
}

// ⚡ 1-CLICK BATCH RANDOM LEAD ALLOCATION (20 Leads / Rep)
router.post('/leads/batch-allocate', async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { 
      leadsPerRep = 20, 
      reps = ['Michael Scott', 'Alex Rivera', 'Sarah Jenkins', 'David Chen'],
      mode = 'all_leads', // 'unassigned_only' | 'all_leads'
      autoGenerateIfShort = true
    } = req.body;

    const requestedReps: string[] = Array.isArray(reps) && reps.length > 0 
      ? reps 
      : ['Michael Scott', 'Alex Rivera', 'Sarah Jenkins', 'David Chen'];

    const targetPerRep = Math.max(1, parseInt(String(leadsPerRep), 10) || 20);
    const totalRequired = requestedReps.length * targetPerRep;

    // 1. Check existing leads in DB
    let poolQuery: any = { stage: { not: 'Won' } }; // Only active leads that aren't already converted/won
    if (mode === 'unassigned_only') {
      poolQuery = { ...poolQuery, salesRepName: null };
    }

    let candidateLeads = await prisma.lead.findMany({
      where: poolQuery,
      select: { id: true, candidateName: true, salesRepName: true },
    });

    // 2. If short of leads and autoGenerateIfShort is enabled, provision fresh pool leads
    if (candidateLeads.length < totalRequired && autoGenerateIfShort) {
      const deficit = totalRequired - candidateLeads.length + 10; // add a few extra buffer
      console.log(`[Batch Allocate] Provisioning ${deficit} fresh leads to fulfill ${totalRequired} quota...`);
      const newLeadsData = generateRandomSampleLeads(deficit);

      for (const item of newLeadsData) {
        const created = await prisma.lead.create({ data: item });
        candidateLeads.push({ id: created.id, candidateName: created.candidateName, salesRepName: created.salesRepName });
      }
    }

    // 3. Fisher-Yates Random Shuffle of candidate leads
    for (let i = candidateLeads.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidateLeads[i], candidateLeads[j]] = [candidateLeads[j], candidateLeads[i]];
    }

    // 4. Allocate targetPerRep leads to each sales representative
    const allocationSummary: Record<string, number> = {};
    let currentIndex = 0;
    let totalAllocated = 0;

    for (const rep of requestedReps) {
      const repBatch = candidateLeads.slice(currentIndex, currentIndex + targetPerRep);
      currentIndex += repBatch.length;
      allocationSummary[rep] = repBatch.length;
      totalAllocated += repBatch.length;

      for (const lead of repBatch) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            salesRepName: rep,
            currentStatus: 'No Response',
            stage: 'New',
            statusUpdatedAt: new Date(),
          },
        });

        await prisma.salesInteraction.create({
          data: {
            leadId: lead.id,
            salesRepName: req.user?.identifier || 'Admin',
            status: 'No Response',
            candidateFeedback: `[Admin 1-Click Allocation] Randomly allocated ${targetPerRep} leads batch to ${rep}.`,
          },
        });
      }
    }

    return res.json({
      success: true,
      message: `Successfully allocated ${totalAllocated} leads across ${requestedReps.length} Sales Representatives (${targetPerRep} leads each)!`,
      totalAllocated,
      leadsPerRep: targetPerRep,
      repsCount: requestedReps.length,
      allocationSummary,
      remainingPool: candidateLeads.length - currentIndex,
    });
  } catch (error) {
    console.error('Batch allocate error:', error);
    return res.status(500).json({ error: 'Failed to complete batch random lead allocation' });
  }
});

// Admin Lead Full Edit / Reassign
router.put('/leads/:id', async (req: AuthenticatedRequest, res): Promise<any> => {
  const { id } = req.params;
  try {
    const lead = await prisma.lead.findUnique({ where: { id: String(id) } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const {
      candidateName,
      phoneNumber,
      email,
      visaStatus,
      linkedinUrl,
      linkedInUrl,
      jobProfile,
      jobTitle,
      sourcedBy,
      sourcedFrom,
      attemptedBy,
      temperature, // "Hot" | "Warm" | "Cold"
      salesRepName, // Assigned Sales Specialist
      dealValueUsd,
      stage,
      currentStatus,
      chatBrief,
      nextFollowUpDate,
    } = req.body;

    const dataToUpdate: any = {};
    if (candidateName !== undefined) dataToUpdate.candidateName = candidateName ? String(candidateName).trim() : '';
    if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber ? String(phoneNumber).trim() : '';
    if (email !== undefined) dataToUpdate.email = email ? String(email).trim() : '';
    if (visaStatus !== undefined) dataToUpdate.visaStatus = visaStatus ? String(visaStatus).trim() : '';

    const incomingLinkedin = linkedInUrl !== undefined ? linkedInUrl : linkedinUrl;
    if (incomingLinkedin !== undefined) {
      let cleanLi = incomingLinkedin ? String(incomingLinkedin).trim() : '';
      if (cleanLi && !cleanLi.startsWith('http://') && !cleanLi.startsWith('https://')) {
        cleanLi = `https://${cleanLi}`;
      }
      dataToUpdate.linkedinUrl = cleanLi;
      dataToUpdate.linkedInUrl = cleanLi;
    }

    const incomingJob = jobTitle !== undefined ? jobTitle : jobProfile;
    if (incomingJob !== undefined) {
      const cleanJob = incomingJob ? String(incomingJob).trim() : '';
      dataToUpdate.jobTitle = cleanJob;
      dataToUpdate.jobProfile = cleanJob;
    }

    if (sourcedBy !== undefined) {
      dataToUpdate.sourcedBy = sourcedBy ? String(sourcedBy).trim() : '';
      dataToUpdate.createdByName = dataToUpdate.sourcedBy;
    }
    if (sourcedFrom !== undefined) dataToUpdate.sourcedFrom = sourcedFrom ? String(sourcedFrom).trim() : '';
    if (attemptedBy !== undefined) {
      dataToUpdate.attemptedBy = attemptedBy ? String(attemptedBy).trim() : '';
      dataToUpdate.salesRepName = dataToUpdate.attemptedBy || null;
    }

    if (temperature !== undefined) {
      dataToUpdate.temperature = temperature;
      dataToUpdate.isCold = temperature === 'Cold';
    }
    if (salesRepName !== undefined && attemptedBy === undefined) {
      dataToUpdate.salesRepName = salesRepName ? String(salesRepName).trim() : null;
      dataToUpdate.attemptedBy = dataToUpdate.salesRepName || '';
    }
    if (dealValueUsd !== undefined) dataToUpdate.dealValueUsd = parseFloat(dealValueUsd) || 0;
    if (stage !== undefined) dataToUpdate.stage = stage;
    if (currentStatus !== undefined) dataToUpdate.currentStatus = currentStatus;
    if (chatBrief !== undefined) dataToUpdate.chatBrief = chatBrief ? String(chatBrief).trim() : '';
    if (nextFollowUpDate !== undefined) dataToUpdate.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;

    const updated = await prisma.lead.update({
      where: { id: String(id) },
      data: dataToUpdate,
      include: {
        interactions: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    // Timeline event for priority/assignment change
    const changes: string[] = [];
    if (temperature && temperature !== lead.temperature) changes.push(`priority temperature set to ${temperature}`);
    if (salesRepName && salesRepName !== lead.salesRepName) changes.push(`reassigned to ${salesRepName}`);

    if (changes.length > 0) {
      await prisma.salesInteraction.create({
        data: {
          leadId: String(id),
          salesRepName: req.user?.identifier || 'Admin',
          status: updated.currentStatus || 'Interested',
          candidateFeedback: `[Admin Update] ${changes.join(' and ')}.`,
        },
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Admin edit lead error:', error);
    return res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Admin Lead Delete
router.delete('/leads/:id', async (req, res): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.lead.delete({
      where: { id: String(id) },
    });
    return res.json({ message: 'Lead record deleted successfully' });
  } catch (error) {
    console.error('Admin delete lead error:', error);
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Get Dashboard Analytics Metrics
router.get('/metrics', async (req, res): Promise<any> => {
  try {
    const totalLeads = await prisma.lead.count();

    const leads = await prisma.lead.findMany({
      include: {
        interactions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    const statusCounts: Record<string, number> = {
      'Interested': 0,
      'Not Interested': 0,
      'No Response': 0,
      'Maybe Interested': 0,
      'Follow-Up Required': 0,
      'Converted': 0,
    };

    let convertedCount = 0;
    const profileCounts: Record<string, number> = {};
    const creatorCounts: Record<string, number> = {};

    leads.forEach((l) => {
      const profKey = l.jobTitle || l.jobProfile || 'General';
      const creatorKey = l.sourcedBy || l.createdByName || 'Lead Specialist';
      profileCounts[profKey] = (profileCounts[profKey] || 0) + 1;
      creatorCounts[creatorKey] = (creatorCounts[creatorKey] || 0) + 1;

      const latestStatus = l.interactions[0]?.status || l.currentStatus || 'No Response';
      if (statusCounts[latestStatus] !== undefined) {
        statusCounts[latestStatus]++;
      } else {
        statusCounts[latestStatus] = 1;
      }

      if (latestStatus === 'Converted' || l.stage === 'Won') {
        convertedCount++;
      }
    });

    const conversionRate = totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0;
    const hotLeadsCount = leads.filter(l => l.temperature === 'Hot').length;
    const warmLeadsCount = leads.filter(l => l.temperature === 'Warm' || (!l.temperature && !l.isCold)).length;
    const coldLeadsCount = leads.filter(l => l.temperature === 'Cold' || l.isCold).length;

    return res.json({
      totalLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
      hotLeadsCount,
      warmLeadsCount,
      coldLeadsCount,
      statusCounts,
      profileCounts,
      creatorCounts,
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

export default router;
