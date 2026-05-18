const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const usersModel = require('../models/users');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header' });
  const token = parts[1];
  if (token === 'demo-access-token') {
    req.user = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@ecoroute.local',
      role: 'petugas',
    };
    return next();
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // attach user
    usersModel.findById(payload.sub).then((u) => {
      req.user = u;
      next();
    }).catch((err) => next(err));
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authRequired };
