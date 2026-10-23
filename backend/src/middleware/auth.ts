import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'novotion_sales_lead_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    role: 'LEAD_TEAM' | 'SALES_TEAM' | 'ADMIN';
    identifier: string; // username for ADMIN, key value for others
    id: string; // user ID or key ID
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: 'No token provided. Authentication required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      role: decoded.role,
      identifier: decoded.identifier,
      id: decoded.id,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

export const requireRole = (allowedRoles: ('LEAD_TEAM' | 'SALES_TEAM' | 'ADMIN')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
      return;
    }

    next();
  };
};