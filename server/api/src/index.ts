import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Clean up notifications older than 90 days every 24 hours
setInterval(async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    await prisma.notification.deleteMany({
      where: { created_at: { lt: ninetyDaysAgo } }
    });
    console.log('Periodic notification cleanup completed.');
  } catch (err) {
    console.error('Periodic notification cleanup failed:', err);
  }
}, 24 * 60 * 60 * 1000);

app.listen(port as number, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
