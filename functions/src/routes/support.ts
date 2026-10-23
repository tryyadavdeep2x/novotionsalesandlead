import { Router } from 'express';
import { prisma } from '../server.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/support - List all support tickets with filtering & search
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { accountStatus, priority, status, search } = req.query;

    const where: any = {};

    if (accountStatus && String(accountStatus) !== 'ALL') {
      where.accountStatus = String(accountStatus);
    }

    if (priority && String(priority) !== 'ALL') {
      where.priority = String(priority);
    }

    if (status && String(status) !== 'ALL') {
      where.status = String(status);
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { clientName: { contains: q } },
        { contactPerson: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { ticketSubject: { contains: q } },
        { assignedAgent: { contains: q } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(tickets);
  } catch (error) {
    console.error('Fetch support tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// GET /api/support/metrics - After-Sales Summary Metrics (No deal values)
router.get('/metrics', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const totalTickets = await prisma.supportTicket.count();
    const openTickets = await prisma.supportTicket.count({ where: { status: 'Open' } });
    const inProgressTickets = await prisma.supportTicket.count({ where: { status: 'In Progress' } });
    const resolvedTickets = await prisma.supportTicket.count({ where: { status: { in: ['Resolved', 'Closed'] } } });
    const highPriorityTickets = await prisma.supportTicket.count({ where: { priority: 'High', status: { in: ['Open', 'In Progress'] } } });

    const activeAccounts = await prisma.supportTicket.count({ where: { accountStatus: 'Active' } });
    const onboardingAccounts = await prisma.supportTicket.count({ where: { accountStatus: 'Onboarding' } });
    const renewalDueAccounts = await prisma.supportTicket.count({ where: { accountStatus: 'Renewal Due' } });

    return res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      highPriorityTickets,
      activeAccounts,
      onboardingAccounts,
      renewalDueAccounts,
    });
  } catch (error) {
    console.error('Fetch support metrics error:', error);
    return res.status(500).json({ error: 'Failed to fetch support metrics' });
  }
});

// GET /api/support/:id - Get individual ticket details
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const ticket = await prisma.supportTicket.findUnique({ where: { id: id as string } });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });
    return res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    return res.status(500).json({ error: 'Failed to get ticket' });
  }
});

// POST /api/support - Create support ticket (strictly operational, no deal values)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const {
      clientName,
      contactPerson,
      email,
      phone,
      accountStatus = 'Active',
      ticketSubject,
      description,
      priority = 'Medium',
      assignedAgent = 'Support Team',
      resolutionDate,
    } = req.body;

    if (!clientName?.trim() || !contactPerson?.trim() || !email?.trim() || !ticketSubject?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Please provide all required ticket details' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        clientName: clientName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone?.trim() || '',
        accountStatus,
        ticketSubject: ticketSubject.trim(),
        description: description.trim(),
        priority,
        assignedAgent: assignedAgent.trim(),
        status: 'Open',
        resolutionDate: resolutionDate ? new Date(resolutionDate) : null,
        activityLogs: `Ticket logged by ${req.user?.identifier || 'Staff'} on ${new Date().toLocaleDateString()}`,
      },
    });

    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    return res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// PUT /api/support/:id - Update ticket
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      clientName,
      contactPerson,
      email,
      phone,
      accountStatus,
      ticketSubject,
      description,
      priority,
      assignedAgent,
      status,
      resolutionDate,
      activityLogs,
    } = req.body;

    const data: any = {};
    if (clientName !== undefined) data.clientName = clientName;
    if (contactPerson !== undefined) data.contactPerson = contactPerson;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (accountStatus !== undefined) data.accountStatus = accountStatus;
    if (ticketSubject !== undefined) data.ticketSubject = ticketSubject;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (assignedAgent !== undefined) data.assignedAgent = assignedAgent;
    if (status !== undefined) data.status = status;
    if (resolutionDate !== undefined) data.resolutionDate = resolutionDate ? new Date(resolutionDate) : null;
    if (activityLogs !== undefined) data.activityLogs = activityLogs;

    const updated = await prisma.supportTicket.update({
      where: { id: id as string },
      data,
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update support ticket error:', error);
    return res.status(500).json({ error: 'Failed to update support ticket' });
  }
});

// DELETE /api/support/:id - Delete ticket
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.supportTicket.delete({ where: { id: id as string } });
    return res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    console.error('Delete support ticket error:', error);
    return res.status(500).json({ error: 'Failed to delete support ticket' });
  }
});

export default router;
