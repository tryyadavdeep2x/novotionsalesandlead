import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

export const ALLOWED_SALES_STATUSES = [
  'Interested',
  'Not Interested',
  'No Response',
  'Maybe Interested',
  'Follow-Up Required',
  'Converted',
  'Lost',
] as const;

const interactionSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  salesRepName: z.string().optional(),
  status: z.enum([
    'Interested',
    'Not Interested',
    'No Response',
    'Maybe Interested',
    'Follow-Up Required',
    'Converted',
    'Lost',
  ]),
  candidateFeedback: z.string().min(1, 'Interaction comment / feedback notes are required'),
});

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Append New Interaction / Comment Log (Append-Only: SALES_TEAM and ADMIN)
router.post('/interaction', authMiddleware, requireRole(['SALES_TEAM', 'ADMIN']), async (req: AuthenticatedRequest, res): Promise<any> => {
  const parseResult = interactionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(', ') });
  }

  const { leadId, status, candidateFeedback } = parseResult.data;
  const authorName = parseResult.data.salesRepName || req.user?.identifier || 'Sales Specialist';

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const interaction = await prisma.salesInteraction.create({
      data: {
        leadId,
        salesRepName: authorName,
        status,
        candidateFeedback: candidateFeedback.trim(),
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        currentStatus: status,
        statusUpdatedAt: new Date(),
        stage: status === 'Converted' ? 'Won' : status === 'Not Interested' ? 'Lost' : lead.stage,
      },
    });

    return res.status(201).json(interaction);
  } catch (error) {
    console.error('Create interaction error:', error);
    return res.status(500).json({ error: 'Failed to create interaction update' });
  }
});

// Sales Monthly Performance Dashboard Endpoint
router.get('/monthly', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { month, salesRep } = req.query;

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

    let whereClause: any = {};
    if (salesRep && salesRep !== 'ALL' && salesRep !== 'All Representatives') {
      whereClause.salesRepName = String(salesRep);
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        interactions: {
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalLeads = leads.length;
    const interested = leads.filter(l => l.currentStatus === 'Interested' || l.currentStatus === 'Maybe Interested').length;
    const converted = leads.filter(l => l.currentStatus === 'Converted' || l.stage === 'Won').length;
    const noResponse = leads.filter(l => !l.currentStatus || l.currentStatus === 'No Response').length;
    const notInterested = leads.filter(l => l.currentStatus === 'Not Interested' || l.currentStatus === 'Lost').length;
    const totalPipelineUsd = leads.reduce((acc, l) => acc + (l.dealValueUsd || 0), 0);

    const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

    const availableRepsSet = new Set<string>();
    const allLeads = await prisma.lead.findMany({ select: { salesRepName: true } });
    allLeads.forEach(l => { if (l.salesRepName) availableRepsSet.add(l.salesRepName); });

    return res.json({
      monthLabel,
      monthCode,
      totalLeads,
      interested,
      converted,
      noResponse,
      notInterested,
      totalPipelineUsd,
      conversionRate,
      availableReps: Array.from(availableRepsSet),
      leads,
    });
  } catch (error) {
    console.error('Sales monthly error:', error);
    return res.status(500).json({ error: 'Failed to fetch sales monthly metrics' });
  }
});

// Get Chronological Interaction History Timeline (Descending: Newest First)
router.get('/interactions/:leadId', authMiddleware, requireRole(['SALES_TEAM', 'ADMIN', 'LEAD_TEAM']), async (req: AuthenticatedRequest, res): Promise<any> => {
  const { leadId } = req.params;

  try {
    const history = await prisma.salesInteraction.findMany({
      where: { leadId: String(leadId) },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(history);
  } catch (error) {
    console.error('Fetch interactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch interactions history' });
  }
});

export default router;
