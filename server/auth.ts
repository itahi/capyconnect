import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from '@neondatabase/serverless';
import type { Request, Response, NextFunction } from 'express';
import type { UserProfile } from '@shared/schema';

const pgStore = connectPgSimple(session);

// Create session store
const sessionStore = new pgStore({
  pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  tableName: 'sessions',
  createTableIfMissing: false, // We already created it in our schema
});

// Session configuration
export const sessionConfig = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
});

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

// Auth middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Optional auth middleware (adds user to request if logged in)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    try {
      const { storage } = await import('./storage');
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }
  next();
};

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}