import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'crypto';
import { pushService } from '../push-service';

const router = Router();

router.get('/db-health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const adminCount = await prisma.adminUser.count();
    res.json({
      success: true,
      data: {
        database: 'connected',
        admin_users: adminCount,
      },
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      hint: 'Set DATABASE_URL on the server, run npm run db:push, then npm run db:seed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

router.post('/track', apiLimiter, async (req, res) => {
  try {
    const { trackingNumber } = req.body;
    
    if (!trackingNumber) {
      return res.status(400).json({ success: false, message: 'Tracking number is required' });
    }

    // Always search our DB using tracking_id OR official_tracking_id
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { tracking_id: trackingNumber },
          { official_tracking_id: trackingNumber }
        ]
      },
      include: { history: { orderBy: { occurred_at: 'desc' } } }
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    return res.json({ success: true, data: shipment });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const quoteSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email().max(150).optional().or(z.literal('')),
  pickup_location: z.string().max(255).optional(),
  drop_location: z.string().max(255).optional(),
  package_type: z.string().max(50).optional(),
  approx_weight: z.string().max(50).optional(),
  urgency: z.string().max(50).optional(),
  notes: z.string().optional(),
  shipment_type: z.string().max(50).optional()
});

function generateRandom10Digit(): string {
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += crypto.randomInt(0, 10).toString();
  }
  return id;
}

router.post('/quotations', apiLimiter, async (req, res) => {
  try {
    const parsed = quoteSchema.parse(req.body);
    
    let isUnique = false;
    let quote_id = '';
    
    const quote = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      while (!isUnique) {
        quote_id = 'KSRQ' + generateRandom10Digit();
        const existing = await tx.quotationRequest.findUnique({
          where: { quote_id }
        });
        if (!existing) {
          isUnique = true;
        }
      }

      let combinedNotes = parsed.notes || '';
      if (parsed.shipment_type) {
        combinedNotes = `Shipment Type: ${parsed.shipment_type}\n${combinedNotes}`.trim();
      }
      
      const dataToSave = parsed;

      const newQuote = await tx.quotationRequest.create({
        data: {
          ...dataToSave,
          notes: combinedNotes,
          quote_id,
          status: 'New',
          history: {
            create: {
              status: 'New',
              occurred_at: new Date(),
              note: 'Quote Request Created via Public Form'
            }
          }
        }
      });

      await tx.notification.create({
        data: {
          type: 'QUOTE_REQUEST',
          title: 'New Quote Request',
          message: `New request received from ${newQuote.name}.`,
          related_entity_id: newQuote.id,
          target_url: `/admin/dashboard/quotations/${newQuote.id}`
        }
      });

      return newQuote;
    });

    // Broadcast push notification
    pushService.broadcastToAdmins({
      title: 'New Quote Request',
      message: `New request received from ${quote.name}.`,
      url: `/admin/dashboard/quotations/${quote.id}`
    }).catch(console.error);

    res.json({ success: true, data: quote });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }
    console.error('Quote error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(150).optional().or(z.literal('')),
  subject: z.string().max(150).optional(),
  message: z.string().min(1)
});

router.post('/contact', apiLimiter, async (req, res) => {
  try {
    const parsed = contactSchema.parse(req.body);

    const contact = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Generate unique contact ID
      let isUnique = false;
      let contact_id = '';
      while (!isUnique) {
        contact_id = 'KSRC' + generateRandom10Digit();
        const existing = await tx.contactSubmission.findUnique({
          where: { contact_id }
        });
        if (!existing) {
          isUnique = true;
        }
      }

      const newContact = await tx.contactSubmission.create({
        data: {
          ...parsed,
          contact_id
        }
      });

      await tx.notification.create({
        data: {
          type: 'CONTACT_MESSAGE',
          title: 'New Contact Message',
          message: `New enquiry received from ${newContact.name}.`,
          related_entity_id: newContact.id,
          target_url: `/admin/dashboard/messages/${newContact.id}`
        }
      });

      return newContact;
    });

    // Broadcast push notification
    pushService.broadcastToAdmins({
      title: 'New Contact Message',
      message: `New enquiry received from ${contact.name}.`,
      url: `/admin/dashboard/messages/${contact.id}`
    }).catch(console.error);

    res.json({ success: true, data: contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }
    console.error('Contact error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
