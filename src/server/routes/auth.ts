import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import rateLimit from 'express-rate-limit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many login attempts, please try again later.'
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and password are required' });
    }
    
    const user = await prisma.adminUser.findFirst({ 
      where: { 
        OR: [
          { username: identifier },
          { email: identifier }
        ]
      } 
    });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    res.json({ success: true, data: { message: 'Logged in successfully', user: { id: user.id, username: user.username, role: user.role } } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

router.get('/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    return res.json({
      success: true,
      data: {
        user: {
          id: decoded.id,
          role: decoded.role,
        },
      },
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

export default router;
