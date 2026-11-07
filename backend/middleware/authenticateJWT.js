import jwt from 'jsonwebtoken';

// You should store this in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Middleware: Authenticate user via JWT token.
 * Token can be sent in:
 * - Authorization header: "Bearer <token>"
 * - Cookie: "token"
 * - Query parameter: ?token=...
 * 
 * Attaches `req.user` with decoded token payload.
 */
export const authenticate = (req, res, next) => {
  // 1. Try to extract token from various sources
  let token = null;

  // Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Cookie (if using cookie-parser)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Query parameter (optional, for debugging)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user data to request
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: Check if authenticated user is an admin.
 * Must be used AFTER `authenticate`.
 * Expects `req.user` to have either:
 * - `isAdmin: true`
 * - `role: 'admin'`
 * - `role: 'superadmin'`
 */
export const isAdmin = (req, res, next) => {
  // Ensure user is attached (authenticate ran successfully)
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  // Check admin status – adapt to your User model
  const isAdminUser = 
    req.user.isAdmin === true || 
    req.user.role === 'admin' || 
    req.user.role === 'superadmin';

  if (!isAdminUser) {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }

  next();
};