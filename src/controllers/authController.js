const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usersModel = require('../models/users');
const dotenv = require('dotenv');
dotenv.config();

async function login(req, res) {
  const { email, password } = req.body;
  const user = await usersModel.findByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const access = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXP || '15m' });
  const refresh = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXP || '7d' });

  res.json({ access_token: access, refresh_token: refresh });
}

function refresh(req, res) {
  const { refresh_token } = req.body;
  try {
    const payload = jwt.verify(refresh_token, process.env.JWT_SECRET);
    const access = jwt.sign({ sub: payload.sub }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXP || '15m' });
    res.json({ access_token: access });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

module.exports = { login, refresh };
