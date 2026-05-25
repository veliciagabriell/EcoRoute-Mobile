const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usersModel = require('../models/users');
const dotenv = require('dotenv');
dotenv.config();

/**
 * @route POST /api/auth/register
 * Mendaftarkan user baru. Mengembalikan profil user (tanpa password).
 */
async function register(req, res, next) {
  try {
    console.log('[Auth] Register request:', { email: req.body.email, role: req.body.role });
    const { name, email, password, role } = req.body;

    // Cek apakah email sudah terdaftar
    const existing = await usersModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password
    const SALT_ROUNDS = 10;
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Buat user baru (role default 'umum' jika tidak diberikan)
    const allowedRoles = ['umum', 'petugas', 'admin'];
    const assignedRole = allowedRoles.includes(role) ? role : 'umum';

    let newUser;
    try {
      newUser = await usersModel.create({
        name,
        email,
        password_hash,
        role: assignedRole,
        work_area: null,
        fcm_token: null,
      });
    } catch (err) {
      const msg = typeof err?.message === 'string' ? err.message : '';
      const isEnumError = msg.includes('invalid input value for enum user_role');
      if (isEnumError && assignedRole === 'umum') {
        newUser = await usersModel.create({
          name,
          email,
          password_hash,
          role: 'public',
          work_area: null,
          fcm_token: null,
        });
      } else {
        throw err;
      }
    }

    // Hilangkan password_hash sebelum dikirim
  const { password_hash: passwordHash, ...userProfile } = newUser;
  void passwordHash;
    const normalizedProfile = {
      ...userProfile,
      role: userProfile.role === 'public' ? 'umum' : userProfile.role,
    };
    console.log('[Auth] Register success:', { id: userProfile.id, email: userProfile.email });

    return res.status(201).json({
      message: 'Registrasi berhasil',
      user: normalizedProfile,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    next(err);
  }
}

/**
 * @route POST /api/auth/login
 * Login dengan email dan password. Mengembalikan access_token dan refresh_token.
 */
async function login(req, res, next) {
  try {
    console.log('[Auth] Login request:', { email: req.body.email });
    const { email, password } = req.body;

    const user = await usersModel.findByEmail(email);
    if (!user) {
      console.log('[Auth] Login failed: user not found');
      return res.status(401).json({ error: 'Email atau kata sandi salah' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.log('[Auth] Login failed: password mismatch');
      return res.status(401).json({ error: 'Email atau kata sandi salah' });
    }

    const access = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXP || '15m' }
    );
    const refresh = jwt.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXP || '7d' }
    );

    // Hilangkan password_hash sebelum dikirim
  const { password_hash: passwordHash, ...userProfile } = user;
  void passwordHash;
    const normalizedProfile = {
      ...userProfile,
      role: userProfile.role === 'public' ? 'umum' : userProfile.role,
    };
    console.log('[Auth] Login success:', { id: userProfile.id, email: userProfile.email, role: userProfile.role });

    return res.json({
      access_token: access,
      refresh_token: refresh,
      user: normalizedProfile,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    next(err);
  }
}

/**
 * @route POST /api/auth/refresh
 * Memperbarui access_token menggunakan refresh_token.
 */
function refresh(req, res) {
  const { refresh_token } = req.body;
  try {
    const payload = jwt.verify(refresh_token, process.env.JWT_SECRET);
    const access = jwt.sign(
      { sub: payload.sub },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXP || '15m' }
    );
    res.json({ access_token: access });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token tidak valid atau sudah kedaluwarsa' });
  }
}

/**
 * @route GET /api/auth/me
 * Mengembalikan profil user yang sedang login (membutuhkan JWT).
 */
async function me(req, res, next) {
  try {
  const { password_hash: passwordHash, ...userProfile } = req.user;
  void passwordHash;
    return res.json(userProfile);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, me };
