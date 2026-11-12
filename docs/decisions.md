# Decisions and rationale

Why the app is built the way it is: the technology choices, the design decisions, what was considered instead, and what was deliberately left out. Data decisions have their own page: [data-quality.md](data-quality.md).

## Technology stack

| Choice | Alternatives considered | Why this one |
|---|---|---|
| **React 19 + Vite** | Vue, Next.js, Create React App | React is what the brief suggests and the most common choice in industry. Vite starts instantly and builds fast; Create React App is no longer maintained. Next.js adds server rendering that an internal, logged-in tool doesn't need. |
| **JavaScript** (not TypeScript) | TypeScript | Faster to build within a 10-day deadline, and matches the brief's examples. The trade-off is fewer compile-time checks; validation at the API edge (Joi) and the test suites cover the most important cases. On a longer-lived codebase I'd migrate to TypeScript. |
| **React Router** | TanStack Router | The standard; supports nested layouts (one sidebar for all logged-in pages) and URL search params, which carry the app's filter state. |
| **Context API + URL state** | Redux, Zustand | Only two things are truly global (the logged-in user and toasts). Everything else is either shareable view state (which belongs in the URL) or page-local. A store would add code and indirection without solving a problem. See [architecture.md](architecture.md#state-what-lives-where). |
| **Tailwind CSS 4** | Material UI, CSS modules | ASE provided a design system as tokens (colours, spacing, radii, shadows). Tailwind's theme maps those tokens one-to-one (`bg-primary-700`), so the app follows the guidelines by construction. Component libraries bring their own look that would fight ASE's. |
| **Recharts** | Chart.js, D3 | Charts as React components, responsive out of the box, enough control for the dashboard. D3 offers more but would take far longer for the same result. |
| **Axios** | fetch | Interceptors give one place to attach the token, handle expired sessions and set a timeout. |
| **Node.js + Express 5** | NestJS, Fastify | Required by the brief (Node); Express is the most widely known. Version 5 forwards errors from async code automatically, removing try/catch boilerplate. NestJS adds structure that this size of project doesn't need. |
| **PostgreSQL** | MongoDB, MySQL | The data is relational: players have attributes, value histories, form and reports; reports belong to scouts. Foreign keys, enums and unique constraints let the database itself guard data quality. Native arrays fit strengths/weaknesses lists. |
| **Prisma 6** (ORM) | Sequelize, raw SQL, Prisma 7 | Readable schema file, generated migrations, safe parameterised queries, and clear query code. Pinned to the stable v6 rather than the newer major release, which changed how the client is generated and configured; not worth the risk under a deadline. |
| **Joi** (validation) | Yup, Zod | Mature, expressive, and returns every error at once with field names, which the frontend turns into per-field messages. |
| **JWT + bcrypt** | Sessions with cookies | Stateless tokens work across the separate frontend and API domains without shared session storage. bcrypt is the standard for password hashing. See the cookie trade-off in the [README](../README.md#security). |
| **Jest + Supertest / Vitest + Testing Library** | Mocha, Cypress | Jest is the Node standard; Supertest calls the real Express app over HTTP. Vitest is Jest-compatible but understands Vite and JSX natively. Testing Library tests components the way a user sees them. |
| **Vercel + Render + Neon** | Netlify, Railway, Heroku, Supabase | All free, all deploy on push. Vercel serves the frontend from a CDN; Render runs a normal Node server; Neon is serverless PostgreSQL with built-in connection pooling. See [deployment-guide.md](deployment-guide.md). |

## Design decisions

### API design
- **REST with consistent responses.** Every success is `{ data, meta }` and every error `{ error: { message, details } }`, so the frontend has exactly one way to read either.
- **Correct status codes**: 201 for create, 204 for delete, 400 with field details for invalid input, 401 vs 403 (not logged in vs not allowed), 404, 409 for a taken email, 429 for rate limits.
- **Validation before logic.** Joi checks every body, query and path parameter first. Unknown fields are stripped, so a client can't set things like `id` or `scoutId`.
- **One flexible list endpoint** (`GET /players`) handles search, every filter, sorting and pagination through query parameters, instead of separate endpoints per filter. The comparison tool reuses it with `?ids=1,2,3`.
- **Players with no value sort last**, whichever direction you sort, so "highest market value" shows the valued players first instead of a page of blanks.
- **Swagger UI** at `/api/docs`, generated from an OpenAPI description, so reviewers can try every endpoint in the browser.

### Authorisation
- Logging in proves **who** you are; the API also checks **what** you may do. Reports can only be changed or deleted by their author (403 otherwise), enforced on the server and covered by tests. The frontend hides the buttons too, but that's convenience, not security.
- Login gives the same message for an unknown email and a wrong password.
- Rate limits count failed logins **per account**, so changing IP address doesn't help an attacker; sign-ups are limited per connection.

### State in the URL
Filters, search, sort, page, the compare selection and the active tab all live in the URL. Refreshing keeps your view, the back button behaves as expected, and any view can be shared ("look at these three players") as a link. This also delivers two brief bonuses (filter persistence and shareable comparisons) without extra machinery.

### Dashboard maths on the server
`GET /dashboard/stats` returns every KPI and chart in one response, already filtered. One request instead of ten, the numbers are identical wherever they appear, and the calculation is a pure function that's easy to test.

### Design system and accessibility
- ASE's `ui_guidelines.json` became the Tailwind theme: colours, breakpoints, radii and shadows.
- **One deliberate deviation:** the guideline's primary blue (`#0ea5e9`) with white text fails WCAG AA contrast (2.8:1). Buttons use `#0369a1` from the same palette (5.9:1).
- Chart colours were checked with a colour-blindness validator; red is reserved for warnings; legends and tooltips follow the order things are drawn.
- Keyboard focus is always visible, icons have screen-reader labels, colour is never the only signal, and animation is off for anyone who asks their device for reduced motion.

### Responsive design
Tables become cards on phones, the sidebar becomes a menu, and every screen was measured at 320, 390, 768, 1024, 1200 and 1440 pixels wide with no sideways scrolling.

### Polish
Skeleton loaders (the page's shape appears immediately), short subtle transitions, empty states that say what to do next, and a login page with faint pitch markings in ASE's colours. All within the design system, no redesign.

## Performance

| Decision | Effect |
|---|---|
| Database indexes on the searched and filtered columns | Search and filters stay fast as data grows |
| Pagination (25 per page, max 100) | Lists never load the whole table |
| `GET /players/search` returns only 5 fields | Autocomplete responses are tiny |
| One dashboard request | Fewer round trips; the count of value history rows is fetched as a number, not the rows |
| Pooled database connections and one shared Prisma client | No connection storms |
| Code splitting (`React.lazy`) | First download cut from 874 kB to 340 kB; the chart library loads only with a chart page |
| Range sliders apply on release, search on typing pause | No request on every pixel or keystroke |
| Static frontend on Vercel's CDN | Assets served from a location close to the user |

**At larger scale:** the dashboard currently loads the filtered players and calculates in JavaScript, which is simple and fast for 90 players. With thousands, I'd move the aggregations into SQL (`GROUP BY`) and cache results for a few minutes, since the numbers change rarely.

## Deliberately not done (and why)

| Not done | Why | Next step if needed |
|---|---|---|
| Docker / `docker-compose.yml` (suggested in the brief) | Every part runs with `npm` and a free Neon database, and the deploy targets don't use containers. A compose file would be one more thing to maintain | Add a compose file with Postgres for fully offline development |
| Real-time updates (WebSockets) | Scouting data changes rarely; a refresh is enough | Push report changes to other open sessions |
| Response caching | Not needed at 90 players | Cache dashboard stats for a few minutes |
| Image upload | Bonus feature; storage adds cost and moderation questions. Initials avatars are used instead | Upload to object storage with size limits |
| HttpOnly cookie sessions | Cross-domain cookies are increasingly blocked by browsers; a broken login is worse than a documented trade-off | Serve app and API from one domain, then switch |
| Roles and permissions on players | Out of scope for the brief | Scouts add and edit; a head of scouting deletes |
| End-to-end browser tests in CI | Every screen was checked with Playwright scripts during development, but not in CI | Playwright against a preview deploy |
| Estimating missing market values | Would be invented data shown next to real data | Import from a licensed provider, with source and date |
