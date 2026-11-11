// Rules for what a valid register/login request looks like
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(100).required()
    .messages({ 'string.min': 'Password must be at least 8 characters.' }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
