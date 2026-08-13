import { Router } from 'express';
import { Prisma, Shipment } from '@prisma/client';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDashboardStats } from '@/lib/dashboard-stats';
import { getShipmentsList } from '@/lib/shipments-query';
import { parseBusinessDateTime, toBusinessDateInput, toBusinessTimeInput } from '@/lib/datetime';
import { pushService } from '../push-service';


const router = Router();

// Validate all route parameters named 'id' to ensure they are valid UUIDs
// This prevents Prisma from crashing with HTTP 500 when given invalid formats like 'undefined' or 'abc'
router.param('id', (_req, res, next, id) => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Auth middleware
router.use((req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized'  });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Unauthorized'  });
  }
});

// Helper for date filtering
function getDateRangeFilter(dateFilter?: string, customStart?: string, customEnd?: string) {
  if (!dateFilter || dateFilter === 'all-time') return undefined;
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (dateFilter === 'today') {
    return { gte: startOfDay };
  } else if (dateFilter === 'yesterday') {
    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    return { gte: startOfYesterday, lt: startOfDay };
  } else if (dateFilter === 'this-week') {
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return { gte: startOfWeek };
  } else if (dateFilter === 'last-week') {
    const startOfLastWeek = new Date(startOfDay);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7);
    const endOfLastWeek = new Date(startOfDay);
    endOfLastWeek.setDate(endOfLastWeek.getDate() - endOfLastWeek.getDay());
    return { gte: startOfLastWeek, lt: endOfLastWeek };
  } else if (dateFilter === 'this-month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: startOfMonth };
  } else if (dateFilter === 'last-month') {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: startOfLastMonth, lt: endOfLastMonth };
  } else if (dateFilter === 'custom' && customStart && customEnd) {
    return { gte: new Date(customStart), lte: new Date(customEnd) };
  }
  
  return undefined;
}

// --- Centralized Deletion Services ---
async function deleteShipments(ids: string[]) {
  if (!ids || ids.length === 0) return { count: 0 };
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Delete histories
    await tx.shipmentStatusHistory.deleteMany({
      where: { shipment_id: { in: ids } }
    });
    // Delete shipments
    return await tx.shipment.deleteMany({
      where: { id: { in: ids } }
    });
  });
}

async function deleteQuotes(ids: string[]) {
  if (!ids || ids.length === 0) return { count: 0 };
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.quoteStatusHistory.deleteMany({
      where: { quote_request_id: { in: ids } }
    });
    return await tx.quotationRequest.deleteMany({
      where: { id: { in: ids } }
    });
  });
}

async function deleteContactMessages(ids: string[]) {
  if (!ids || ids.length === 0) return { count: 0 };
  return await prisma.contactSubmission.deleteMany({
    where: { id: { in: ids } }
  });
}

async function deleteNotifications(ids: string[]) {
  if (!ids || ids.length === 0) return { count: 0 };
  return await prisma.notification.deleteMany({
    where: { id: { in: ids } }
  });
}

router.get('/dashboard-stats', async (req, res) => {
  try {
    const { month, year } = req.query;
    const stats = await getDashboardStats(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.get('/shipments/export', async (req, res) => {
  try {
    const { search, status, courier, startDate, endDate, isActive } = req.query;
    const where: Record<string, unknown> = {};
    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    } else {
      where.is_active = true;
    }

    if (status) where.current_status = status;
    if (courier) where.courier = courier;
    
    if (startDate && endDate) {
      where.booked_date = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }
    
    if (search) {
      where.OR = [
        { tracking_id: { contains: search as string, mode: 'insensitive' } },
        { official_tracking_id: { contains: search as string, mode: 'insensitive' } },
        { sender_name: { contains: search as string, mode: 'insensitive' } },
        { receiver_name: { contains: search as string, mode: 'insensitive' } },
        { sender_phone: { contains: search as string, mode: 'insensitive' } },
        { receiver_phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: [
        { booked_date: 'desc' },
        { created_at: 'desc' }
      ]
    });

    const fields = [
      'Tracking Number', 'Sender Name', 'Sender Mobile', 'Origin', 
      'Receiver Name', 'Receiver Mobile', 'Destination', 'Shipment Type', 
      'Courier Service', 'Service Through', 'Current Status', 'Weight', 
      'Book Date', 'Book Time', 'Estimated Delivery', 'Profit', 
      'Paid Amount', 'Receiver Amount', 'Active/Inactive'
    ];

    const csv = [
      fields.join(','),
      ...shipments.map((s: Shipment) => {
        const row = [
          s.tracking_id,
          s.sender_name,
          s.sender_phone,
          s.sender_city || s.origin,
          s.receiver_name,
          s.receiver_phone,
          s.receiver_city || s.destination,
          s.shipment_type,
          s.service,
          s.service_through,
          s.current_status,
          s.weight,
          s.booked_date ? toBusinessDateInput(s.booked_date) : '',
          s.booked_date ? toBusinessTimeInput(s.booked_date) : '',
          s.estimated_delivery ? s.estimated_delivery.toISOString().split('T')[0] : '',
          s.profit,
          s.paid_amount,
          s.received_amount,
          s.is_active ? 'Active' : 'Inactive'
        ];
        return row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
      })
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('shipments_export.csv');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.get('/shipments', async (req, res) => {
  try {
    const { search, status, courier, startDate, endDate, isActive, olderThan31Days, page = '1', limit = '10' } = req.query;

    const data = await getShipmentsList({
      search: search as string | undefined,
      status: status as string | undefined,
      courier: courier as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : true,
      olderThan31Days: olderThan31Days === 'true',
      page: Number(page),
      limit: Number(limit),
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.get('/shipments/:id', async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { history: { orderBy: { occurred_at: 'desc' } } }
    });
    if (!shipment) return res.status(404).json({ success: false, message: 'Not found'  });
    res.json({ success: true, data: shipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});


const generateTrackingId = async () => {
  const randomNum = crypto.randomInt(1000000000, 10000000000);
  return `KSR${randomNum}`;
};

router.post('/shipments', async (req, res) => {
  try {
    const { source_quote_id, ...data } = req.body;
    data.tracking_type = 'manual';
    data.current_status = 'Shipment Created';
    
    const requiredFields = [
      'official_tracking_id', 'booked_date', 'estimated_delivery', 
      'service', 'service_through', 'sender_name', 'sender_phone', 
      'sender_city', 'receiver_name', 'receiver_phone', 'receiver_city', 
      'weight', 'num_packages', 'shipment_type'
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return res.status(400).json({ success: false, message: `Field ${field} is required` });
      }
    }
    
    if (data.paid_amount === undefined || data.paid_amount === null || data.paid_amount === '') {
      return res.status(400).json({ success: false, message: `Field paid_amount is required` });
    }
    if (data.received_amount === undefined || data.received_amount === null || data.received_amount === '') {
      return res.status(400).json({ success: false, message: `Field received_amount is required` });
    }

    if (data.estimated_delivery) data.estimated_delivery = new Date(data.estimated_delivery);
    if (data.booked_date) {
      if (data.booked_time) {
        data.booked_date = parseBusinessDateTime(`${data.booked_date}T${data.booked_time}:00`);
        delete data.booked_time;
      } else {
        data.booked_date = parseBusinessDateTime(data.booked_date);
      }
    } else {
      data.booked_date = new Date();
      delete data.booked_time;
    }
    
    data.paid_amount = Number(data.paid_amount) || 0;
    data.received_amount = Number(data.received_amount) || 0;
    data.profit = data.received_amount - data.paid_amount;

    if (source_quote_id) {
      const quote = await prisma.quotationRequest.findUnique({ where: { id: source_quote_id } });
      if (!quote) return res.status(404).json({ success: false, message: 'Source quote not found'  });
      if (['Closed', 'Rejected'].includes(quote.status)) {
        return res.status(400).json({ error: `Cannot process quote because it is already ${quote.status}` });
      }
    }

    let shipment;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const tracking_id = await generateTrackingId();
        
        const createShipmentOp = prisma.shipment.create({
          data: {
            ...data,
            tracking_id,
            history: {
              create: {
                status: 'Shipment Created',
                location: data.origin || null,
                occurred_at: data.booked_date,
                updated_by: (req as any).user.id,
                note: source_quote_id ? `Created from Quote ${source_quote_id}` : 'Shipment created'
              }
            }
          }
        });

        if (source_quote_id) {
          const updateQuoteOp = prisma.quotationRequest.update({
            where: { id: source_quote_id },
            data: {
              status: 'Closed',
              history: {
                create: {
                  status: 'Closed',
                  occurred_at: new Date(),
                  updated_by: (req as any).user.id,
                  note: `Closed due to Shipment Creation`
                }
              }
            }
          });

          const [createdShipment, _updatedQuote] = await prisma.$transaction([createShipmentOp, updateQuoteOp]);
          shipment = createdShipment;
        } else {
          shipment = await createShipmentOp;
        }
        
        break; // Success
      } catch (e: any) {
        if (e.code === 'P2002' && e.meta?.target?.includes('tracking_id')) {
          attempts++;
          if (attempts >= maxAttempts) throw new Error('Failed to generate unique tracking ID after 3 attempts');
        } else {
          throw e;
        }
      }
    }

    res.json({ success: true, data: shipment });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002' && error.meta?.target?.includes('official_tracking_id')) {
       return res.status(400).json({ success: false, message: 'Official tracking number must be unique'  });
    }
    res.status(500).json({ success: false, message: error.message || 'Internal error' });
  }
});

const STATUS_WORKFLOW = [
  'Shipment Created',
  'Picked Up',
  'Dispatched',
  'In Transit',
  'Out For Delivery',
  'Delivered'
];

router.put('/shipments/:id', async (req, res) => {
  try {
    const { version, ...updateData } = req.body;
    
    if (version === undefined) {
      return res.status(400).json({ success: false, message: 'Version is required for optimistic concurrency control'  });
    }

    const current = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ success: false, message: 'Not found'  });
    
    const requiredFields = [
      'official_tracking_id', 'estimated_delivery', 
      'service', 'service_through', 'sender_name', 'sender_phone', 
      'sender_city', 'receiver_name', 'receiver_phone', 'receiver_city', 
      'weight', 'num_packages', 'shipment_type'
    ];

    for (const field of requiredFields) {
      if (updateData[field] === undefined || updateData[field] === null || updateData[field] === '') {
        return res.status(400).json({ success: false, message: `Field ${field} is required` });
      }
    }
    
    if (updateData.paid_amount === undefined || updateData.paid_amount === null || updateData.paid_amount === '') {
      return res.status(400).json({ success: false, message: `Field paid_amount is required` });
    }
    if (updateData.received_amount === undefined || updateData.received_amount === null || updateData.received_amount === '') {
      return res.status(400).json({ success: false, message: `Field received_amount is required` });
    }
    
    if (current.current_status === 'Delivered') {
      return res.status(403).json({ success: false, message: 'Cannot edit a delivered shipment (Read Only)'  });
    }

    if (current.version !== version) {
      return res.status(409).json({ success: false, message: 'Conflict: This record has been updated by another user. Please refresh.'  });
    }

    if (updateData.paid_amount !== undefined || updateData.received_amount !== undefined) {
      const paid = Number(updateData.paid_amount ?? current.paid_amount) || 0;
      const received = Number(updateData.received_amount ?? current.received_amount) || 0;
      updateData.profit = received - paid;
    }

    if (updateData.estimated_delivery) updateData.estimated_delivery = new Date(updateData.estimated_delivery as string);
    
    if (updateData.booked_date) {
      updateData.booked_date = new Date(updateData.booked_date as string);
      const firstHistory = await prisma.shipmentStatusHistory.findFirst({
        where: { shipment_id: req.params.id, status: 'Shipment Created' },
        orderBy: { occurred_at: 'asc' }
      });
      if (firstHistory) {
        await prisma.shipmentStatusHistory.update({
          where: { id: firstHistory.id },
          data: { occurred_at: updateData.booked_date }
        });
      }
    }
    delete updateData.booked_time;
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.history;
    delete updateData.user_id;

    const shipment = await prisma.shipment.update({
      where: { id: req.params.id, version },
      data: {
        ...updateData,
        version: { increment: 1 }
      }
    });

    res.json({ success: true, data: shipment });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(409).json({ success: false, message: 'Conflict: This record has been updated by another user. Please refresh.'  });
    if (error.code === 'P2002' && error.meta?.target?.includes('official_tracking_id')) {
       return res.status(400).json({ success: false, message: 'Official tracking number must be unique'  });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error'  });
  }
});

router.patch('/shipments/:id/status', async (req, res) => {
  try {
    const { status, location, occurred_at, note, version } = req.body;
    
    if (version === undefined) {
      return res.status(400).json({ success: false, message: 'Version is required'  });
    }

    const current = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ success: false, message: 'Not found'  });
    
    if (current.current_status === 'Delivered') {
      return res.status(403).json({ success: false, message: 'Shipment is already delivered'  });
    }
    
    if (current.version !== version) {
      return res.status(409).json({ success: false, message: 'Conflict: This record has been updated. Please refresh.'  });
    }

    const currentIndex = STATUS_WORKFLOW.indexOf(current.current_status);
    const newIndex = STATUS_WORKFLOW.indexOf(status);

    if (newIndex <= currentIndex) {
      return res.status(400).json({ error: `Cannot move status backwards from ${current.current_status} to ${status}` });
    }

    const updateData: Record<string, unknown> = {
      current_status: status,
      current_location: location,
      version: { increment: 1 }
    };
    
    const occurredAt = occurred_at ? parseBusinessDateTime(occurred_at) : new Date();

    if (status === 'Delivered') {
      updateData.delivered_at = occurredAt;
    }

    const [shipment, history] = await prisma.$transaction([
      prisma.shipment.update({
        where: { id: req.params.id, version },
        data: updateData
      }),
      prisma.shipmentStatusHistory.create({
        data: {
          shipment_id: req.params.id,
          status,
          location,
          occurred_at: occurredAt,
          note,
          updated_by: (req as any).user.id
        }
      })
    ]);

    res.json({ success: true, data: { shipment, history } });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(409).json({ success: false, message: 'Conflict: This record has been updated. Please refresh.'  });
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error'  });
  }
});

router.patch('/shipments/:id/archive', async (req, res) => {
  try {
    const { is_active } = req.body;
    
    const current = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ success: false, message: 'Not found'  });
    
    if (current.current_status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered shipments can be archived'  });
    }
    
    if (!current.delivered_at) {
      return res.status(400).json({ success: false, message: 'Delivery date is missing'  });
    }

    const daysSinceDelivery = (Date.now() - current.delivered_at.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery < 60) {
      return res.status(400).json({ success: false, message: 'Shipment must be delivered for at least 60 days to be archived'  });
    }

    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { is_active }
    });

    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error'  });
  }
});

router.delete('/shipments/:id', async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) return res.status(404).json({ success: false, message: 'Resource not found' });
    
    await deleteShipments([req.params.id]);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/shipments/delete-bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: 'Invalid ids provided' });

    await deleteShipments(ids);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const generateQuoteId = async () => {
  const randomNum = crypto.randomInt(1000000000, 10000000000);
  return `KSRQ${randomNum}`;
};

router.get('/quotations', async (req, res) => {
  try {
    const { search, status, isStarred, dateFilter, startDate, endDate, page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    
    if (status === 'Needs Attention') {
      where.OR = [
        { is_starred: true },
        { status: { notIn: ['Closed'] } }
      ];
    } else if (status === 'To Be Responded') {
      where.status = 'New';
    } else if (status === 'Responded') {
      where.status = { notIn: ['New'] };
    } else if (status && status !== 'All') {
      where.status = status;
    }

    if (isStarred === 'true' && status !== 'Needs Attention') {
      where.is_starred = true;
    }

    const dateRange = getDateRangeFilter(dateFilter as string, startDate as string, endDate as string);
    if (dateRange) {
      where.created_at = dateRange;
    }

    if (search) {
      const searchOR = [
        { quote_id: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { pickup_location: { contains: search as string, mode: 'insensitive' } },
        { drop_location: { contains: search as string, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchOR }
        ];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [items, total] = await Promise.all([
      prisma.quotationRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.quotationRequest.count({ where })
    ]);
    
    res.json({ success: true, data: { quotations: items, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.get('/quotations/:id', async (req, res) => {
  try {
    let quote = await prisma.quotationRequest.findUnique({
      where: { id: req.params.id },
      include: {
        history: { orderBy: { occurred_at: 'desc' } }
      }
    });
    
    if (!quote) return res.status(404).json({ success: false, message: 'Resource not found' });
    
    if (!quote.opened_at) {
      quote = await prisma.quotationRequest.update({
        where: { id: req.params.id },
        data: { opened_at: new Date() },
        include: {
          history: { orderBy: { occurred_at: 'desc' } }
        }
      });
    }

    res.json({ success: true, data: quote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.post('/quotations', async (req, res) => {
  try {
    const data = { ...req.body };
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const duplicateWarnings = [];
    if (data.phone) {
      const recentPhone = await prisma.quotationRequest.findFirst({
        where: { phone: data.phone, created_at: { gte: thirtyDaysAgo } }
      });
      if (recentPhone) duplicateWarnings.push('A quote with this phone number was created in the last 30 days.');
    }
    if (data.email) {
      const recentEmail = await prisma.quotationRequest.findFirst({
        where: { email: data.email, created_at: { gte: thirtyDaysAgo } }
      });
      if (recentEmail) duplicateWarnings.push('A quote with this email was created in the last 30 days.');
    }

    let quote;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const quote_id = await generateQuoteId();
        quote = await prisma.quotationRequest.create({
          data: {
            ...data,
            quote_id,
            status: 'New',
            history: {
              create: {
                status: 'New',
                occurred_at: new Date(),
                updated_by: (req as any).user ? (req as any).user.id : null,
                note: 'Quote Request Created'
              }
            }
          }
        });
        break;
      } catch (e: any) {
        if (e.code === 'P2002' && e.meta?.target?.includes('quote_id')) {
          attempts++;
          if (attempts >= maxAttempts) throw new Error('Failed to generate unique quote ID');
        } else {
          throw e;
        }
      }
    }

    res.json({ success: true, data: { quote, warnings: duplicateWarnings } });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error'  });
  }
});

router.patch('/quotations/read-all', async (_req, res) => {
  try {
    await prisma.quotationRequest.updateMany({
      where: { opened_at: null },
      data: { opened_at: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/quotations/:id', async (req, res) => {
  try {
    const { version, internal_notes, status, ...forbidden } = req.body;
    
    if (version === undefined) {
      return res.status(400).json({ success: false, message: 'Version is required'  });
    }

    if (Object.keys(forbidden).length > 0) {
      return res.status(400).json({ success: false, message: 'Bad Request: Only internal_notes and status can be modified.' });
    }

    const current = await prisma.quotationRequest.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ success: false, message: 'Not found'  });
    
    if (['Closed', 'Rejected'].includes(current.status)) {
      return res.status(403).json({ error: `Cannot edit a ${current.status} quote (Read Only)` });
    }

    if (current.version !== version) {
      return res.status(409).json({ success: false, message: 'Conflict: This record has been updated by another user. Please refresh.'  });
    }

    const updateData: Record<string, unknown> = {};
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
    if (status !== undefined) updateData.status = status;

    const quote = await prisma.quotationRequest.update({
      where: { id: req.params.id, version },
      data: {
        ...updateData,
        version: { increment: 1 }
      }
    });

    res.json({ success: true, data: quote });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(409).json({ success: false, message: 'Conflict: This record has been updated by another user. Please refresh.'  });
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error'  });
  }
});

const QUOTE_WORKFLOW = ['New', 'Contacted', 'Quoted', 'Rejected', 'Closed'];

router.patch('/quotations/:id/status', async (req, res) => {
  try {
    const { status, note, version } = req.body;
    
    if (version === undefined) {
      return res.status(400).json({ success: false, message: 'Version is required'  });
    }

    if (!QUOTE_WORKFLOW.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status'  });
    }

    const current = await prisma.quotationRequest.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ success: false, message: 'Not found'  });
    
    if (['Closed', 'Rejected'].includes(current.status)) {
      return res.status(403).json({ error: `Quote is already ${current.status}` });
    }
    
    if (current.version !== version) {
      return res.status(409).json({ success: false, message: 'Conflict: This record has been updated. Please refresh.'  });
    }

    const currentIndex = QUOTE_WORKFLOW.indexOf(current.status);
    const newIndex = QUOTE_WORKFLOW.indexOf(status);

    if (newIndex < currentIndex) {
      return res.status(400).json({ error: `Cannot move status backwards from ${current.status} to ${status}` });
    }
    if (!['Rejected', 'Closed'].includes(status) && newIndex !== currentIndex + 1) {
      return res.status(400).json({ error: `Must move to next sequential status. Next is ${QUOTE_WORKFLOW[currentIndex + 1]}` });
    }

    const updateData: Record<string, unknown> = {
      status,
      version: { increment: 1 }
    };
    
    const [quote, history] = await prisma.$transaction([
      prisma.quotationRequest.update({
        where: { id: req.params.id, version },
        data: updateData
      }),
      prisma.quoteStatusHistory.create({
        data: {
          quote_request_id: req.params.id,
          status,
          occurred_at: new Date(),
          note,
          updated_by: (req as any).user.id
        }
      })
    ]);

    res.json({ success: true, data: { quote, history } });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(409).json({ success: false, message: 'Conflict: This record has been updated. Please refresh.'  });
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error'  });
  }
});

router.patch('/quotations/:id/star', async (req, res) => {
  try {
    const { is_starred } = req.body;
    const item = await prisma.quotationRequest.update({
      where: { id: req.params.id },
      data: { is_starred }
    });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.post('/quotations/delete-bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: 'Invalid ids provided' });

    await deleteQuotes(ids);
    res.json({ success: true, data: { success: true } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

router.delete('/quotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await prisma.quotationRequest.findUnique({ where: { id } });
    if (!quote) return res.status(404).json({ success: false, message: 'Resource not found' });
    
    await deleteQuotes([id]);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/contact-messages', async (req, res) => {
  try {
    const { search, status, isStarred, dateFilter, startDate, endDate, page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: Record<string, unknown> = {};

    if (status === 'Needs Attention') {
      where.OR = [
        { is_starred: true },
        { responded: false }
      ];
    } else if (status) {
      if (status === 'To Be Responded') where.responded = false;
      if (status === 'Responded') where.responded = true;
    }
    
    if (isStarred === 'true' && status !== 'Needs Attention') {
      where.is_starred = true;
    }

    const dateRange = getDateRangeFilter(dateFilter as string, startDate as string, endDate as string);
    if (dateRange) {
      where.created_at = dateRange;
    }
    
    if (search) {
      const searchOR = [
        { contact_id: { contains: String(search), mode: 'insensitive' } },
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        { subject: { contains: String(search), mode: 'insensitive' } }
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchOR }
        ];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [items, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.contactSubmission.count({ where })
    ]);

    res.json({ success: true, data: {
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.get('/contact-messages/:id', async (req, res) => {
  try {
    let item = await prisma.contactSubmission.findUnique({
      where: { id: req.params.id }
    });
    
    if (!item) return res.status(404).json({ success: false, message: 'Resource not found' });
    
    if (!item.opened_at) {
      item = await prisma.contactSubmission.update({
        where: { id: req.params.id },
        data: { opened_at: new Date() }
      });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/contact-messages/:id/star', async (req, res) => {
  try {
    const { is_starred } = req.body;
    const item = await prisma.contactSubmission.update({
      where: { id: req.params.id },
      data: { is_starred }
    });
    res.json({ success: true, data: { item } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.patch('/contact-messages/read-all', async (_req, res) => {
  try {
    await prisma.contactSubmission.updateMany({
      where: { opened_at: null },
      data: { opened_at: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.patch('/contact-messages/:id/respond', async (req, res) => {
  try {
    const { responded } = req.body;
    const item = await prisma.contactSubmission.update({
      where: { id: req.params.id },
      data: { 
        responded,
        responded_at: responded ? new Date() : null
      }
    });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.post('/contact-messages/delete-bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: 'Invalid ids provided' });

    await deleteContactMessages(ids);
    res.json({ success: true, data: { success: true } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

router.delete('/contact-messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ success: false, message: 'Resource not found' });
    
    await deleteContactMessages([id]);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/notifications/unread-count', async (_req, res) => {
  try {
    const [unreadCount, unreadQuotes, unreadContacts] = await Promise.all([
      prisma.notification.count({ where: { read_at: null } }),
      prisma.quotationRequest.count({ where: { opened_at: null } }),
      prisma.contactSubmission.count({ where: { opened_at: null } })
    ]);
    res.json({ success: true, data: { unreadCount, unreadQuotes, unreadContacts } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const { search, status, type, dateFilter, startDate, endDate, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};

    if (status === 'Needs Attention') {
      where.OR = [
        { is_starred: true },
        { read_at: null }
      ];
    } else if (status) {
      if (status === 'Unread') where.read_at = null;
      if (status === 'Read') where.read_at = { not: null };
      if (status === 'Starred') where.is_starred = true;
    }

    if (type && type !== 'All') {
      where.type = type;
    }

    const dateRange = getDateRangeFilter(dateFilter as string, startDate as string, endDate as string);
    if (dateRange) {
      where.created_at = dateRange;
    }

    if (search) {
      const searchOR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { message: { contains: String(search), mode: 'insensitive' } }
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchOR }
        ];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { read_at: null } }) // Global unread count for bell
    ]);

    res.json({ success: true, data: {
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      unreadCount
    } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.get('/notifications/:id', async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found'  });
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.delete('/notifications/cleanup', async (_req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const result = await prisma.notification.deleteMany({
      where: { created_at: { lt: ninetyDaysAgo } }
    });
    res.json({ success: true, count: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.post('/notifications/delete-bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid ids provided' });
    }
    await deleteNotifications(ids);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/notifications/read-all', async (_req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { read_at: { not: null } }
    });
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.delete('/notifications/:id', async (req, res) => {
  try {
    await deleteNotifications([req.params.id]);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/notifications/read-bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid ids provided'  });
    }
    await prisma.notification.updateMany({
      where: { id: { in: ids }, read_at: null },
      data: { read_at: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.patch('/notifications/read-all', async (_req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { read_at: null },
      data: { read_at: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read_at: new Date() }
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});

router.patch('/notifications/:id/star', async (req, res) => {
  try {
    const { is_starred } = req.body;
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { is_starred }
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});


// --- Reports & Analytics ---

router.get('/reports/analytics', async (req, res) => {
  try {
    const { dateFilter, startDate, endDate } = req.query;
    
    // We will use standard DateRange for createdAt / booked_date queries
    const shipmentDateWhere = getDateRangeFilter(dateFilter as string, startDate as string, endDate as string);
    const standardDateWhere = getDateRangeFilter(dateFilter as string, startDate as string, endDate as string);
    
    const shipmentWhere = shipmentDateWhere ? { booked_date: shipmentDateWhere } : {};
    const standardWhere = standardDateWhere ? { created_at: standardDateWhere } : {};

    // 1. Shipment Analytics
    const [
      totalShipments,
      shipmentsWithProfit,
      shipmentStatusGroup,
      shipmentCourierGroup,
      shipmentServiceGroup,
      shipmentTypeGroup,
    ] = await Promise.all([
      prisma.shipment.count({ where: shipmentWhere }),
      prisma.shipment.findMany({ 
        where: { ...shipmentWhere, is_active: true },
        select: { profit: true, received_amount: true, booked_date: true } 
      }),
      prisma.shipment.groupBy({ by: ['current_status'], _count: { _all: true }, where: shipmentWhere }),
      prisma.shipment.groupBy({ by: ['courier'], _count: { _all: true }, where: shipmentWhere }),
      prisma.shipment.groupBy({ by: ['service'], _count: { _all: true }, where: shipmentWhere }),
      prisma.shipment.groupBy({ by: ['tracking_type'], _count: { _all: true }, where: shipmentWhere })
    ]);

    const totalRevenue = shipmentsWithProfit.reduce((acc: number, s: { received_amount: number | null; profit: number | null; }) => acc + (s.received_amount || 0), 0);
    const totalProfit = shipmentsWithProfit.reduce((acc: number, s: { received_amount: number | null; profit: number | null; }) => acc + (s.profit || 0), 0);
    
    // Revenue & Profit Time Series
    const revenueByDate: Record<string, { revenue: number, profit: number }> = {};
    shipmentsWithProfit.forEach((s: { booked_date?: Date | null; received_amount?: number | null; profit?: number | null; }) => {
      const dateStr = s.booked_date ? s.booked_date.toISOString().split('T')[0] : 'Unknown';
      if (!revenueByDate[dateStr]) revenueByDate[dateStr] = { revenue: 0, profit: 0 };
      revenueByDate[dateStr].revenue += (s.received_amount || 0);
      revenueByDate[dateStr].profit += (s.profit || 0);
    });
    
    const revenueTimeSeries = Object.entries(revenueByDate).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 2. Quote Analytics
    const [
      totalQuotes
    ] = await Promise.all([
      prisma.quotationRequest.count({ where: standardWhere })
    ]);

    // 3. Contact Analytics
    const [
      totalContacts,
      contactsByStatus,
      contactsTimeSeriesRaw
    ] = await Promise.all([
      prisma.contactSubmission.count({ where: standardWhere }),
      prisma.contactSubmission.groupBy({ by: ['responded'], _count: { _all: true }, where: standardWhere }),
      prisma.contactSubmission.findMany({ where: standardWhere, select: { created_at: true } })
    ]);

    const contactStatusCounts = {
      responded: contactsByStatus.find((c: { responded: boolean; _count: { _all: number; } }) => c.responded)?._count._all || 0,
      pending: contactsByStatus.find((c: { responded: boolean; _count: { _all: number; } }) => !c.responded)?._count._all || 0
    };

    const contactsByDate: Record<string, number> = {};
    contactsTimeSeriesRaw.forEach((c: { created_at: Date; }) => {
      const dateStr = c.created_at.toISOString().split('T')[0];
      contactsByDate[dateStr] = (contactsByDate[dateStr] || 0) + 1;
    });

    const contactsTimeSeries = Object.entries(contactsByDate).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Notification Analytics
    const [
      totalNotifications,
      notificationsByType,
      unreadNotifications
    ] = await Promise.all([
      prisma.notification.count({ where: standardWhere }),
      prisma.notification.groupBy({ by: ['type'], _count: { _all: true }, where: standardWhere }),
      prisma.notification.count({ where: { ...standardWhere, read_at: null } })
    ]);

    res.json({ success: true, data: {
      shipments: {
        total: totalShipments,
        revenue: totalRevenue,
        profit: totalProfit,
        statusDistribution: shipmentStatusGroup.map((g: { current_status: string; _count: { _all: number; } }) => ({ name: g.current_status, value: g._count._all })),
        courierDistribution: shipmentCourierGroup.map((g: { courier: string | null; _count: { _all: number; } }) => ({ name: g.courier || 'Unknown', value: g._count._all })),
        serviceDistribution: shipmentServiceGroup.map((g: { service: string | null; _count: { _all: number; } }) => ({ name: g.service || 'Unknown', value: g._count._all })),
        typeDistribution: shipmentTypeGroup.map((g: { tracking_type: string; _count: { _all: number; } }) => ({ name: g.tracking_type, value: g._count._all })),
        revenueTimeSeries
      },
      quotes: {
        total: totalQuotes
      },
      contacts: {
        total: totalContacts,
        statusCounts: contactStatusCounts,
        timeSeries: contactsTimeSeries
      },
      notifications: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: totalNotifications - unreadNotifications,
        typeDistribution: notificationsByType.map((g: { type: string; _count: { _all: number; } }) => ({ name: g.type, value: g._count._all }))
      }
    } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error'  });
  }
});




// --- Settings Endpoints ---

router.get('/settings', async (_req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Mask secret values before sending to the client
    const maskedSettings = (settings as { key: string; value: string; is_secret: boolean; }[]).reduce((acc: Record<string, string>, setting) => {
      acc[setting.key] = setting.is_secret && setting.value ? '********' : setting.value;
      return acc;
    }, {} as Record<string, string>);

    res.json({ success: true, data: maskedSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings'  });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const updates = req.body; // expected format: { key: value, ... }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload'  });
    }

    const keys = Object.keys(updates);
    
    // Fetch current settings to know which are secrets
    const existingSettings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } }
    }) as { key: string; value: string; is_secret: boolean; }[];
    const existingSettingsMap = new Map(existingSettings.map(s => [s.key, s]));

    const transactionOperations = [];

    for (const [key, value] of Object.entries(updates)) {
      const existing = existingSettingsMap.get(key);
      const isSecretKey = key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') || key.toLowerCase().includes('api_key');
      const isSecret = existing?.is_secret || isSecretKey;

      // If it's a secret and the client sent the masked string, skip it.
      if (isSecret && value === '********') {
        continue;
      }

      transactionOperations.push(
        prisma.systemSetting.upsert({
          where: { key },
          update: { 
            value: String(value),
            is_secret: isSecret 
          },
          create: { 
            key, 
            value: String(value),
            is_secret: isSecret 
          }
        })
      );
    }

    if (transactionOperations.length > 0) {
      await prisma.$transaction(transactionOperations);
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings'  });
  }
});


// --- Services Endpoints ---

router.get('/services', async (_req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { display_order: 'asc' }
    });
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services'  });
  }
});

router.post('/services', async (req, res) => {
  try {
    const { name, description, display_order, is_enabled } = req.body;
    let { slug } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Service name is required'  });
    }
    
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    const existingName = await prisma.service.findFirst({ where: { name } });
    if (existingName) return res.status(400).json({ success: false, message: 'Service with this name already exists'  });
    
    const existingSlug = await prisma.service.findFirst({ where: { slug } });
    if (existingSlug) return res.status(400).json({ success: false, message: 'Service with this slug already exists'  });

    const service = await prisma.service.create({
      data: { name, slug, description, display_order, is_enabled }
    });
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service'  });
  }
});

router.patch('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, display_order, is_enabled } = req.body;
    let { slug } = req.body;
    
    if (name && name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Service name is required'  });
    }
    
    if (name && !slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    if (name) {
      const existingName = await prisma.service.findFirst({ where: { name, id: { not: id } } });
      if (existingName) return res.status(400).json({ success: false, message: 'Service with this name already exists'  });
    }
    
    if (slug) {
      const existingSlug = await prisma.service.findFirst({ where: { slug, id: { not: id } } });
      if (existingSlug) return res.status(400).json({ success: false, message: 'Service with this slug already exists'  });
    }

    const dataToUpdate: Record<string, unknown> = { description, display_order, is_enabled };
    if (name) dataToUpdate.name = name;
    if (slug) dataToUpdate.slug = slug;

    const service = await prisma.service.update({
      where: { id },
      data: dataToUpdate
    });
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service'  });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found'  });

    // Check if referenced in active shipments
    const shipmentsUsing = await prisma.shipment.count({
      where: {
        OR: [
          { service: service.name },
          { service: service.slug }
        ],
        current_status: {
          notIn: ['Delivered', 'Cancelled', 'Returned', 'Failed', 'Closed']
        }
      }
    });

    if (shipmentsUsing > 0) {
      return res.status(400).json({ success: false, message: 'This item is currently being used by active shipments and cannot be deleted.' 
       });
    }

    await prisma.service.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Service permanently deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service'  });
  }
});


router.post('/services/reorder', async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, display_order }
    const transaction = items.map((item: { id: string; display_order: number; }) => 
      prisma.service.update({
        where: { id: item.id },
        data: { display_order: item.display_order }
      })
    );
    await prisma.$transaction(transaction);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reorder services'  });
  }
});

router.post('/service-through/reorder', async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, display_order }
    const transaction = items.map((item: { id: string; display_order: number; }) => 
      prisma.serviceThrough.update({
        where: { id: item.id },
        data: { display_order: item.display_order }
      })
    );
    await prisma.$transaction(transaction);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reorder service-through'  });
  }
});

// --- Service Through Endpoints ---

router.get('/service-through', async (_req, res) => {
  try {
    const items = await prisma.serviceThrough.findMany({
      orderBy: { display_order: 'asc' }
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching service-through:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service-through'  });
  }
});

router.post('/service-through', async (req, res) => {
  try {
    const { name, display_order, is_enabled } = req.body;
    let { slug } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Service Through name is required'  });
    }
    
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    const existingName = await prisma.serviceThrough.findFirst({ where: { name } });
    if (existingName) return res.status(400).json({ success: false, message: 'Item with this name already exists'  });
    
    const existingSlug = await prisma.serviceThrough.findFirst({ where: { slug } });
    if (existingSlug) return res.status(400).json({ success: false, message: 'Item with this slug already exists'  });

    const item = await prisma.serviceThrough.create({
      data: { name, slug, display_order, is_enabled }
    });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating service-through:', error);
    res.status(500).json({ success: false, message: 'Failed to create service-through'  });
  }
});

router.patch('/service-through/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order, is_enabled } = req.body;
    let { slug } = req.body;
    
    if (name && name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Service Through name is required'  });
    }
    
    if (name && !slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    if (name) {
      const existingName = await prisma.serviceThrough.findFirst({ where: { name, id: { not: id } } });
      if (existingName) return res.status(400).json({ success: false, message: 'Item with this name already exists'  });
    }
    
    if (slug) {
      const existingSlug = await prisma.serviceThrough.findFirst({ where: { slug, id: { not: id } } });
      if (existingSlug) return res.status(400).json({ success: false, message: 'Item with this slug already exists'  });
    }

    const dataToUpdate: Record<string, unknown> = { display_order, is_enabled };
    if (name) dataToUpdate.name = name;
    if (slug) dataToUpdate.slug = slug;

    const item = await prisma.serviceThrough.update({
      where: { id },
      data: dataToUpdate
    });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating service-through:', error);
    res.status(500).json({ success: false, message: 'Failed to update service-through'  });
  }
});

router.delete('/service-through/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.serviceThrough.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found'  });

    const shipmentsUsing = await prisma.shipment.count({
      where: {
        OR: [
          { service_through: item.name },
          { service_through: item.slug }
        ],
        current_status: {
          notIn: ['Delivered', 'Cancelled', 'Returned', 'Failed', 'Closed']
        }
      }
    });

    if (shipmentsUsing > 0) {
      return res.status(400).json({ success: false, message: 'This item is currently being used by active shipments and cannot be deleted.' 
       });
    }

    await prisma.serviceThrough.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    console.error('Error deleting service-through:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service-through'  });
  }
});

// --- Admin Account Endpoints ---

router.get('/account/me', async (req, res) => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: (req as any).user.id },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        mobile_number: true,
        role: true
      }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found'  });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch account'  });
  }
});

router.patch('/account/me', async (req, res) => {
  try {
    const { full_name, username, email, mobile_number } = req.body;
    
    if (username) {
      const existingUser = await prisma.adminUser.findFirst({ where: { username, id: { not: (req as any).user.id } } });
      if (existingUser) return res.status(400).json({ success: false, message: 'Username already taken'  });
    }

    if (email) {
      const existingEmail = await prisma.adminUser.findFirst({ where: { email, id: { not: (req as any).user.id } } });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already taken'  });
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id: (req as any).user.id },
      data: { full_name, username, email, mobile_number },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        mobile_number: true,
        role: true
      }
    });
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update account'  });
  }
});

router.post('/account/password-update', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    
    const user = await prisma.adminUser.findUnique({ where: { id: (req as any).user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found'  });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid current password'  });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { password_hash: hash }
    });
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password'  });
  }
});

router.post('/account/username-update', async (req, res) => {
  try {
    const { currentUsername, newUsername, confirmUsername } = req.body;
    const userId = (req as any).user.id;

    if (!currentUsername || !newUsername || !confirmUsername) {
      return res.status(400).json({ success: false, message: 'All fields are required'  });
    }

    if (newUsername !== confirmUsername) {
      return res.status(400).json({ success: false, message: 'New usernames do not match'  });
    }

    if (newUsername.length < 4 || newUsername.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be between 4 and 30 characters'  });
    }

    if (!/^[a-zA-Z0-9_\.]+$/.test(newUsername)) {
      return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, underscores, and dots'  });
    }

    const user = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found'  });

    if (user.username !== currentUsername) {
      return res.status(400).json({ success: false, message: 'Incorrect current username'  });
    }

    const existing = await prisma.adminUser.findFirst({ where: { username: newUsername, id: { not: userId } } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already exists'  });
    }

    await prisma.adminUser.update({
      where: { id: userId },
      data: { username: newUsername }
    });

    res.json({ success: true, message: 'Username updated successfully' });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ success: false, message: 'Failed to update username'  });
  }
});


// --- Push Notifications ---

router.get('/push/vapid-public-key', (req, res) => {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BNAqPXzCPoBqtz9vsXbnZq5zdFcF_9ddDGmUx5KHQCzgO2ru0p2VMw7LgS3oS8UxHVEon0PJIvws1lYiWHNIrg4';
  if (!publicKey) {
    return res.status(500).json({ success: false, message: 'VAPID public key not configured on server' });
  }
  res.json({ success: true, publicKey });
});

router.post('/push/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = (req as any).user?.userId;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' });
    }

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          admin_id: userId
        }
      });
    } else if (existing.admin_id !== userId) {
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: { admin_id: userId }
      });
    }

    res.json({ success: true, message: 'Subscribed' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
});

router.post('/push/test', async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    console.log(`[WebPush] Test notification requested by admin ${userId}`);
    
    // We await it here so the admin gets an immediate confirmation of delivery success/failure
    await pushService.broadcastToAdmins({
      title: '🔔 Test Notification',
      message: 'Push notifications are working correctly on Vercel.',
      url: '/admin/dashboard',
      submissionId: 'test-' + Date.now(),
      type: 'test'
    });

    res.json({ success: true, message: 'Test notification triggered' });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

router.post('/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint required' });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint }
    });

    res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
  }
});

export default router;
