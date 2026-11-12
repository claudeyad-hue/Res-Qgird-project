# ResQGrid documentation

This file summarizes the active repository architecture. For setup details, use [README.md](README.md) and [backend/README.md](backend/README.md).

## Active architecture

- The Vite client starts at `src/main.jsx`; `src/App.jsx` owns the React routes.
- The Express server starts at `backend/src/server.js`; `backend/src/app.js` registers the API.
- Frontend services use `VITE_API_BASE_URL` and call the backend at `/api/...`. The variable can contain the backend origin with or without an `/api` suffix.
- The backend exposes both `/api` and `/api/v1` aliases.

## Data and authentication status

- Login and current-user checks call the backend. The browser no longer creates a user or token when the API is unavailable.
- Public registration grants the `viewer` role only.
- Operational incidents, teams, hospitals, and resources use MongoDB when connected. Local no-database development uses in-memory demo records that reset on restart.
- MongoDB is required in production. Health reports not-ready and APIs return `503` during a database outage rather than switching to demo records. The optional development seed script clears collections before inserting test fixtures.
- Disaster zones and the hospital transfer-request confirmation remain local UI/demo behavior. There is no `/api/zones` or transfer-request API.

## Environment variables

Backend variables are loaded from `backend/.env` first and the repository-root `.env` second. Production needs `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, and the frontend origin in `FRONTEND_URL`. Rate limits and token expiry have defaults. Optional routing keys are server-side only unless explicitly named `VITE_*` for browser use.

The root `.env.example` lists the variable names and local defaults. Never expose server credentials in frontend `VITE_*` variables.

## Deployment

- The root `vercel.json` deploys the frontend SPA.
- `render.yaml` configures the backend on Render.
- `backend/vercel.json` is for a separate Vercel project rooted at `backend`; it uses `backend/api/index.js` and does not start a listening server.

See [REST_API_INTEGRATION.md](REST_API_INTEGRATION.md) for the current route list and [GHAZIABAD_GEOLOCATION_ROUTING.md](GHAZIABAD_GEOLOCATION_ROUTING.md) for the map/routing demo scope.
