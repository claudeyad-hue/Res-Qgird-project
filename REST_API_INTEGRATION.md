# REST API Integration Guide — Phase 1 (MERN Architecture)
## Unified Disaster Management Console | Operational Scope: Ghaziabad, UP, India

### 1. Overview
The Unified Disaster Management Console features a production-quality, modular REST API built with Node.js and Express.js, initially scoped to **Ghaziabad, Uttar Pradesh, India**.

The architecture adheres to Phase 1 constraints:
- **Zero MongoDB/Mongoose migrations or database locking**: Fully operational out-of-the-box in standalone in-memory repository mode with verified Ghaziabad demonstration records.
- **Pluggable Repository Pattern**: Decoupled service and data layer ready for smooth MongoDB connection when credentials are supplied.
- **Geographic Boundary Enforcement**: All coordinates (incidents, hospitals, resources, user location, route origins/destinations) are strictly validated against the official Ghaziabad operational boundary polygon (`GHAZIABAD_CONFIG`). Out-of-area requests receive an informative HTTP 400 rejection without data corruption or fabrication.
- **Real Road-Routing Integration**: Calls the Open Source Routing Machine (OSRM) driving engine on the backend and frontend. Distances, durations, and geometry are calculated from genuine road networks—never fabricated straight lines.

---

### 2. Architecture & Request Lifecycle

```text
React Frontend (Vite)
       │
       ▼
HTTP / REST (JSON)
       │
       ▼
Express API (backend/src/app.js)
       │
       ├── Middleware (Helmet, CORS, Rate Limiting, JSON body parser)
       ├── Routers (/api/v1 & backward-compatible /api alias)
       │      │
       │      ├── /api/health
       │      ├── /api/incidents
       │      ├── /api/hospitals
       │      ├── /api/resources
       │      └── /api/routes
       │
       ├── Controllers (backend/src/controllers/*)
       ├── Business Services (backend/src/services/*)
       │      ├── Boundary & Coordinate Validator (backend/src/utils/geoUtils.js)
       │      └── OSRM Driving Engine Integration (backend/src/services/routingService.js)
       └── Repositories (backend/src/repositories/*)
              └── In-Memory Ghaziabad Store (ghaziabadSeed.js) / MongoDB fallback
```

---

### 3. REST API Contract & Endpoints

All responses follow a consistent, standardized envelope format:
- **Success:** `{ success: true, message: string, data: ... }`
- **Error:** `{ success: false, message: string, error: { code: string } }`

| HTTP Method | Endpoint | Description | Query / Body Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/health` | Backend health, uptime, and operational scope | None |
| `GET` | `/api/incidents` | List operational incidents in Ghaziabad | `?status=&severity=&page=&limit=` |
| `GET` | `/api/incidents/:id` | Retrieve single incident by ID | None |
| `GET` | `/api/hospitals` | List Ghaziabad hospitals and bed statuses | `?status=&search=&page=&limit=` |
| `GET` | `/api/hospitals/:id` | Retrieve single hospital by ID | None |
| `GET` | `/api/hospitals/nearest` | Find nearest eligible hospital dynamically | `?latitude=28.6850&longitude=77.4420` |
| `GET` | `/api/resources` | List disaster relief equipment & supplies | `?status=&type=&page=&limit=` |
| `GET` | `/api/resources/:id` | Retrieve single resource by ID | None |
| `POST` | `/api/routes/incident` | Calculate real road route to incident | `{ origin: { latitude, longitude }, destinationId }` |
| `POST` | `/api/routes/hospital` | Calculate real road route to hospital | `{ origin: { latitude, longitude }, destinationId }` |

---

### 4. Running the Servers and Verification

#### Run the Automated Test Suite (78 Automated Tests)
```bash
npm test
```
This runs both:
1. `scripts/testGeospatial.js` (34 tests: boundary checks, ray-casting, Haversine, live OSRM).
2. `backend/scripts/testApi.js` (44 tests: all 10 REST endpoints, error states, and boundary rejections).

#### Start the Backend Server (Port 5000)
```bash
# Standalone in-memory repository mode
npm run server
```

#### Start the Frontend Console (Port 5173)
```bash
npm run dev
```

#### Build for Production
```bash
npm run build
```
