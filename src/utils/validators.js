const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Nama tidak boleh kosong',
    'string.min': 'Nama minimal 2 karakter',
    'any.required': 'Nama wajib diisi',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Kata sandi minimal 6 karakter',
    'any.required': 'Kata sandi wajib diisi',
  }),
  role: Joi.string().valid('public', 'officer', 'umum', 'petugas', 'admin').default('public').messages({
    'any.only': 'Role harus salah satu dari: public, officer, umum, petugas, admin',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const iotDataSchema = Joi.object({
  device_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  ammonia_ppm: Joi.number().required(),
  fullness_pct: Joi.number().required(),
  is_critical: Joi.boolean().optional(),
  battery_pct: Joi.number().optional(),
});

module.exports = { registerSchema, loginSchema, iotDataSchema };
