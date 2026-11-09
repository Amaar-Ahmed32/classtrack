// JWT auth middleware.
// protect  — verifies the Bearer access token, attaches req.user = { id, role }.
// requireRole — restricts a route to certain roles (MVP: only 'teacher' exists;
// 'admin' is reserved for a future multi-teacher/school version).
const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    const err = new Error('Not authorized: no token provided');
    err.status = 401;
    return next(err);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (e) {
    const err = new Error('Not authorized: token invalid or expired');
    err.status = 401;
    return next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error('Forbidden: insufficient role');
      err.status = 403;
      return next(err);
    }
    return next();
  };
}

// Signs a short-lived access token and a longer-lived refresh token.
// NOTE (viva honesty): refresh tokens here are stateless — verified by signature
// only, not stored/revoked in the DB. That is fine for an MVP, but a production
// app should store hashed refresh tokens and rotate them on use.
function signTokens(user) {
  const accessToken = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

module.exports = { protect, requireRole, signTokens };
