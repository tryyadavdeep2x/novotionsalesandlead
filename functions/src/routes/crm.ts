import { Router } from 'express';
import { prisma } from '../server.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/crm/unified-dashboard - Dual-Widget Overview (Sales + After-Sales)
router.get('/unified-dashboard', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    // 1. Sales Pipeline Metrics (Pre-Sales Only)
    const totalLeads = await prisma.lead.count();
    const newLeads = await prisma.lead.count({ where: { stage: 'New' } });
    const contactedLeads = await prisma.lead.count({ where: { stage: 'Contacted' } });
    const proposalLeads = await prisma.lead.count({ where: { stage: 'Proposal Sent' } });
    const wonDeals = await prisma.lead.count({ where: { stage: 'Won' } });
    const lostDeals = await prisma.lead.count({ where: { stage: 'Lost' } });

    // Pipeline Revenue Sum (Only for Pre-Sales)
    const pipelineRevenueAgg = await prisma.lead.aggregate({
      _sum: { dealValueUsd: true },
      where: { stage: { in: ['New', 'Contacted', 'Proposal Sent', 'Won'] } },
    });
    const wonRevenueAgg = await prisma.lead.aggregate({
      _sum: { dealValueUsd: true },
      where: { stage: 'Won' },
    });

    const pendingFollowUps = await prisma.lead.count({
      where: {
        nextFollowUpDate: { not: null },
        stage: { in: ['New', 'Contacted', 'Proposal Sent'] },
      },
    });

    // 2. After-Sales Support Metrics (Operational Only)
    const openTickets = await prisma.supportTicket.count({ where: { status: 'Open' } });
    const inProgressTickets = await prisma.supportTicket.count({ where: { status: 'In Progress' } });
    const highPriorityTickets = await prisma.supportTicket.count({ where: { priority: 'High', status: { in: ['Open', 'In Progress'] } } });
    const activeAccounts = await prisma.supportTicket.count({ where: { accountStatus: 'Active' } });
    const onboardingAccounts = await prisma.supportTicket.count({ where: { accountStatus: 'Onboarding' } });
    const renewalDueAccounts = await prisma.supportTicket.count({ where: { accountStatus: 'Renewal Due' } });

    // Recent items for quick preview
    const recentSalesLeads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        candidateName: true,
        email: true,
        stage: true,
        dealValueUsd: true,
        salesRepName: true,
        nextFollowUpDate: true,
      },
    });

    const recentSupportTickets = await prisma.supportTicket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientName: true,
        ticketSubject: true,
        priority: true,
        accountStatus: true,
        status: true,
        assignedAgent: true,
      },
    });

    return res.json({
      sales: {
        totalLeads,
        newLeads,
        contactedLeads,
        proposalLeads,
        wonDeals,
        lostDeals,
        pendingFollowUps,
        totalPipelineRevenue: pipelineRevenueAgg._sum.dealValueUsd || 0,
        wonRevenue: wonRevenueAgg._sum.dealValueUsd || 0,
        recentLeads: recentSalesLeads,
      },
      afterSales: {
        openTickets,
        inProgressTickets,
        highPriorityTickets,
        activeAccounts,
        onboardingAccounts,
        renewalDueAccounts,
        recentTickets: recentSupportTickets,
      },
    });
  } catch (error) {
    console.error('Unified dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch unified dashboard' });
  }
});

// GET /api/crm/global-search?q=... - Search across both Sales Leads and After-Sales Support
router.get('/global-search', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ salesLeads: [], supportTickets: [] });
    }

    const salesLeads = await prisma.lead.findMany({
      where: {
        OR: [
          { candidateName: { contains: q } },
          { email: { contains: q } },
          { phoneNumber: { contains: q } },
          { jobProfile: { contains: q } },
          { salesRepName: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const supportTickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { clientName: { contains: q } },
          { contactPerson: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
          { ticketSubject: { contains: q } },
          { assignedAgent: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      query: q,
      totalMatches: salesLeads.length + supportTickets.length,
      salesLeads,
      supportTickets,
    });
  } catch (error) {
    console.error('Global search error:', error);
    return res.status(500).json({ error: 'Failed to perform global search' });
  }
});

export default router;
