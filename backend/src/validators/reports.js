// Rules for scouting reports
const Joi = require('joi');

const score = Joi.number().integer().min(1).max(10).required();
const textList = Joi.array().items(Joi.string().trim().min(1).max(300)).max(10).default([]);

const reportSchema = Joi.object({
  playerId: Joi.number().integer().min(1).required(),
  matchDate: Joi.date().iso().required(),
  opponent: Joi.string().trim().min(1).max(100).required(),
  competition: Joi.string().trim().max(100).allow(null, ''),
  venue: Joi.string().trim().max(100).allow(null, ''),
  result: Joi.string().trim().max(50).allow(null, ''),
  minutesPlayed: Joi.number().integer().min(0).max(130).allow(null),
  positionPlayed: Joi.string().trim().max(50).allow(null, ''),
  technical: score,
  physical: score,
  mental: score,
  tactical: score,
  finishing: score,
  passing: score,
  dribbling: score,
  defending: score,
  leadership: score,
  workRate: score,
  overallRating: score,
  strengths: textList,
  weaknesses: textList,
  keyMoments: textList,
  recommendation: Joi.string().valid('SIGN', 'MONITOR', 'PASS').required(),
  summary: Joi.string().trim().max(2000).allow(null, ''),
  notes: Joi.string().trim().max(5000).allow(null, ''),
});

// Update: every field optional, at least one required, and no defaults
// (otherwise editing one field would wipe the strengths/weaknesses lists)
const listWithoutDefault = Joi.array().items(Joi.string().trim().min(1).max(300)).max(10);
const updateReportSchema = reportSchema
  .fork(Object.keys(reportSchema.describe().keys), (field) => field.optional())
  .keys({ strengths: listWithoutDefault, weaknesses: listWithoutDefault, keyMoments: listWithoutDefault })
  .min(1)
  .messages({ 'object.min': 'Send at least one field to update.' });

const reportListQuerySchema = Joi.object({
  playerId: Joi.number().integer().min(1),
  scoutId: Joi.number().integer().min(1),
  recommendation: Joi.string().valid('SIGN', 'MONITOR', 'PASS'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
});

module.exports = { reportSchema, updateReportSchema, reportListQuerySchema };
