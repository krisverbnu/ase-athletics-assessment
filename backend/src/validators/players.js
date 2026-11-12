// Rules for player requests: the list/filter query and the create/update body
const Joi = require('joi');

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const SORTABLE = [
  'name',
  'age',
  'position',
  'team',
  'nationality',
  'marketValue',
  'goals',
  'assists',
  'appearances',
  'contractEnd',
  'createdAt',
];

// "Forward,Midfielder" in the URL -> ['Forward', 'Midfielder']
// Each item is also checked (and converted) with itemSchema, so "1,2" -> [1, 2]
const commaList = (itemSchema) =>
  Joi.alternatives().try(
    Joi.array().items(itemSchema),
    Joi.string().custom((value, helpers) => {
      const items = [];
      for (const part of value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)) {
        const { value: item, error } = itemSchema.validate(part);
        if (error) return helpers.error('any.invalid');
        items.push(item);
      }
      return items;
    }),
  );

const range = Joi.number().min(0);

// GET /api/players?page=1&limit=25&sort=name&order=asc&position=Forward,Midfielder&ageMin=20 ...
const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  sort: Joi.string()
    .valid(...SORTABLE)
    .default('name'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  q: Joi.string().trim().max(100).allow(''),
  ids: commaList(Joi.number().integer()),
  position: commaList(Joi.string().valid(...POSITIONS)),
  team: commaList(Joi.string()),
  nationality: commaList(Joi.string()),
  ageMin: range,
  ageMax: range,
  valueMin: range,
  valueMax: range,
  goalsMin: range,
  goalsMax: range,
  assistsMin: range,
  assistsMax: range,
});

// GET /api/players/search?q=kane
const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
  limit: Joi.number().integer().min(1).max(20).default(8),
});

const rating = Joi.number().integer().min(1).max(100);
const attributesSchema = Joi.object({
  pace: rating.required(),
  shooting: rating.required(),
  passing: rating.required(),
  dribbling: rating.required(),
  defending: rating.required(),
  physical: rating.required(),
  positioning: rating.allow(null),
  finishing: rating.allow(null),
  crossing: rating.allow(null),
  longShots: rating.allow(null),
  diving: rating.allow(null),
  handling: rating.allow(null),
  kicking: rating.allow(null),
  reflexes: rating.allow(null),
});

const count = Joi.number().integer().min(0);
const optionalCount = count.allow(null);

// POST /api/players (create): required fields marked .required()
const playerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  position: Joi.string()
    .valid(...POSITIONS)
    .required(),
  detailedPosition: Joi.string().trim().max(50).allow(null, ''),
  age: Joi.number().integer().min(15).max(50).required(),
  team: Joi.string().trim().min(1).max(100).required(),
  league: Joi.string().trim().max(100).allow(null, ''),
  nationality: Joi.string().trim().min(2).max(60).required(),
  height: Joi.number().integer().min(140).max(220).allow(null),
  weight: Joi.number().integer().min(40).max(130).allow(null),
  preferredFoot: Joi.string().valid('Left', 'Right', 'Both').allow(null),
  jerseyNumber: Joi.number().integer().min(1).max(99).allow(null),
  imageUrl: Joi.string().uri().allow(null, ''),
  appearances: count.default(0),
  goals: count.default(0),
  assists: count.default(0),
  minutesPlayed: count.default(0),
  yellowCards: count.default(0),
  redCards: count.default(0),
  passAccuracy: Joi.number().min(0).max(100).allow(null),
  shotsOnTarget: optionalCount,
  totalShots: optionalCount,
  dribblesCompleted: optionalCount,
  tacklesWon: optionalCount,
  aerialDuelsWon: optionalCount,
  saves: optionalCount,
  cleanSheets: optionalCount,
  goalsConceded: optionalCount,
  contractSalary: Joi.number().integer().min(0).allow(null),
  contractEnd: Joi.date().iso().allow(null),
  marketValue: Joi.number().integer().min(0).allow(null),
  attributes: attributesSchema,
});

// PUT /api/players/:id (update): same rules, but every field is optional
// and at least one must be sent
const updatePlayerSchema = playerSchema
  .fork(['name', 'position', 'age', 'team', 'nationality'], (field) => field.optional())
  .fork(['appearances', 'goals', 'assists', 'minutesPlayed', 'yellowCards', 'redCards'], () => count) // no defaults on update, or we'd reset stats to 0
  .min(1)
  .messages({ 'object.min': 'Send at least one field to update.' });

const idParamSchema = Joi.object({ id: Joi.number().integer().min(1).required() });

module.exports = {
  POSITIONS,
  listQuerySchema,
  searchQuerySchema,
  playerSchema,
  updatePlayerSchema,
  idParamSchema,
};
