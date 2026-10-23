import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const leadCreateSchema = z.object({
  candidateName: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  visaStatus: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  jobProfile: z.string().optional().nullable(),
  linkedInUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  chatBrief: z.string().optional().nullable(),
  sourcedBy: z.string().optional().nullable(),
  sourcedFrom: z.string().optional().nullable(),
  attemptedBy: z.string().optional().nullable(),
  createdByName: z.string().optional().nullable(),
  temperature: z.enum(['Hot', 'Warm', 'Cold']).optional().nullable(),
  isCold: z.boolean().optional().nullable(),
  dealValueUsd: z.union([z.number(), z.string()]).optional().nullable(),
  salesRepName: z.string().optional().nullable(),
  salesRepId: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  stage: z.string().optional().nullable(),
  currentStatus: z.string().optional().nullable(),
}).passthrough();

const statusUpdateSchema = z.object({
  status: z.enum([
    'Interested',
    'Not Interested',
    'No Response',
    'Maybe Interested',
    'Follow-Up Required',
    'Converted',
    'Lost',
  ]),
  commentNotes: z.string().optional(),
  salesRepName: z.string().optional(),
});

// Month helper
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Create Lead (LEAD_TEAM, SALES_TEAM, ADMIN)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  const parseResult = leadCreateSchema.safeParse(req.body || {});

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(', ') });
  }

  const raw = parseResult.data;
  const resolvedTemp = raw.temperature || (raw.isCold ? 'Cold' : 'Warm');
  const resolvedIsCold = resolvedTemp === 'Cold';

  const candidateLinkedin = raw.linkedInUrl || raw.linkedinUrl || '';
  let cleanLinkedin = candidateLinkedin.trim();
  if (cleanLinkedin && !cleanLinkedin.startsWith('http://') && !cleanLinkedin.startsWith('https://')) {
    cleanLinkedin = `https://${cleanLinkedin}`;
  }

  const candidateJob = raw.jobTitle || raw.jobProfile || '';
  const resolvedSourcedBy = raw.sourcedBy || raw.createdByName || req.user?.identifier || 'Lead Specialist';
  const resolvedAttemptedBy = raw.attemptedBy || raw.salesRepName || null;

  try {
    const newLead = await prisma.lead.create({
      data: {
        candidateName: raw.candidateName ? raw.candidateName.trim() : (raw.email ? raw.email.split('@')[0] : 'New Lead'),
        phoneNumber: raw.phoneNumber ? raw.phoneNumber.trim() : '',
        email: raw.email ? raw.email.trim() : '',
        jobTitle: candidateJob ? candidateJob.trim() : '',
        jobProfile: candidateJob ? candidateJob.trim() : '',
        visaStatus: raw.visaStatus ? raw.visaStatus.trim() : 'Citizen',
        linkedInUrl: cleanLinkedin,
        linkedinUrl: cleanLinkedin,
        chatBrief: raw.chatBrief ? raw.chatBrief.trim() : '',
        sourcedBy: resolvedSourcedBy,
        sourcedFrom: raw.sourcedFrom ? raw.sourcedFrom.trim() : '',
        attemptedBy: resolvedAttemptedBy || '',
        createdByName: resolvedSourcedBy,
        salesRepName: resolvedAttemptedBy,
        temperature: resolvedTemp,
        isCold: resolvedIsCold,
        currentStatus: raw.currentStatus || 'No Response',
        stage: raw.stage || 'New',
        dealValueUsd: typeof raw.dealValueUsd === 'number' ? raw.dealValueUsd : (parseFloat(raw.dealValueUsd || '0') || 0),
        nextFollowUpDate: raw.nextFollowUpDate ? new Date(raw.nextFollowUpDate) : null,
      },
    });

    // Create initial timeline entry
    await prisma.salesInteraction.create({
      data: {
        leadId: newLead.id,
        salesRepName: newLead.attemptedBy || newLead.salesRepName || newLead.sourcedBy || newLead.createdByName || 'Lead Specialist',
        status: newLead.currentStatus || 'No Response',
        candidateFeedback: newLead.chatBrief ? `Lead registered: ${newLead.chatBrief}` : 'Initial lead registration into CRM.',
      },
    });

    return res.status(201).json(newLead);
  } catch (error) {
    console.error('Create lead error:', error);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
});

// View Leads (Authenticated users: LEAD_TEAM, SALES_TEAM, ADMIN)
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  const { creator, search, rep } = req.query;

  try {
    let whereCondition: any = {};

    if (req.user?.role === 'LEAD_TEAM' && creator) {
      whereCondition.createdByName = String(creator);
    }

    if (rep && String(rep) !== 'all' && String(rep) !== 'ALL') {
      whereCondition.salesRepName = String(rep);
    }

    if (search) {
      const q = String(search).toLowerCase();
      whereCondition.OR = [
        { candidateName: { contains: q } },
        { email: { contains: q } },
        { phoneNumber: { contains: q } },
        { jobProfile: { contains: q } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where: whereCondition,
      include: {
        interactions: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(leads);
  } catch (error) {
    console.error('Fetch leads error:', error);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Monthly Lead Aggregation (MUST BE PLACED BEFORE /:id)
router.get('/monthly', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { month, creator, temperature } = req.query;

    let targetMonth = 8;
    let targetYear = 2026;

    if (month && typeof month === 'string') {
      const parts = month.split('-');
      if (parts.length === 2) {
        targetMonth = parseInt(parts[0], 10) || 8;
        targetYear = parseInt(parts[1], 10) || 2026;
      }
    }

    const monthLabel = `${MONTH_NAMES[targetMonth - 1] || 'August'} ${targetYear}`;
    const monthCode = `${String(targetMonth).padStart(2, '0')}-${targetYear}`;

    // Calculate month start & end date
    const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Fetch all leads for this month or all leads if pool is smaller
    let allMonthLeads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        interactions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no leads exist for the exact month timestamp, fallback to all active leads so view is never empty
    if (allMonthLeads.length === 0) {
      allMonthLeads = await prisma.lead.findMany({
        include: {
          interactions: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const availableCreatorsSet = new Set<string>();
    allMonthLeads.forEach(l => {
      if (l.createdByName) availableCreatorsSet.add(l.createdByName);
    });
    const availableCreators = Array.from(availableCreatorsSet);

    // Tier aggregation
    const tierStats = {
      cold: { count: 0, dealValueUsd: 0, percentage: 0, converted: 0, inProgress: 0, lost: 0, noResponse: 0 },
      warm: { count: 0, dealValueUsd: 0, percentage: 0, converted: 0, inProgress: 0, lost: 0, noResponse: 0 },
      hot: { count: 0, dealValueUsd: 0, percentage: 0, converted: 0, inProgress: 0, lost: 0, noResponse: 0 },
    };

    const creatorMap: Record<string, { name: string; total: number; cold: number; warm: number; hot: number; totalValueUsd: number }> = {};

    allMonthLeads.forEach(l => {
      const t = (l.temperature || (l.isCold ? 'Cold' : 'Warm')).toLowerCase() as 'cold' | 'warm' | 'hot';
      const key = tierStats[t] ? t : 'warm';
      const val = l.dealValueUsd || 15000;

      tierStats[key].count++;
      tierStats[key].dealValueUsd += val;

      const st = l.currentStatus || 'No Response';
      if (st === 'Converted') tierStats[key].converted++;
      else if (st === 'Lost' || st === 'Not Interested') tierStats[key].lost++;
      else if (st === 'No Response') tierStats[key].noResponse++;
      else tierStats[key].inProgress++;

      const cName = l.createdByName || 'Lead Specialist';
      if (!creatorMap[cName]) {
        creatorMap[cName] = { name: cName, total: 0, cold: 0, warm: 0, hot: 0, totalValueUsd: 0 };
      }
      creatorMap[cName].total++;
      creatorMap[cName].totalValueUsd += val;
      if (key === 'cold') creatorMap[cName].cold++;
      else if (key === 'warm') creatorMap[cName].warm++;
      else if (key === 'hot') creatorMap[cName].hot++;
    });

    const totalCount = allMonthLeads.length || 1;
    tierStats.cold.percentage = Math.round((tierStats.cold.count / totalCount) * 100);
    tierStats.warm.percentage = Math.round((tierStats.warm.count / totalCount) * 100);
    tierStats.hot.percentage = Math.round((tierStats.hot.count / totalCount) * 100);

    const creatorBreakdown = Object.values(creatorMap).sort((a, b) => b.total - a.total);

    // Apply creator & temperature filters for filtered table
    let filteredLeads = allMonthLeads;
    if (creator && creator !== 'ALL') {
      filteredLeads = filteredLeads.filter(l => l.createdByName === String(creator));
    }
    if (temperature && temperature !== 'ALL') {
      filteredLeads = filteredLeads.filter(l => (l.temperature || (l.isCold ? 'Cold' : 'Warm')).toLowerCase() === String(temperature).toLowerCase());
    }

    return res.json({
      monthLabel,
      monthCode,
      totalMonthlyLeads: allMonthLeads.length,
      filteredCount: filteredLeads.length,
      tiers: tierStats,
      creatorBreakdown,
      availableCreators,
      leads: filteredLeads,
    });
  } catch (error) {
    console.error('Monthly leads aggregation error:', error);
    return res.status(500).json({ error: 'Failed to aggregate monthly leads' });
  }
});

// Get Single Lead with full timeline (PLACED AFTER /monthly)
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  const { id } = req.params;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: String(id) },
      include: {
        interactions: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    return res.json(lead);
  } catch (error) {
    console.error('Fetch lead detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch lead details' });
  }
});

// Real-Time Operational Status Update (SALES_TEAM & ADMIN)
router.put('/:id/status', authMiddleware, requireRole(['SALES_TEAM', 'ADMIN']), async (req: AuthenticatedRequest, res): Promise<any> => {
  const { id } = req.params;
  const parseResult = statusUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(', ') });
  }

  const { status, commentNotes, salesRepName } = parseResult.data;
  const author = salesRepName || req.user?.identifier || 'Sales Specialist';

  try {
    const lead = await prisma.lead.findUnique({ where: { id: String(id) } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updated = await prisma.lead.update({
      where: { id: String(id) },
      data: {
        currentStatus: status,
        statusUpdatedAt: new Date(),
        stage: status === 'Converted' ? 'Won' : status === 'Not Interested' ? 'Lost' : lead.stage,
      },
      include: {
        interactions: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    const noteText = commentNotes?.trim() 
      ? `Status updated to "${status}": ${commentNotes.trim()}`
      : `Operational status updated to "${status}"`;

    await prisma.salesInteraction.create({
      data: {
        leadId: String(id),
        salesRepName: author,
        status,
        candidateFeedback: noteText,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update lead status error:', error);
    return res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// Core Demographics Edit (ADMIN ONLY)
router.put('/:id', authMiddleware, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res): Promise<any> => {
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
      temperature,
      salesRepName,
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
    });

    const changes: string[] = [];
    if (temperature && temperature !== lead.temperature) changes.push(`priority temperature set to ${temperature}`);
    if (salesRepName && salesRepName !== lead.salesRepName) changes.push(`reassigned to ${salesRepName}`);

    if (changes.length > 0) {
      await prisma.salesInteraction.create({
        data: {
          leadId: String(id),
          salesRepName: req.user?.identifier || 'Admin',
          status: updated.currentStatus || 'Interested',
          candidateFeedback: `[Admin Update] Lead ${changes.join(', ')}.`,
        },
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Admin edit lead error:', error);
    return res.status(500).json({ error: 'Failed to update lead demographic data' });
  }
});

// Delete Lead (ADMIN ONLY)
router.delete('/:id', authMiddleware, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.lead.delete({
      where: { id: String(id) },
    });
    return res.json({ message: 'Lead record permanently deleted' });
  } catch (error) {
    console.error('Admin delete lead error:', error);
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
