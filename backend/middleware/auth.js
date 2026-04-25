import jwt from 'jsonwebtoken';
import { getJwtSecretOrRespond } from '../utils/jwtConfig.js';

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token is required' });
  }

  const jwtSecret = getJwtSecretOrRespond(res);
  if (!jwtSecret) return;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded?.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }
    req.auth = {
      userId: Number(decoded.userId),
      email: decoded.email ? String(decoded.email) : null,
      is_admin: Boolean(decoded.is_admin),
      is_super_admin: Boolean(decoded.is_super_admin),
    };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!req.auth.is_admin && !req.auth.is_super_admin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
}

