// Dashboard accepts the same filters as the player list, plus an optional reference date
const Joi = require('joi');
const { listQuerySchema } = require('./players');

const dashboardQuerySchema = listQuerySchema
  .fork(['page', 'limit', 'sort', 'order'], (field) => field.strip()) // not used here
  .keys({ asOf: Joi.date().iso() });

module.exports = { dashboardQuerySchema };
