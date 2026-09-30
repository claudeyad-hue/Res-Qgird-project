# Unified Disaster Management Console Backend

A production-ready, stable, and secure RESTful backend API built with **Node.js, Express.js, and MongoDB (Mongoose)** for the Unified Disaster Management Console (**ResQuard**).

---

## 1. Project Overview

The **Unified Disaster Management Console Backend** powers the multi-agency emergency coordination platform. It coordinates life-critical operational workflows across emergency coordinators, field responders, hospital liaisons, logistics managers, and command center personnel.

Key capabilities:
- **Real-Time Situational Awareness**: Aggregated telemetry on active incidents, critical hazard zones, and casualty counts.
- **Incident Lifecycle Management**: End-to-end status workflows from field report to verification, dispatch, containment, and resolution.
- **Resource Logistics**: Real-time inventory tracking and allocation of drinking water, medical kits, emergency rations, and heavy rescue equipment.
- **Hospital Healthcare Capacity**: Live bed capacity, ICU availability, ambulance tracking, and emergency intake status.
- **Response Team Dispatch**: Availability tracking and geographic assignment of multi-disciplinary rescue units.
- **Role-Based Security**: Granular access control across `admin`, `operator`, `responder`, `medical`, and `viewer` roles.

---

## 2. Architecture & Design Principles

The backend adheres strictly to a clean, decoupled **Layered Architecture**:

```text
React Frontend (Vite / React 19)
               │ (REST API / JSON)
               ▼
       Express Application (app.js)
               │
      Global Middleware
      ├── Helmet Security Headers
      ├── CORS (Configurable Origin)
      ├── Express Rate Limiting
      └── JSON Body Parser
               │
         Express Routes (/api/v1/* & /api/*)
               │
       Route Middleware
       ├── JWT Authentication (authMiddleware.js)
       └── Role Authorization (roleMiddleware.js)
               │
          Controllers (HTTP Request/Response Handling)
               │
          Services (Business Logic & Query Filtration)
               │
       Mongoose Models (Data Validation, Enums, Normalization)
               │
         MongoDB Database (Indexes, Timestamps, Lean Queries)
               │
    Centralized Error Handling (errorMiddleware.js & notFoundMiddleware.js)
```

### Layer Responsibilities:
- **`src/config/`**: Centralized, validated environment configuration (`env.js`) and database lifecycle management with credential masking (`database.js`).
- **`src/models/`**: Mongoose schemas defining strict types, enums, min/max validators, virtuals, and compound indexes.
- **`src/services/`**: Encapsulates all domain and database logic, filtering, search, pagination, and multi-collection aggregations.
- **`src/controllers/`**: Extracts parameters, calls services, and delegates to standardized JSON response formatters.
- **`src/middleware/`**: JWT extraction and validation, role checks, custom 404 handler, and centralized exception translation (CastError, ValidationError, Duplicate Key).
- **`src/utils/`**: Reusable token generation (`generateToken.js`) and uniform API response formatting (`apiResponse.js`).
- **`src/app.js`**: Pure Express application setup, security middleware, route registration, and error handlers.
- **`src/server.js`**: Database connection verification, HTTP listener on `process.env.PORT`, and graceful shutdown handlers.

---

## 3. Directory Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection and connection state tracking
│   │   └── env.js               # Environment variable validation & exports
│   │
│   ├── controllers/
│   │   ├── authController.js        # Auth actions: register, login, getMe
│   │   ├── incidentController.js    # Incident CRUD and status workflows
│   │   ├── resourceController.js    # Resource inventory & allocation
│   │   ├── hospitalController.js    # Hospital capacity & status management
│   │   ├── teamController.js        # Response team tracking & dispatch
│   │   └── dashboardController.js   # Dynamic database aggregated metrics
│   │
│   ├── models/
│   │   ├── User.js              # User schema with bcrypt hashing & role enums
│   │   ├── Incident.js          # Incident schema, GPS coords, severity/status
│   │   ├── Resource.js          # Resource schema, non-negative quantities
│   │   ├── Hospital.js          # Hospital schema, bed capacity bounds
│   │   └── Team.js              # Response team schema, roster & status
│   │
│   ├── routes/
│   │   ├── healthRoutes.js      # Health check and telemetry
│   │   ├── authRoutes.js        # Authentication endpoints
│   │   ├── incidentRoutes.js    # Incident endpoints
│   │   ├── resourceRoutes.js    # Resource endpoints
│   │   ├── hospitalRoutes.js    # Hospital endpoints
│   │   ├── teamRoutes.js        # Team endpoints
│   │   └── dashboardRoutes.js   # Dashboard aggregation endpoints
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── incidentService.js
│   │   ├── resourceService.js
│   │   ├── hospitalService.js
│   │   ├── teamService.js
│   │   └── dashboardService.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification & user attachment
│   │   ├── roleMiddleware.js    # Granular role authorization
│   │   ├── notFoundMiddleware.js# Standard 404 response
│   │   └── errorMiddleware.js   # Centralized error translation
│   │
│   ├── utils/
│   │   ├── apiResponse.js       # Standardized response envelopes
│   │   └── generateToken.js     # JWT sign and verify helpers
│   │
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point & startup
│
├── scripts/
│   ├── seed.js                  # Realistic disaster scenario seed data
│   └── runTests.js              # Comprehensive end-to-end test suite
│
├── .env.example                 # Documented environment template
├── .gitignore                   # Ignores .env, node_modules, logs
├── package.json                 # Dependencies & scripts
└── README.md                    # Full documentation
```

---

## 4. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | String | `development` | Set to `production` in staging/production deployments. |
| `PORT` | Number | `5000` | Port on which the Express server listens. |
| `MONGODB_URI` | String | `mongodb://127.0.0.1:27017/resquard_db` | Connection string for MongoDB (Local or Atlas). |
| `JWT_SECRET` | String | *Dev secret* | Strong secret used to sign and verify JWT tokens (>= 32 chars in production). |
| `JWT_EXPIRES_IN` | String | `7d` | Lifetime of issued JWT tokens (e.g. `7d`, `24h`). |
| `FRONTEND_URL` | String | `http://localhost:5173` | Allowed CORS origin(s), comma-separated for multiple origins. |
| `RATE_LIMIT_WINDOW_MINUTES` | Number | `15` | Window time for API rate limiting in minutes. |
| `RATE_LIMIT_MAX` | Number | `300` | Maximum number of requests allowed per IP window. |
| `REQUIRE_AUTH_FOR_INCIDENTS` | Boolean | `false` (in dev) | When `true`, enforces JWT for incident creation/updates. In dev, allows unauthenticated field demo reports. |

---

## 5. Installation & Execution

### Prerequisites
- Node.js `v18.0.0` or higher
- MongoDB instance (Local daemon, Docker container, or MongoDB Atlas cluster)

### Installation
From the `backend/` directory:
```bash
npm install
```
*(Or from the project root: `npm install` inside the root workspace)*

### Seed Database
Populate the database with realistic emergency scenarios, hospital facilities, response teams, and test accounts:
```bash
npm run seed
```

### Development Server (with auto-reload)
```bash
npm run dev
```

### Production Server
```bash
npm start
```

### Run Automated Test Suite
Executes all 69 test assertions across authentication, role-based authorization, CRUD, filter, search, pagination, dynamic aggregations, and error handling:
```bash
npm test
```

---

## 6. Standard API Contract

All API responses follow a strict, predictable JSON envelope.

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Paginated List Response
```json
{
  "success": true,
  "message": "Records fetched successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable explanation of error",
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": []
  }
}
```

### Standard Error Codes
- `ROUTE_NOT_FOUND`: Route does not exist (404)
- `UNAUTHORIZED`: Missing or invalid authentication token (401)
- `TOKEN_EXPIRED`: JWT token has expired (401)
- `FORBIDDEN`: User role lacks required permission (403)
- `INVALID_ID`: Mongoose CastError on ObjectId (400)
- `VALIDATION_ERROR`: Missing or malformed required fields (400)
- `INVALID_QUANTITY_RANGE`: Available quantity exceeds total (400)
- `INVALID_BEDS_RANGE`: Available beds exceed total capacity (400)
- `DUPLICATE_RECORD`: Unique constraint collision (409)
- `RATE_LIMIT_EXCEEDED`: Too many requests in time window (429)

---

## 7. Complete API Documentation

### Base URLs
- Canonical V1 API: `http://localhost:5000/api/v1`
- Backward Compatibility Alias: `http://localhost:5000/api`

---

### Health Check

#### `GET /api/v1/health`
- **Authentication**: None
- **Success Response (200)**:
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "server": "ok",
    "database": "connected",
    "environment": "development",
    "timestamp": "2026-09-30T13:15:00.000Z",
    "uptimeSeconds": 142
  }
}
```

---

### Authentication API

#### `POST /api/v1/auth/register`
- **Authentication**: None
- **Body**:
```json
{
  "name": "Jane Coordinator",
  "email": "jane@unified.gov",
  "password": "password123",
  "role": "operator",
  "phone": "+1 555-0199",
  "organization": "City Disaster Management"
}
```
- **Success Response (201)**: Returns user profile and `token`.
- **Error Responses**: `400 Bad Request` (validation), `409 Conflict` (`USER_EXISTS`).

#### `POST /api/v1/auth/login`
- **Authentication**: None
- **Body**:
```json
{
  "email": "admin@unified.gov",
  "password": "password123"
}
```
- **Success Response (200)**: Returns user profile and `token`.
- **Error Responses**: `400 Bad Request`, `401 Unauthorized` (`INVALID_CREDENTIALS`).

#### `GET /api/v1/auth/me`
- **Authentication**: Bearer Token required
- **Success Response (200)**: Safe user profile object.
- **Error Responses**: `401 Unauthorized`.

---

### Incident API

| Method | Endpoint | Auth | Allowed Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/incidents` | Optional | All | Fetch paginated, filtered, searchable incidents |
| `GET` | `/api/v1/incidents/:id` | Optional | All | Fetch single incident by ID or `incidentCode` |
| `POST` | `/api/v1/incidents` | Optional (Dev) / Protected (Prod) | `admin`, `operator`, `responder` | Report new incident |
| `PUT` | `/api/v1/incidents/:id` | Protected | `admin`, `operator`, `responder` | Update incident details |
| `PATCH`| `/api/v1/incidents/:id/status` | Protected | `admin`, `operator`, `responder` | Advance incident status |
| `DELETE`| `/api/v1/incidents/:id` | Protected | `admin`, `operator` | Delete incident record |

#### Query Parameters for `GET /api/v1/incidents`:
- `status`: Filter by status (`reported`, `verified`, `active`, `contained`, `resolved`).
- `severity`: Filter by severity (`low`, `medium`, `high`, `critical`).
- `type`: Filter by hazard type (e.g. `Flood`, `Landslide`, `Fire`).
- `search`: Keyword search across title, description, location, and incident code.
- `page`: Page number (default: `1`).
- `limit`: Records per page (default: `20`, maximum: `100`).
- `sortBy`: Field name (`createdAt`, `updatedAt`, `severity`, `status`, `title`, `affectedPeople`).
- `sortOrder`: `asc` or `desc` (default: `desc`).

#### Sample `POST /api/v1/incidents` Body:
```json
{
  "title": "Severe Levee Breach",
  "description": "Rapid water surge inundating low-lying area.",
  "type": "Flood",
  "severity": "critical",
  "status": "active",
  "location": "Sector 14",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "reportedBy": "Field Sensor #4",
  "affectedPeople": 50
}
```

---

### Resource API

| Method | Endpoint | Auth | Allowed Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/resources` | Optional | All | List resources with search and filter |
| `GET` | `/api/v1/resources/:id` | Optional | All | Get resource by ID or `resourceCode` |
| `POST` | `/api/v1/resources` | Protected | `admin`, `operator`, `medical` | Register new resource inventory |
| `PUT` | `/api/v1/resources/:id` | Protected | `admin`, `operator`, `medical` | Update resource quantities/location |
| `PATCH`| `/api/v1/resources/:id/status` | Protected | `admin`, `operator`, `medical` | Update status (`available`, `low`, etc.) |
| `DELETE`| `/api/v1/resources/:id` | Protected | `admin`, `operator` | Remove resource item |

#### Validation Constraints:
- `quantity >= 0`
- `availableQuantity >= 0`
- `availableQuantity <= quantity`

---

### Hospital API

| Method | Endpoint | Auth | Allowed Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/hospitals` | Optional | All | List hospitals with capacity and status |
| `GET` | `/api/v1/hospitals/:id` | Optional | All | Get single hospital details |
| `POST` | `/api/v1/hospitals` | Protected | `admin`, `medical` | Register hospital facility |
| `PUT` | `/api/v1/hospitals/:id` | Protected | `admin`, `medical` | Update bed counts or status |
| `PATCH`| `/api/v1/hospitals/:id/status` | Protected | `admin`, `medical` | Update emergency intake status |
| `DELETE`| `/api/v1/hospitals/:id` | Protected | `admin` | Remove hospital facility |

#### Validation Constraints:
- `availableBeds <= totalBeds`
- `availableICUBeds <= totalICUBeds`
- All bed counts must be `>= 0`

---

### Team API

| Method | Endpoint | Auth | Allowed Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/teams` | Optional | All | List emergency response teams |
| `GET` | `/api/v1/teams/:id` | Optional | All | Get team by ID or `teamCode` |
| `POST` | `/api/v1/teams` | Protected | `admin`, `operator`, `responder` | Create response unit |
| `PUT` | `/api/v1/teams/:id` | Protected | `admin`, `operator`, `responder` | Update roster or location |
| `PATCH`| `/api/v1/teams/:id/status` | Protected | `admin`, `operator`, `responder` | Update availability / assignment |
| `DELETE`| `/api/v1/teams/:id` | Protected | `admin`, `operator` | Remove team |

---

### Dashboard API

#### `GET /api/v1/dashboard/summary`
- **Authentication**: None / Optional
- **Description**: Real-time aggregation calculated directly from active MongoDB collections.
- **Success Response (200)**:
```json
{
  "success": true,
  "message": "Dashboard summary fetched successfully",
  "data": {
    "activeIncidents": 4,
    "criticalIncidents": 1,
    "availableResources": 4,
    "availableHospitalBeds": 94,
    "activeTeams": 3,
    "totalIncidents": 6,
    "totalHospitalBeds": 300,
    "totalICUBedsAvailable": 13,
    "totalAmbulances": 9,
    "peopleAffected": 378
  }
}
```

---

## 8. Frontend Integration (React.js)

The React frontend communicates with the backend via Vite environment variables.

### Frontend `.env.local`
In the root of the project, configure:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
*(Or `VITE_API_URL=http://localhost:5000/api/v1`)*

### Example Service Call
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function fetchIncidents() {
  const response = await fetch(`${API_BASE}/incidents`, {
    headers: {
      'Content-Type': 'application/json',
      // Attach JWT token if authenticated
      ...(localStorage.getItem('token') && {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }),
    },
  });
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
}
```

---

## 9. Deployment Guidelines

The backend is fully prepared for standard Node.js hosting environments (Vercel, Render, Railway, AWS ECS, Heroku, DigitalOcean App Platform).

### Requirements Checklist:
- Set `NODE_ENV=production`.
- Provide `PORT` (assigned dynamically by platform, e.g. `process.env.PORT`).
- Provide production `MONGODB_URI` (e.g. MongoDB Atlas replica set).
- Provide strong, secret `JWT_SECRET` (at least 32 random characters).
- Provide production `FRONTEND_URL` (e.g. `https://resquard.vercel.app`) to restrict CORS.
- Set container start command to: `npm start` (executes `node src/server.js`).
- Use `/api/v1/health` for platform liveness / readiness probes.

---

## 10. Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| `Startup failure: MONGODB_URI ...` | MongoDB daemon not reachable or connection string invalid | Check MongoDB service is running or check Atlas network access list. |
| `401 Unauthorized: Access denied` | Missing Bearer token in request header | Pass `Authorization: Bearer <token>` in headers. |
| `403 Forbidden: Insufficient privileges` | User role lacks permission for the endpoint | Sign in with an account having `admin` or appropriate role. |
| `CORS error in browser console` | Frontend URL does not match `FRONTEND_URL` env | Add the frontend origin to `FRONTEND_URL` in `.env`. |
| `Duplicate index warning` | Index declared on both field and schema | Already resolved in models. Ensure only unique: true or schema.index is used. |

---

## 11. Testing & Verification Summary

The test runner (`npm test`) executes an in-memory MongoDB environment and validates all 9 test suites:
- **Suite 1: Health Check** — Verifies server telemetry, database connection flag, and legacy aliases.
- **Suite 2: Authentication** — User registration, password hashing, JWT issue, duplicate collision (409), invalid credentials (401), and `/me` route protection.
- **Suite 3: Incident Management** — Creation with GPS validation, filtering, text search, pagination envelope, status workflow patch, and role-based deletion authorization.
- **Suite 4: Resource Management** — Non-negative quantity rules, availableQuantity <= total constraint, inventory status transitions.
- **Suite 5: Hospital Capacity** — Available bed bound validation, ICU limits, emergency intake status patching.
- **Suite 6: Response Teams** — Unit registration, availability transitions, incident dispatch assignment.
- **Suite 7: Dynamic Dashboard** — MongoDB aggregation `$sum` and collection counts directly verified against database state.
- **Suite 8: Centralized Error Handling** — Uniform error schema, 404 route handling, and invalid ID trapping.
- **Suite 9: Security** — Helmet response headers and CORS origin validation.
