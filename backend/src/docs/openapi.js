// OpenAPI (Swagger) description of the API, shown as an interactive page at /api/docs.
// Click "Authorize", paste a token from /auth/login, then "Try it out" on any endpoint.

const errorResponse = (description, example) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example } },
});

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };
const listParam = (name, description, example) => ({
  name,
  in: 'query',
  description,
  schema: { type: 'string' },
  example,
});
const numberParam = (name, description) => ({ name, in: 'query', description, schema: { type: 'number' } });

const unauthorized = errorResponse('Missing or expired token', { error: { message: 'Please log in to continue.' } });
const forbidden = errorResponse('Not your report', { error: { message: 'You can only change your own reports.' } });
const notFound = errorResponse('Not found', { error: { message: 'Player not found.' } });
const invalid = errorResponse('Invalid input', {
  error: { message: 'Some fields are invalid.', details: [{ field: 'age', message: '"age" must be a number' }] },
});

const playerFilters = [
  listParam('q', 'Text search across name, team and nationality', 'kane'),
  listParam('position', 'One or more positions, comma-separated', 'Forward,Midfielder'),
  listParam('team', 'One or more teams, comma-separated', 'Real Madrid'),
  listParam('nationality', 'One or more nationalities, comma-separated', 'Spain,France'),
  listParam('ids', 'Specific player ids, comma-separated (used by the comparison tool)', '1,2,3'),
  numberParam('ageMin', 'Minimum age'),
  numberParam('ageMax', 'Maximum age'),
  numberParam('valueMin', 'Minimum market value (EUR)'),
  numberParam('valueMax', 'Maximum market value (EUR)'),
  numberParam('goalsMin', 'Minimum goals'),
  numberParam('goalsMax', 'Maximum goals'),
  numberParam('assistsMin', 'Minimum assists'),
  numberParam('assistsMax', 'Maximum assists'),
];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'ASE Athletics Football Analytics API',
    version: '1.0.0',
    description:
      'REST API for managing players, scouting reports and dashboard analytics.\n\n' +
      '**Response format.** Success: `{ "data": ..., "meta": ... }`. Error: `{ "error": { "message", "details" } }`.\n\n' +
      '**Demo login:** demo@ase-athletics.com / demo123',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth', description: 'Register, log in, log out' },
    { name: 'Players', description: 'Player CRUD, search and filtering' },
    { name: 'Dashboard', description: 'Aggregated statistics' },
    { name: 'Reports', description: 'Scouting reports' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: {
                type: 'array',
                items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } },
          },
        },
      },
      Attributes: {
        type: 'object',
        required: ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'],
        properties: Object.fromEntries(
          [
            'pace',
            'shooting',
            'passing',
            'dribbling',
            'defending',
            'physical',
            'positioning',
            'finishing',
            'crossing',
            'longShots',
            'diving',
            'handling',
            'kicking',
            'reflexes',
          ].map((a) => [a, { type: 'integer', minimum: 1, maximum: 100 }]),
        ),
      },
      PlayerInput: {
        type: 'object',
        required: ['name', 'position', 'age', 'team', 'nationality'],
        properties: {
          name: { type: 'string', example: 'Lamine Yamal' },
          position: { type: 'string', enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] },
          detailedPosition: { type: 'string', example: 'Right Winger' },
          age: { type: 'integer', example: 18 },
          team: { type: 'string', example: 'Barcelona' },
          league: { type: 'string', example: 'La Liga' },
          nationality: { type: 'string', example: 'Spain' },
          height: { type: 'integer', description: 'cm', example: 180 },
          weight: { type: 'integer', description: 'kg', example: 72 },
          preferredFoot: { type: 'string', enum: ['Left', 'Right', 'Both'] },
          jerseyNumber: { type: 'integer', example: 19 },
          appearances: { type: 'integer', example: 30 },
          goals: { type: 'integer', example: 9 },
          assists: { type: 'integer', example: 13 },
          minutesPlayed: { type: 'integer', example: 2400 },
          passAccuracy: { type: 'number', example: 84.5 },
          contractSalary: { type: 'integer', description: 'Weekly, EUR', example: 60000 },
          contractEnd: { type: 'string', format: 'date', example: '2030-06-30' },
          marketValue: { type: 'integer', description: 'EUR', example: 150000000 },
          attributes: { $ref: '#/components/schemas/Attributes' },
        },
      },
      Player: {
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' }, sourceId: { type: 'string', example: 'main:2' } } },
          { $ref: '#/components/schemas/PlayerInput' },
        ],
      },
      PageMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      ReportInput: {
        type: 'object',
        required: [
          'playerId',
          'matchDate',
          'opponent',
          'technical',
          'physical',
          'mental',
          'tactical',
          'finishing',
          'passing',
          'dribbling',
          'defending',
          'leadership',
          'workRate',
          'overallRating',
          'recommendation',
        ],
        properties: {
          playerId: { type: 'integer', example: 1 },
          matchDate: { type: 'string', format: 'date', example: '2025-03-15' },
          opponent: { type: 'string', example: 'Atlético Madrid' },
          competition: { type: 'string', example: 'La Liga' },
          venue: { type: 'string', example: 'Santiago Bernabéu' },
          ...Object.fromEntries(
            [
              'technical',
              'physical',
              'mental',
              'tactical',
              'finishing',
              'passing',
              'dribbling',
              'defending',
              'leadership',
              'workRate',
              'overallRating',
            ].map((r) => [r, { type: 'integer', minimum: 1, maximum: 10, example: 7 }]),
          ),
          strengths: { type: 'array', items: { type: 'string' }, example: ['Press resistant', 'Excellent vision'] },
          weaknesses: { type: 'array', items: { type: 'string' }, example: ['Weak in the air'] },
          recommendation: { type: 'string', enum: ['SIGN', 'MONITOR', 'PASS'] },
          summary: { type: 'string', example: 'Ready for a top-four side.' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Auth'],
        summary: 'Health check',
        security: [],
        responses: {
          200: { description: 'API is running', content: { 'application/json': { example: { status: 'ok' } } } },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { name: 'Ana Scout', email: 'ana@example.com', password: 'a-strong-password' },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created, logged in',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } },
          },
          400: invalid,
          409: errorResponse('Email already registered', {
            error: { message: 'An account with this email already exists.' },
          }),
          403: errorResponse('Email domain not allowed (only when ALLOWED_EMAIL_DOMAINS is set)', {
            error: { message: 'Sign-up is limited to @aseathletics.com email addresses.' },
          }),
          429: errorResponse('Too many sign-ups', {
            error: { message: 'Too many sign-ups from this connection. Please try again in an hour.' },
          }),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and get a token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { example: { email: 'demo@ase-athletics.com', password: 'demo123' } } },
        },
        responses: {
          200: {
            description: 'Logged in',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } },
          },
          400: invalid,
          401: errorResponse('Wrong credentials', { error: { message: 'Incorrect email or password.' } }),
          429: errorResponse('Too many failed attempts for this account', {
            error: { message: 'Too many failed attempts for this account. Please wait 15 minutes and try again.' },
          }),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out (the client discards its token)',
        responses: { 204: { description: 'Logged out' }, 401: unauthorized },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'The logged-in user',
        responses: { 200: { description: 'Current user' }, 401: unauthorized },
      },
    },
    '/players': {
      get: {
        tags: ['Players'],
        summary: 'List players (paginated, sortable, filterable)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              default: 'name',
              enum: [
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
              ],
            },
          },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
          ...playerFilters,
        ],
        responses: {
          200: {
            description: 'A page of players',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Player' } },
                    meta: { $ref: '#/components/schemas/PageMeta' },
                  },
                },
              },
            },
          },
          400: invalid,
          401: unauthorized,
        },
      },
      post: {
        tags: ['Players'],
        summary: 'Create a player',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PlayerInput' } } },
        },
        responses: { 201: { description: 'Created' }, 400: invalid, 401: unauthorized },
      },
    },
    '/players/search': {
      get: {
        tags: ['Players'],
        summary: 'Quick text search (for the search bar and autocomplete)',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, example: 'silva' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 8, maximum: 20 } },
        ],
        responses: {
          200: {
            description: 'Matches',
            content: {
              'application/json': {
                example: {
                  data: [{ id: 4, name: 'Lucas Silva', team: 'Barcelona', nationality: 'Brazil', position: 'Forward' }],
                  meta: { q: 'silva', count: 1 },
                },
              },
            },
          },
          400: invalid,
          401: unauthorized,
        },
      },
    },
    '/players/filters': {
      get: {
        tags: ['Players'],
        summary: 'Options for the filter controls (teams, nationalities, ranges)',
        responses: { 200: { description: 'Filter options' }, 401: unauthorized },
      },
    },
    '/players/{id}': {
      get: {
        tags: ['Players'],
        summary: 'One player with attributes, value history, monthly form and reports',
        parameters: [idParam],
        responses: { 200: { description: 'Player' }, 401: unauthorized, 404: notFound },
      },
      put: {
        tags: ['Players'],
        summary: 'Update a player (send only the fields to change)',
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { example: { goals: 12, team: 'Arsenal' } } } },
        responses: { 200: { description: 'Updated' }, 400: invalid, 401: unauthorized, 404: notFound },
      },
      delete: {
        tags: ['Players'],
        summary: 'Delete a player (their reports are deleted too)',
        parameters: [idParam],
        responses: { 204: { description: 'Deleted' }, 401: unauthorized, 404: notFound },
      },
    },
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'All dashboard KPIs and chart data (accepts the player filters)',
        parameters: [
          {
            name: 'asOf',
            in: 'query',
            description: 'Reference date for contract expiry. Defaults to the data date, 2025-07-08.',
            schema: { type: 'string', format: 'date' },
          },
          ...playerFilters,
        ],
        responses: {
          200: {
            description:
              'KPIs, mostValuable, expiringContracts, byPosition, ageGroups, teams, attributesByPosition, topPer90, bestValueForMoney, marketValueTrends',
          },
          401: unauthorized,
        },
      },
    },
    '/reports': {
      get: {
        tags: ['Reports'],
        summary: 'List scouting reports',
        parameters: [
          { name: 'playerId', in: 'query', schema: { type: 'integer' } },
          { name: 'scoutId', in: 'query', schema: { type: 'integer' } },
          { name: 'recommendation', in: 'query', schema: { type: 'string', enum: ['SIGN', 'MONITOR', 'PASS'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
        ],
        responses: { 200: { description: 'Reports' }, 401: unauthorized },
      },
      post: {
        tags: ['Reports'],
        summary: 'Create a report (the logged-in user is the scout)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ReportInput' } } },
        },
        responses: { 201: { description: 'Created' }, 400: invalid, 401: unauthorized },
      },
    },
    '/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'One report',
        parameters: [idParam],
        responses: { 200: { description: 'Report' }, 401: unauthorized, 404: notFound },
      },
      put: {
        tags: ['Reports'],
        summary: 'Update a report (only its author)',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { 'application/json': { example: { overallRating: 9, recommendation: 'SIGN' } } },
        },
        responses: { 200: { description: 'Updated' }, 400: invalid, 401: unauthorized, 403: forbidden, 404: notFound },
      },
      delete: {
        tags: ['Reports'],
        summary: 'Delete a report (only its author)',
        parameters: [idParam],
        responses: { 204: { description: 'Deleted' }, 401: unauthorized, 403: forbidden, 404: notFound },
      },
    },
  },
};
