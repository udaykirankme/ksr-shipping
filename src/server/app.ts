import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';

const app = express();

app.set('etag', false);
app.disable('x-powered-by');

app.use(express.json());
app.use(cookieParser());

app.use((_req, res, next) => {
  if (!res.getHeader('Cache-Control')) {
    res.set('Cache-Control', 'private, no-cache');
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

 
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
