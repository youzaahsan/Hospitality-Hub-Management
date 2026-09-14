import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/types';
import { Users } from '../db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'luxurystay_super_secret_jwt_key_2026';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: { _id: string; name: string; email: string; role: UserRole }): string {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await Users.findById(decoded._id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User account is inactive or no longer exists.' });
      return;
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token.',
    });
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized for this resource. Required: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}
