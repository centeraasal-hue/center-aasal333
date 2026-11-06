import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import db from './db.js';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'assal-secure-secret-key-2026-alexandria-egypt';

export interface AdminPayload {
  id: number;
  username: string;
  display_name: string;
}

export function generateAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Or check cookie
  if (!token && req.cookies && req.cookies.assal_admin_jwt) {
    token = req.cookies.assal_admin_jwt;
  }

  if (!token) {
    res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول كمسؤول أولاً' });
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({ error: 'جلسة تسجيل الدخول منتهية أو غير صالحة' });
    return;
  }

  try {
    // Check if admin user still exists in database
    const user = db.prepare('SELECT id, username, display_name FROM admin_users WHERE id = ?').get(payload.id);
    if (!user) {
      res.status(401).json({ error: 'المستخدم الإداري غير موجود' });
      return;
    }
    (req as any).admin = user;
    next();
  } catch (err: any) {
    console.error('requireAdminAuth DB error:', err);
    res.status(500).json({ error: 'خطأ في التحقق من صلاحيات المدير' });
  }
}
