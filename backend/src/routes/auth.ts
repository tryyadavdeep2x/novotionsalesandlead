import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'novotion_sales_lead_secret_jwt_key_2026';

// Unified Login Endpoint
router.post('/login', async (req, res): Promise<any> => {
  const { type, accessKey, username, password } = req.body;

  try {
    if (type === 'KEY') {
      if (!accessKey || !String(accessKey).trim()) {
        return res.status(400).json({ error: 'Access Key is required' });
      }

      const cleanKey = String(accessKey).trim();

      // Look up key in DB (exact match first)
      let dbKey = await prisma.accessKey.findUnique({
        where: { key: cleanKey },
      });

      // Fallback: check case-insensitive match
      if (!dbKey) {
        dbKey = await prisma.accessKey.findFirst({
          where: {
            OR: [
              { key: cleanKey.toUpperCase() },
              { key: cleanKey.toLowerCase() },
            ],
          },
        });
      }

      if (!dbKey) {
        return res.status(401).json({ error: 'Access Key not found. Please verify the key token.' });
      }

      if (!dbKey.isActive) {
        return res.status(401).json({ error: 'This Access Key has been deactivated. Contact Admin.' });
      }

      // Sign JWT token
      const token = jwt.sign(
        { id: dbKey.id, role: dbKey.role, identifier: dbKey.key },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      // Set cookie with root path
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Set to true in prod
        sameSite: 'lax',
        path: '/',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      });

      return res.json({
        message: 'Login successful',
        token,
        user: {
          role: dbKey.role,
          identifier: dbKey.key,
        },
      });
    } else if (type === 'ADMIN') {
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and Password are required' });
      }

      const admin = await prisma.userAdmin.findUnique({
        where: { username },
      });

      if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, role: 'ADMIN', identifier: admin.username },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Set to true in prod
        sameSite: 'lax',
        path: '/',
        maxAge: 12 * 60 * 60 * 1000,
      });

      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          role: 'ADMIN',
          identifier: admin.username,
        },
      });
    } else {
      return res.status(400).json({ error: 'Invalid login type specified' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Logout Endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// Get Current User Context
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;