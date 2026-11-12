# API documentation

**Base URL:** `https://ase-athletics-assessment.onrender.com/api` (locally `http://localhost:5001/api`)
**Interactive docs (Swagger UI):** [`/api/docs`](https://ase-athletics-assessment.onrender.com/api/docs). Press **Authorize**, paste a token from login, then **Try it out** on any endpoint.

> The live API runs on a free plan and may take up to a minute to answer the first request after a quiet period.

## Conventions

**Authentication.** Every endpoint except `/health`, `/auth/register` and `/auth/login` needs a token:

```
Authorization: Bearer <token from /auth/login or /auth/register>
```

Tokens are JWTs that expire after 1 day. A missing, fake or expired token gets `401`.

**Response format.** Every success and every error has the same shape, so the frontend handles them in one place:

```json
{ "data": { }, "meta": { } }
```

```json
{
  "error": {
    "message": "Some fields are invalid.",
    "details": [{ "field": "age", "message": "\"age\" must be a number" }]
  }
}
```

`details` appears on validation errors and names each wrong field, so forms can highlight exactly what to fix. All errors are listed at once, not one at a time. Unknown fields in a request body are silently dropped.

**Status codes**

| Code | When |
|---|---|
| `200` | Read or update succeeded |
| `201` | Something was created |
| `204` | Deleted or logged out (no body) |
| `400` | Invalid input; `details` says which fields |
| `401` | Not logged in, bad token, or wrong email/password |
| `403` | Logged in but not allowed (another scout's report; email domain not allowed to sign up) |
| `404` | That player, report or route doesn't exist |
| `409` | Email already registered |
| `429` | Too many attempts (rate limit) |
| `500` | Unexpected server error (the message never leaks internals) |

**Rate limits**

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 10 failed attempts per email address per 15 minutes (successful logins don't count) |
| `POST /auth/register` | 5 sign-ups per connection per hour |

Responses include `RateLimit` headers saying how many attempts are left and when the window resets.

---

## Auth

### `POST /auth/register`
Create an account. Returns the user and a token, so the person is logged in straight away.

**Request**
```json
{ "name": "Ana Scout", "email": "ana@example.com", "password": "a-strong-password" }
```
Rules: name required; valid email; password 8 to 100 characters. If the server sets `ALLOWED_EMAIL_DOMAINS`, only those email domains can register.

**Response `201`**
```json
{
  "data": {
    "user": { "id": 5, "email": "ana@example.com", "name": "Ana Scout", "createdAt": "2026-11-11T20:41:32.348Z" },
    "token": "eyJhbGciOi..."
  }
}
```
Errors: `400` invalid fields · `403` email domain not allowed · `409` email already registered · `429` too many sign-ups.

### `POST /auth/login`
**Request**
```json
{ "email": "demo@ase-athletics.com", "password": "demo123" }
```
**Response `200`**: same shape as register.

Errors: `400` missing fields · `401` `"Incorrect email or password."` (the same message whether the email or the password is wrong, so the form can't be used to find out who has an account) · `429` too many failed attempts.

### `POST /auth/logout`
Returns `204`. Tokens are stateless, so the client discards its copy; see [Security in the README](../README.md#security).

### `GET /auth/me`
The logged-in user. Used when the app reloads, to check the saved token is still valid.
```json
{ "data": { "id": 1, "email": "demo@ase-athletics.com", "name": "Demo Scout", "createdAt": "2026-11-11T20:41:32.348Z" } }
```

---

## Players

### `GET /players`
A page of players, with search, filters and sorting. Each player includes its `attributes`.

**Query parameters**

| Parameter | Example | Notes |
|---|---|---|
| `page` | `1` | Default 1 |
| `limit` | `25` | Default 25, max 100 |
| `sort` | `goals` | `name` (default), `age`, `position`, `team`, `nationality`, `marketValue`, `goals`, `assists`, `appearances`, `contractEnd`, `createdAt` |
| `order` | `desc` | `asc` (default) or `desc`. Players with no value for the sort column always come last |
| `q` | `kane` | Searches name, team and nationality (case-insensitive) |
| `position` | `Forward,Midfielder` | One or more, comma-separated |
| `team` | `Real Madrid` | One or more |
| `nationality` | `Spain,France` | One or more |
| `ids` | `1,2,3` | Specific players (used by Compare) |
| `ageMin`, `ageMax` | `20`, `25` | Ranges, inclusive |
| `valueMin`, `valueMax` | `10000000` | Market value in EUR |
| `goalsMin`, `goalsMax`, `assistsMin`, `assistsMax` | `5` | |

**Example:** `GET /players?sort=goals&order=desc&limit=1`

**Response `200`**
```json
{
  "data": [
    {
      "id": 56,
      "sourceId": "main:77",
      "name": "Harry Kane",
      "position": "Forward",
      "detailedPosition": null,
      "age": 30,
      "team": "Bayern Munich",
      "league": null,
      "nationality": "England",
      "height": 188,
      "weight": 86,
      "preferredFoot": "Right",
      "jerseyNumber": 9,
      "appearances": 31,
      "goals": 36,
      "assists": 8,
      "minutesPlayed": 2697,
      "passAccuracy": 83.4,
      "shotsOnTarget": 98,
      "totalShots": 142,
      "saves": null,
      "contractSalary": 385000,
      "contractEnd": "2027-06-30T00:00:00.000Z",
      "marketValue": null,
      "attributes": { "pace": 71, "shooting": 96, "passing": 87, "dribbling": 76, "defending": 41, "physical": 86, "finishing": 97 }
    }
  ],
  "meta": { "page": 1, "limit": 1, "total": 90, "totalPages": 90, "sort": "goals", "order": "desc" }
}
```
(Some columns are trimmed here for length; every column in [database-schema.md](database-schema.md#players) is returned.) Note `marketValue: null`: missing, not zero. See [data-quality.md](data-quality.md).

### `GET /players/search?q=…`
Fast name search for autocomplete. Returns only what a suggestion list needs.

`GET /players/search?q=silva&limit=8` (limit default 8, max 20)
```json
{
  "data": [
    { "id": 65, "name": "Bernardo Silva", "team": "Manchester City", "nationality": "Portugal", "position": "Midfielder" },
    { "id": 4, "name": "Lucas Silva", "team": "Barcelona", "nationality": "Brazil", "position": "Forward" },
    { "id": 84, "name": "Thiago Silva", "team": "Fulham", "nationality": "Brazil", "position": "Defender" }
  ],
  "meta": { "q": "silva", "count": 3 }
}
```

### `GET /players/filters`
Everything the filter controls need, worked out from the data.
```json
{
  "data": {
    "positions": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    "teams": ["AC Milan", "AS Roma", "Ajax", "..."],
    "nationalities": ["Algeria", "Argentina", "Belgium", "..."],
    "ranges": {
      "age": { "min": 19, "max": 40 },
      "marketValue": { "min": 2000000, "max": 65000000 },
      "goals": { "min": 0, "max": 36 },
      "assists": { "min": 0, "max": 16 }
    }
  }
}
```

### `GET /players/:id`
One player with everything the profile page shows: `attributes`, `marketValues` (oldest first), `monthlyForm` (oldest first) and `reports` (newest first, each with its scout's id and name).

```json
{
  "data": {
    "id": 1,
    "name": "Alessandro Rodriguez",
    "position": "Midfielder",
    "team": "Real Madrid",
    "marketValue": 65000000,
    "attributes": { "pace": 75, "shooting": 78, "passing": 92, "dribbling": 88, "defending": 65, "physical": 72, "diving": null },
    "marketValues": [{ "date": "2022-07-01T00:00:00.000Z", "value": 25000000, "source": "Transfermarkt" }],
    "monthlyForm": [{ "month": "2024-08-01T00:00:00.000Z", "appearances": 5, "goals": 2, "assists": 3, "averageRating": 7.8 }],
    "reports": []
  }
}
```
(Lists shortened. For a player with reports, each item in `reports` includes `scout: { "id", "name" }`.)

Errors: `400` id isn't a number · `404` `"Player not found."`

### `POST /players`
Create a player. Required: `name`, `position`, `age`, `team`, `nationality`. Everything else is optional; counts (goals, assists...) default to 0, and unknown values such as `marketValue` stay empty rather than becoming 0.

```json
{
  "name": "Lamine Yamal",
  "position": "Forward",
  "age": 18,
  "team": "Barcelona",
  "nationality": "Spain",
  "goals": 9,
  "assists": 13,
  "contractEnd": "2030-06-30",
  "marketValue": 150000000,
  "attributes": { "pace": 90, "shooting": 78, "passing": 84, "dribbling": 92, "defending": 30, "physical": 60 }
}
```
**Response `201`**: the new player. Errors: `400` with every invalid or missing field listed.

### `PUT /players/:id`
Update only the fields you send.
```json
{ "marketValue": 20000000, "team": "Arsenal" }
```
**Response `200`**: the updated player. Errors: `400` · `404`.

### `DELETE /players/:id`
**Response `204`**. Also deletes the player's attributes, value history, form and reports (database cascade). Errors: `404`.

---

## Dashboard

### `GET /dashboard/stats`
Every number and chart on the dashboard in one request, already filtered. Accepts **all the player filters** above (`position`, `team`, `ageMin`...), plus:

| Parameter | Notes |
|---|---|
| `asOf` | Date used for the "contracts ending soon" list. Defaults to the data date, `2025-07-08` |

**Response `200`** (lists shortened)
```json
{
  "data": {
    "kpis": {
      "totalPlayers": 90,
      "averageAge": 26.7,
      "totalGoals": 768,
      "totalAssists": 608,
      "playersWithMarketValue": 12,
      "averageMarketValue": 23583333,
      "topScorer": { "id": 56, "name": "Harry Kane", "team": "Bayern Munich", "position": "Forward", "goals": 36 },
      "topAssister": { "id": 31, "name": "Kevin De Bruyne", "team": "Manchester City", "position": "Midfielder", "assists": 16 },
      "expiredContracts": 24,
      "contractsExpiringWithin12Months": 20
    },
    "contractStatus": {
      "dataDate": { "date": "2025-07-08", "expired": 24, "endingWithin12Months": 20 },
      "today": { "date": "2026-11-11", "expired": 44, "endingWithin12Months": 20 }
    },
    "mostValuable": [{ "id": 1, "name": "Alessandro Rodriguez", "team": "Real Madrid", "position": "Midfielder", "marketValue": 65000000 }],
    "expiringContracts": [{ "id": 88, "name": "Rafinha", "team": "Grêmio", "position": "Midfielder", "contractEnd": "2025-12-31T00:00:00.000Z" }],
    "byPosition": [{ "position": "Forward", "players": 35, "goals": 551, "assists": 256, "averageAge": 25.8 }],
    "ageGroups": [{ "label": "Under 21", "players": 2 }, { "label": "21-25", "players": 39 }],
    "teams": [{ "team": "Bayern Munich", "players": 8 }],
    "attributesByPosition": [{ "position": "Forward", "pace": 85.7, "shooting": 84.7, "passing": 77.7, "dribbling": 84.6, "defending": 40.9, "physical": 76.5 }],
    "topPer90": [{ "id": 72, "name": "Cristiano Ronaldo", "team": "Al-Nassr", "position": "Forward", "minutesPlayed": 2349, "goalContributionsPer90": 1.57 }],
    "bestValueForMoney": [{ "id": 21, "name": "Aleksandar Petrovic", "team": "Red Star Belgrade", "position": "Forward", "weeklySalary": 35000, "contributionsPer10k": 6 }],
    "marketValueTrends": [{ "id": 1, "name": "Alessandro Rodriguez", "history": [{ "date": "2022-07-01T00:00:00.000Z", "value": 25000000 }] }],
    "dataQuality": {
      "totalPlayers": 90,
      "coverage": [{ "key": "marketValue", "label": "Market value", "count": 12 }]
    }
  },
  "meta": { "asOf": "2025-07-08", "dataDate": "2025-07-08" }
}
```
Each list is shortened to its first item here. The contract `today` row changes with the current date. Missing values are left out of averages rather than counted as 0 (the average market value is over the 12 valued players).

---

## Scouting reports

### `GET /reports`
| Parameter | Notes |
|---|---|
| `playerId` | Reports about one player |
| `scoutId` | Reports by one scout |
| `recommendation` | `SIGN`, `MONITOR` or `PASS` |
| `page`, `limit` | Default 1 and 25 |

Each report comes with a short `player` (`id`, `name`, `team`, `position`) and `scout` (`id`, `name`), newest match first.

### `GET /reports/:id`
```json
{
  "data": {
    "id": 2,
    "matchDate": "2024-11-22T00:00:00.000Z",
    "opponent": "Real Madrid",
    "competition": "La Liga",
    "result": "3-2 Win",
    "minutesPlayed": 85,
    "positionPlayed": "Right Winger",
    "technical": 9, "physical": 8, "mental": 8, "tactical": 7, "finishing": 9,
    "passing": 7, "dribbling": 9, "defending": 5, "leadership": 6, "workRate": 8,
    "overallRating": 9,
    "strengths": ["Exceptional pace and acceleration", "Natural goal-scoring instinct"],
    "weaknesses": ["Needs to improve defensive tracking"],
    "keyMoments": ["23rd minute: Brilliant solo goal cutting in from the right"],
    "recommendation": "SIGN",
    "summary": "Exceptional young talent with world-class potential.",
    "notes": "One of the most exciting young players I've seen.",
    "player": { "id": 4, "name": "Lucas Silva", "team": "Barcelona", "position": "Forward" },
    "scout": { "id": 3, "name": "Maria Santos" }
  }
}
```

### `POST /reports`
The logged-in user is always saved as the scout, whatever the request says.

Required: `playerId`, `matchDate`, `opponent`, the ten ratings (`technical`, `physical`, `mental`, `tactical`, `finishing`, `passing`, `dribbling`, `defending`, `leadership`, `workRate`), `overallRating` (all 1 to 10) and `recommendation` (`SIGN`, `MONITOR`, `PASS`).
Optional: `competition`, `venue`, `result`, `minutesPlayed`, `positionPlayed`, `strengths`, `weaknesses`, `keyMoments` (lists of text), `summary`, `notes`.

```json
{
  "playerId": 1,
  "matchDate": "2025-03-15",
  "opponent": "Atlético Madrid",
  "technical": 8, "physical": 7, "mental": 8, "tactical": 7, "finishing": 6,
  "passing": 9, "dribbling": 8, "defending": 6, "leadership": 7, "workRate": 9,
  "overallRating": 8,
  "strengths": ["Press resistant", "Excellent vision"],
  "weaknesses": ["Weak in the air"],
  "recommendation": "MONITOR",
  "summary": "Ready for a top-four side."
}
```
**Response `201`**: the new report. Errors: `400` (including a `playerId` that doesn't exist).

### `PUT /reports/:id` and `DELETE /reports/:id`
**Only the scout who wrote the report** can change or delete it.

- `PUT` with only the fields to change → `200` with the updated report.
- `DELETE` → `204`.

Errors: `403` `"You can only change your own reports."` · `404` · `400` (for `PUT`, at least one field must be sent).

---

## Health

### `GET /health`
No login needed. `{ "status": "ok" }`. Used by the deploy platform and the keep-awake job.
