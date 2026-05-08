const Joi = require('joi');

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

module.exports = { loginSchema, iotDataSchema };
