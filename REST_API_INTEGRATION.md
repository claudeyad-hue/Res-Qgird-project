# ResQGrid REST API integration

This reference reflects the active Express implementation in `backend/src/` and frontend services under `src/services/`.

## Base URL

Set the frontend build variable `VITE_API_BASE_URL` to the backend origin, such as `http://localhost:5000`. An origin ending in `/api` or `/api/v1` is normalized. The API is mounted under both `/api` and `/api/v1`.

## Endpoint map

| API area | Methods and paths | Frontend integration |
|---|---|---|
| Health | `GET /health` | Login status indicator |
| Authentication | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | Login/session refresh |
| Incidents | `GET/POST /incidents`, `GET/PATCH/PUT/DELETE /incidents/:id`, `PATCH /incidents/:id/status` | Incident list, report, and updates |
| Teams | `GET/POST /teams`, `GET/PUT/PATCH/DELETE /teams/:id`, `PATCH /teams/:id/status` | Team list and status updates |
| Resources | `GET/POST /resources`, `GET/PUT/PATCH/DELETE /resources/:id`, `PATCH /resources/:id/status` | Resource list and allocation |
| Hospitals | `GET/POST /hospitals`, `GET/PUT/PATCH/DELETE /hospitals/:id`, `GET /hospitals/nearest` | Hospital list and nearest-hospital routing |
| Dashboard | `GET /dashboard/summary` | API endpoint; dashboard UI currently derives several values locally |
| Routing | `POST /routes/incident`, `POST /routes/hospital` | Backend route endpoints |

`GET /zones` and hospital transfer requests are not API endpoints. Zones and transfer-request confirmation remain local UI behavior.

## Response shape

Single-record and summary responses use `{ success, message, data }`. List responses use the same envelope and include pagination metadata. Frontend services unwrap the `data` field.

## Authentication and writes

Login returns a backend-signed bearer token. Public registration always creates a `viewer` account; clients cannot select an elevated role. Production writes require a valid token and role. Do not treat local demo data or local UI state as an authenticated operational record.

## Data durability

The operational repositories for incidents, teams, hospitals, and resources use MongoDB when connected. Local development can use seeded process-memory demo data without a database, and those changes reset when the process restarts. Production requires MongoDB; if it becomes unavailable, the health endpoint returns `503` and APIs do not substitute demo records. Configure suitable database backups and access controls before handling operational data.

## Local development

Start the backend from `backend/` with `npm run dev`, then set `VITE_API_BASE_URL=http://localhost:5000` for the Vite frontend. Configure MongoDB and a development JWT secret using the variable names in `.env.example`.
