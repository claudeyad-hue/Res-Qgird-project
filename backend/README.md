# ResQGrid backend

Express API for the ResQGrid React console. The canonical backend source is `backend/src/`; root-level `src/` also contains legacy server-shaped files that are not used by the backend package scripts.

## Runtime and configuration

- Node.js 18 or newer, Express 4, Mongoose 8, MongoDB, JWT, Helmet, CORS, and express-rate-limit.
- The server loads `backend/.env` first and the repository-root `.env` for missing values.
- Production requires `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, and `FRONTEND_URL`. Startup fails if the production database is unavailable. `PORT`, `JWT_EXPIRES_IN`, `RATE_LIMIT_WINDOW_MINUTES`, and `RATE_LIMIT_MAX` have defaults.
- `REQUIRE_AUTH_FOR_INCIDENTS`, `REQUIRE_AUTH_FOR_RESOURCES`, `REQUIRE_AUTH_FOR_HOSPITALS`, and `REQUIRE_AUTH_FOR_TEAMS` can require authentication in development. Production always requires authentication for writes. `ORS_API_KEY` is optional; OSRM is the default routing provider.
- Public registration is restricted to the `viewer` role. Do not use development demo accounts or seeded passwords in production.

MongoDB stores accounts and operational incident, team, hospital, and resource records whenever connected. Local development can use process-memory fixtures if MongoDB is unavailable; these reset on restart. Hospital fixtures use official Ghaziabad directory entries and never seed bed, ICU, ambulance, or current-open-status values. Production startup requires MongoDB, production APIs return `503` when it disconnects, and they do not switch to process-memory fixtures. Configure database backups and access controls before using operational data.

The hospital directory in `src/data/ghaziabadHospitals.js` cites an official source on each record. Only the district-administered hospital page currently supplies source-published coordinates for two records. NHA PM-JAY facilities are retained as historical official-source listings and marked for re-verification; listing does not mean the facility is open or currently accepting patients. A hospital is not mapped if its coordinates were not published by a cited source. Real-time availability remains disconnected unless a hospital administrator submits a timestamped report.

To preview or synchronize the MongoDB hospital collection, run `npm run hospitals:sync` (dry run) or `npm run hospitals:sync -- --apply` after checking the target database. This operation replaces exact-name legacy demo hospital rows and upserts the curated Ghaziabad directory only; it does not touch incidents, teams, resources, or users. The main `npm run seed` command still clears all development collections and should only be used with a disposable database.

## Install and run

```sh
npm ci
npm run dev
```

`npm start` runs the production HTTP server. `npm test` runs the backend checks, including MongoDB-backed CRUD and persistence checks. The development seed script clears existing collections before inserting its fixtures; use it only with a disposable development database.

## Routes

All endpoints are available under `/api` and `/api/v1`.

| Area | Routes |
|---|---|
| Health | `GET /health` |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/users/:userId/hospitals` (admin assignment) |
| Incidents | `GET/POST /incidents`, `GET/PUT/PATCH/DELETE /incidents/:id`, `PATCH /incidents/:id/status` |
| Resources | `GET/POST /resources`, `GET/PUT/PATCH/DELETE /resources/:id`, `PATCH /resources/:id/status` |
| Hospitals | `GET/POST /hospitals`, `GET/PUT/PATCH/DELETE /hospitals/:id`, `GET /hospitals/nearest`, `PATCH /hospitals/:id/availability` (assigned hospital administrator or admin) |
| Teams | `GET/POST /teams`, `GET/PUT/PATCH/DELETE /teams/:id`, `PATCH /teams/:id/status` |
| Dashboard | `GET /dashboard/summary` |
| Routing | `POST /routes/incident`, `POST /routes/hospital` |

Zones are currently local frontend demo data; there is no `/api/zones` route.

## Frontend connection

Set the Vite build variable `VITE_API_BASE_URL` to the backend origin, for example `http://localhost:5000`. Origins ending in `/api` or `/api/v1` are also accepted. The frontend sends bearer tokens for authenticated writes.

## Deployment

- **Render:** `render.yaml` points to this directory, installs with `npm ci`, starts with `npm start`, and checks `/api/v1/health`.
- **Railway:** Create a service from this repository and set its root directory to `/backend`. Railpack can install from `package-lock.json`; the start command is `npm start`, and the healthcheck path is `/api/v1/health`. The server binds to `0.0.0.0` and Railway's injected `PORT`.
- **Vercel:** Set the Vercel project root to `backend`. `api/index.js` connects to MongoDB and exports the Express application without opening a persistent listener. Operational records are shared through MongoDB across serverless instances.

For Railway, keep using the existing MongoDB Atlas database and set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, and `FRONTEND_URL` as service variables. Railway supplies `PORT`; do not hardcode it. `JWT_EXPIRES_IN` defaults to `7d`. Add the Railway public origin as Vercel's `VITE_API_BASE_URL` after the Railway healthcheck succeeds. Include the production Vercel origin in `FRONTEND_URL`; comma-separated origins are supported.

Never put server secrets in Vite `VITE_*` variables because those values are bundled into browser assets. Keep the Render service and its configuration during migration so the previous backend remains available for rollback until Railway and Vercel have been verified.
