# ResQGrid — Unified Disaster Management Console

ResQGrid is a React/Vite emergency response console with an Express API and simulated Ghaziabad operational data.

## Current architecture

- **Frontend:** React 19, Vite 6, React Router, and React Leaflet. The app entry is `src/main.jsx` and routes/pages live under `src/`.
- **Backend:** Express 4 under `backend/src/`, with API routes mounted at `/api` and `/api/v1`.
- **Authentication:** Login is checked by the backend. Public registration can create viewer accounts only; elevated accounts must be provisioned by an administrator.
- **Operational data:** Incidents, teams, hospitals, and resources are simulated, process-local records. They reset on backend restart and are not suitable as durable emergency records.
- **Database:** MongoDB is required in production for accounts and operational incidents, teams, hospitals, and resources. Those API repositories use MongoDB when connected. Local development can use process-memory demo records when MongoDB is not configured; those records reset when the process restarts.

The canonical Express implementation is `backend/src/`. The Vite entry imports `src/main.jsx` and `src/App.jsx`; root `src/app.js`, `src/server.js`, and its `config/`, `controllers/`, `middleware/`, `models/`, and `routes/` directories are legacy backend copies, not part of the active app or server scripts. They are retained to preserve existing code. Do not add new backend features there.

## Run locally

1. Install the frontend dependencies from the repository root: `npm install`.
2. Install the backend dependencies: `npm ci --prefix backend`.
3. Configure backend variables in `backend/.env` or the repository-root `.env`. Use the variable names in `.env.example`; set a local MongoDB URI and a development JWT secret.
4. Configure the frontend API origin in root `.env.local`:

   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

   The frontend also accepts an origin ending in `/api` or `/api/v1`.

5. Start the API with `npm run server:dev` and the frontend with `npm run dev` in separate terminals.

Build the frontend with `npm run build`. Run the backend test suite with `npm run server:test`; run the root geospatial/API checks with `npm test` when the backend is available.

## API areas

The backend exposes health, authentication, incidents, resources, hospitals, teams, dashboard summary, and routing endpoints. `/api/zones` is not implemented; the map's disaster zones are local demo data.

## Deployment

- **Frontend:** Deploy the root project to Vercel. Set `VITE_API_BASE_URL` to the deployed backend origin at build time.
- **Backend:** `render.yaml` configures the Render service. Production requires `MONGODB_URI`, a strong `JWT_SECRET`, and the frontend origin in `FRONTEND_URL`.
- A Vercel backend entry point is also configured under `backend/`, with the backend directory as the Vercel project root.

Production operational records persist in MongoDB. Configure a production database with appropriate backups and access controls before using operational data. If the production database disconnects, the health endpoint reports not-ready and APIs return service unavailable rather than serving demo records. The optional development seed script clears collections before inserting fixtures; do not run it against a database containing records you need.

## Project references

- [Backend API and environment guide](backend/README.md)
- [REST API integration notes](REST_API_INTEGRATION.md)
- [Geolocation and routing notes](GHAZIABAD_GEOLOCATION_ROUTING.md)
