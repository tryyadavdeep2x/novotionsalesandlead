import { Router } from 'express';
import { prisma } from '../server.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to parse MM-YYYY or YYYY-MM into start/end of month and prior month
function parseMonthRange(monthStr?: string) {
  let year: number;
  let monthIndex: number; // 0-11

  if (monthStr && (monthStr.includes('-') || monthStr.includes('/'))) {
    const parts = monthStr.split(/[-/]/);
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      monthIndex = parseInt(parts[1], 10) - 1;
    } else {
      monthIndex = parseInt(parts[0], 10) - 1;
      year = parseInt(parts[1], 10);
    }
  } else {
    const now = new Date();
    year = now.getFullYear();
    monthIndex = now.getMonth();
  }

  const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

  const priorStartDate = new Date(Date.UTC(year, monthIndex - 1, 1, 0, 0, 0));
  const priorEndDate = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthLabel = `${monthNames[monthIndex]} ${year}`;
  const monthCode = `${String(monthIndex + 1).padStart(2, '0')}-${year}`;
  
  const priorMonthIdx = (monthIndex + 11) % 12;
  const priorYear = monthIndex === 0 ? year - 1 : year;
  const priorMonthLabel = `${monthNames[priorMonthIdx]} ${priorYear}`;
  const priorMonthCode = `${String(priorMonthIdx + 1).padStart(2, '0')}-${priorYear}`;

  return {
    startDate,
    endDate,
    priorStartDate,
    priorEndDate,
    monthLabel,
    monthCode,
    priorMonthLabel,
    priorMonthCode,
    year,
    monthIndex,
  };
}

// 1. GET /api/leads/monthly - Lead Professionals Monthly Aggregation Engine (Cold, Warm, Hot)
router.get('/monthly', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { month, temperature, status, creator, salesRep } = req.query;
    const { startDate, endDate, monthLabel, monthCode } = parseMonthRange(String(month || ''));

    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (temperature && String(temperature).toLowerCase() !== 'all') {
      whereClause.temperature = {
        equals: String(temperature).charAt(0).toUpperCase() + String(temperature).slice(1).toLowerCase(),
      };
    }

    if (status && String(status).toLowerCase() !== 'all') {
      const st = String(status).toLowerCase();
      if (st === 'converted') {
        whereClause.currentStatus = 'Converted';
      } else if (st === 'unconverted' || st === 'active' || st === 'in_progress') {
        whereClause.currentStatus = 'Unconverted (Active)';
      } else if (st === 'lost') {
        whereClause.currentStatus = 'Lost';
      } else if (st === 'no_response') {
        whereClause.currentStatus = 'No Response';
      }
    }

    if (creator && String(creator).toLowerCase() !== 'all') {
      whereClause.createdByName = String(creator);
    }

    if (salesRep && String(salesRep).toLowerCase() !== 'all') {
      whereClause.salesRepName = String(salesRep);
    }

    if (req.user?.role === 'LEAD_TEAM') {
      whereClause.createdByName = req.user.identifier;
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

    // All leads in month for complete tier calculations and creator rankings
    const monthAllLeads = await prisma.lead.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(creator && String(creator).toLowerCase() !== 'all' ? { createdByName: String(creator) } : {}),
      },
    });

    const tiers = {
      cold: { count: 0, dealValueUsd: 0, percentage: 0, converted: 0, inProgress: 0, lost: 0, noResponse: 0 },
      warm: { count: 0, dealValueUsd: 0, percentage: 0, converted: 0, inProgress: 0, lost: 0, noResponse: 0 },
      hot: { count: 0, dealValueUsd: 0, percentage: 0, converted: 0, inProgress: 0, lost: 0, noResponse: 0 },
    };

    const creatorsMap: Record<string, { name: string; total: number; cold: number; warm: number; hot: number; totalValueUsd: number }> = {};

    monthAllLeads.forEach((l) => {
      const tempKey = (l.temperature?.toLowerCase() || 'warm') as 'cold' | 'warm' | 'hot';
      const dealVal = l.dealValueUsd || 0;

      if (tiers[tempKey]) {
        tiers[tempKey].count++;
        tiers[tempKey].dealValueUsd += dealVal;
        if (l.currentStatus === 'Converted') tiers[tempKey].converted++;
        else if (l.currentStatus === 'Lost') tiers[tempKey].lost++;
        else if (l.currentStatus === 'No Response') tiers[tempKey].noResponse++;
        else tiers[tempKey].inProgress++;
      }

      // Creator tracking
      const creatorName = l.createdByName || 'System';
      if (!creatorsMap[creatorName]) {
        creatorsMap[creatorName] = { name: creatorName, total: 0, cold: 0, warm: 0, hot: 0, totalValueUsd: 0 };
      }
      creatorsMap[creatorName].total++;
      creatorsMap[creatorName].totalValueUsd += dealVal;
      if (tempKey === 'cold') creatorsMap[creatorName].cold++;
      else if (tempKey === 'hot') creatorsMap[creatorName].hot++;
      else creatorsMap[creatorName].warm++;
    });

    const totalLeads = monthAllLeads.length;
    if (totalLeads > 0) {
      tiers.cold.percentage = Math.round((tiers.cold.count / totalLeads) * 100);
      tiers.warm.percentage = Math.round((tiers.warm.count / totalLeads) * 100);
      tiers.hot.percentage = Math.round((tiers.hot.count / totalLeads) * 100);
    }

    // List of unique creators for filter dropdown
    const allCreatorsQuery = await prisma.lead.findMany({
      select: { createdByName: true },
      distinct: ['createdByName'],
    });
    const availableCreators = allCreatorsQuery.map(c => c.createdByName).filter(Boolean);

    return res.json({
      monthLabel,
      monthCode,
      totalMonthlyLeads: totalLeads,
      filteredCount: leads.length,
      tiers,
      creatorBreakdown: Object.values(creatorsMap).sort((a, b) => b.total - a.total),
      availableCreators,
      leads,
    });
  } catch (error) {
    console.error('Monthly leads error:', error);
    return res.status(500).json({ error: 'Failed to fetch monthly leads aggregation' });
  }
});

// 2. GET /api/sales-reps/dashboard and GET /api/sales-reps/:id/dashboard
const getSalesRepDashboardHandler = async (req: AuthenticatedRequest, res: any): Promise<any> => {
  try {
    const { month } = req.query;
    let salesRep = req.query.salesRep as string | undefined;
    const repId = req.params?.id;

    if (req.user?.role === 'SALES_TEAM' && !salesRep) {
      salesRep = req.user.identifier;
    }

    if (repId && repId !== 'all' && repId !== 'dashboard') {
      salesRep = decodeURIComponent(repId as string);
    }

    const {
      startDate,
      endDate,
      priorStartDate,
      priorEndDate,
      monthLabel,
      monthCode,
      priorMonthLabel,
      priorMonthCode,
    } = parseMonthRange(String(month || ''));

    // Get all unique sales reps for dropdown selector
    const allRepsQuery = await prisma.lead.findMany({
      where: { salesRepName: { not: null } },
      select: { salesRepName: true },
      distinct: ['salesRepName'],
    });
    const availableSalesReps = allRepsQuery
      .map(r => r.salesRepName)
      .filter((name): name is string => Boolean(name));

    const isAllReps = !salesRep || salesRep.toLowerCase() === 'all' || salesRep === 'All Representatives';
    const repFilter = isAllReps ? {} : { salesRepName: salesRep };

    // Fetch Current Month Leads for this rep
    const currentMonthLeads = await prisma.lead.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...repFilter,
      },
      include: {
        interactions: {
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Prior Month Leads for Delta Comparisons
    const priorMonthLeads = await prisma.lead.findMany({
      where: {
        createdAt: { gte: priorStartDate, lte: priorEndDate },
        ...repFilter,
      },
    });

    // Compute the 6 core sales professional performance metrics:
    const totalAssignedLeads = currentMonthLeads.length;
    let totalClosedSales = 0;       // Total number of sales made
    let totalRevenueUsd = 0;        // Total sales amount in dollars ($)
    let convertedLeadsCount = 0;    // Total leads converted
    let unconvertedActiveLeads = 0; // Total leads not converted (in progress)
    let lostDeals = 0;              // Total lost leads
    let noResponseLeads = 0;        // Total no response leads

    const temperatureBreakdown = {
      cold: { count: 0, pipelineUsd: 0, percentage: 0 },
      warm: { count: 0, pipelineUsd: 0, percentage: 0 },
      hot: { count: 0, pipelineUsd: 0, percentage: 0 },
    };

    const outcomeBreakdown = {
      converted: { count: 0, revenueUsd: 0, percentage: 0 },
      inProgress: { count: 0, pipelineUsd: 0, percentage: 0 },
      lost: { count: 0, lostValueUsd: 0, percentage: 0 },
      noResponse: { count: 0, percentage: 0 },
    };

    currentMonthLeads.forEach((l) => {
      const dealVal = l.dealValueUsd || 0;
      const tempKey = (l.temperature?.toLowerCase() || 'warm') as 'cold' | 'warm' | 'hot';

      if (temperatureBreakdown[tempKey]) {
        temperatureBreakdown[tempKey].count++;
        temperatureBreakdown[tempKey].pipelineUsd += dealVal;
      }

      if (l.currentStatus === 'Converted') {
        totalClosedSales++;
        convertedLeadsCount++;
        totalRevenueUsd += dealVal;
        outcomeBreakdown.converted.count++;
        outcomeBreakdown.converted.revenueUsd += dealVal;
      } else if (l.currentStatus === 'Lost') {
        lostDeals++;
        outcomeBreakdown.lost.count++;
        outcomeBreakdown.lost.lostValueUsd += dealVal;
      } else if (l.currentStatus === 'No Response') {
        noResponseLeads++;
        outcomeBreakdown.noResponse.count++;
      } else {
        unconvertedActiveLeads++;
        outcomeBreakdown.inProgress.count++;
        outcomeBreakdown.inProgress.pipelineUsd += dealVal;
      }
    });

    const conversionRate = totalAssignedLeads > 0
      ? Math.round((totalClosedSales / totalAssignedLeads) * 1000) / 10
      : 0;

    if (totalAssignedLeads > 0) {
      temperatureBreakdown.cold.percentage = Math.round((temperatureBreakdown.cold.count / totalAssignedLeads) * 100);
      temperatureBreakdown.warm.percentage = Math.round((temperatureBreakdown.warm.count / totalAssignedLeads) * 100);
      temperatureBreakdown.hot.percentage = Math.round((temperatureBreakdown.hot.count / totalAssignedLeads) * 100);

      outcomeBreakdown.converted.percentage = Math.round((outcomeBreakdown.converted.count / totalAssignedLeads) * 100);
      outcomeBreakdown.inProgress.percentage = Math.round((outcomeBreakdown.inProgress.count / totalAssignedLeads) * 100);
      outcomeBreakdown.lost.percentage = Math.round((outcomeBreakdown.lost.count / totalAssignedLeads) * 100);
      outcomeBreakdown.noResponse.percentage = Math.round((outcomeBreakdown.noResponse.count / totalAssignedLeads) * 100);
    }

    // Prior Month Deltas
    const priorTotalAssigned = priorMonthLeads.length;
    let priorClosedSales = 0;
    let priorRevenueUsd = 0;

    priorMonthLeads.forEach((l) => {
      if (l.currentStatus === 'Converted') {
        priorClosedSales++;
        priorRevenueUsd += (l.dealValueUsd || 0);
      }
    });

    const priorConversionRate = priorTotalAssigned > 0
      ? (priorClosedSales / priorTotalAssigned) * 100
      : 0;

    const calcDelta = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const deltas = {
      revenueDelta: calcDelta(totalRevenueUsd, priorRevenueUsd),
      closedSalesDelta: calcDelta(totalClosedSales, priorClosedSales),
      totalLeadsDelta: calcDelta(totalAssignedLeads, priorTotalAssigned),
      conversionRateDelta: Math.round((conversionRate - priorConversionRate) * 10) / 10,
    };

    return res.json({
      monthLabel,
      monthCode,
      priorMonthLabel,
      priorMonthCode,
      selectedSalesRep: isAllReps ? 'All Representatives' : salesRep,
      availableSalesReps,
      metrics: {
        totalRevenueUsd,          // Total sales in amount in dollars
        totalClosedSales,         // Total number of sales made
        convertedLeadsCount,      // Total number of leads converted
        conversionRate,           // Conversion %
        unconvertedActiveLeads,   // Total leads not converted (active)
        lostDeals,                // Lost leads
        noResponseLeads,          // No response leads
        totalAssignedLeads,
      },
      deltas,
      temperatureBreakdown,
      outcomeBreakdown,
      leads: currentMonthLeads,
    });
  } catch (error) {
    console.error('Sales Rep dashboard error:', error);
    return res.status(500).json({ error: 'Failed to generate sales performance dashboard metrics' });
  }
};

router.get('/dashboard', authMiddleware, getSalesRepDashboardHandler);
router.get('/:id/dashboard', authMiddleware, getSalesRepDashboardHandler);

// 3. PUT /api/leads/:id/quick-update
router.put('/:id/quick-update', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { temperature, dealValueUsd, currentStatus, salesRepName } = req.body;

    const dataToUpdate: any = {};
    if (temperature !== undefined) {
      dataToUpdate.temperature = temperature;
      dataToUpdate.isCold = temperature === 'Cold';
    }
    if (dealValueUsd !== undefined) {
      dataToUpdate.dealValueUsd = parseFloat(dealValueUsd) || 0;
    }
    if (currentStatus !== undefined) {
      dataToUpdate.currentStatus = currentStatus;
    }
    if (salesRepName !== undefined) {
      dataToUpdate.salesRepName = salesRepName;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: id as string },
      data: dataToUpdate,
    });

    if (currentStatus) {
      await prisma.salesInteraction.create({
        data: {
          leadId: id as string,
          salesRepName: salesRepName || req.user?.identifier || 'System',
          status: currentStatus === 'Converted' ? 'Converted' : 
                  currentStatus === 'Lost' ? 'Not Interested' : 
                  currentStatus === 'No Response' ? 'No Response' : 'Interested',
          candidateFeedback: `Status updated to ${currentStatus} (Temperature: ${updatedLead.temperature}, Value: $${updatedLead.dealValueUsd})`,
        },
      });
    }

    return res.json(updatedLead);
  } catch (error) {
    console.error('Quick update error:', error);
    return res.status(500).json({ error: 'Failed to update lead metrics' });
  }
});

export default router;
