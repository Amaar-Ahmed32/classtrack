// Auth routes: register, login, refresh, me.
// All responses return { user, accessToken, refreshToken } (except /me).
// Passwords are never returned — see User.toSafeJSON().
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, signTokens } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, schoolName } = req.body;
    if (!name || !email || !password) {
      const err = new Error('name, email and password are required');
      err.status = 400;
      throw err;
    }
    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }
    const user = await User.create({ name, email, passwordHash: password, schoolName });
    res.status(201).json({ user: user.toSafeJSON(), ...signTokens(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user || !(await user.comparePassword(password || ''))) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }
    res.json({ user: user.toSafeJSON(), ...signTokens(user) });
  } catch (err) {
    next(err);
  }
});

// Exchange a valid refresh token for a fresh token pair.
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      const err = new Error('refreshToken is required');
      err.status = 400;
      throw err;
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error('User no longer exists');
      err.status = 401;
      throw err;
    }
    res.json({ user: user.toSafeJSON(), ...signTokens(user) });
  } catch (err) {
    err.status = err.status || 401;
    next(err);
  }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
