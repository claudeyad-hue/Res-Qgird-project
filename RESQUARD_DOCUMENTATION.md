# 🚨 Res-QGIRD — Disaster Response System Documentation

> **Full-Stack Disaster Response Web Application**  
> React + Vite Frontend · Node.js + Express.js Backend · Leaflet + OpenStreetMap Interactive Map

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Interactive Disaster Map](#5-interactive-disaster-map)
6. [Frontend Services Layer](#6-frontend-services-layer)
7. [Backend Architecture](#7-backend-architecture)
8. [REST API Reference](#8-rest-api-reference)
9. [Data Models](#9-data-models)
10. [Workflow Engine](#10-workflow-engine)
11. [Environment Variables](#11-environment-variables)
12. [Running the Project](#12-running-the-project)
13. [Deployment](#13-deployment)
14. [MongoDB Migration Path](#14-mongodb-migration-path)
15. [Git & Version Control](#15-git--version-control)

---

## 1. Project Overview

**Res-QGIRD** (Resource-based Quick Incident Response & Disaster Management) is a production-quality, real-time disaster-response web application built for emergency coordinators.

### Key Features

| Feature | Description |
|---|---|
| 🗺️ Interactive Map | Real Leaflet + OpenStreetMap map with GPS location, incident markers, team markers, zone overlays |
| 🚨 Incident Management | Report, verify, assign, track, and resolve incidents with full workflow |
| 👥 Team Dispatch | Track response teams, assign to incidents, monitor team status |
| 🏥 Hospital & Resource Tracking | Monitor hospital capacity and emergency resources |
| 📊 Dashboard | Live stats, activity feed, resource utilization charts |
| 🔴 Disaster Zones | Visualize high-risk zones with color-coded overlays |
| 📡 Live Polling | Frontend auto-refreshes data every 25 seconds |
| 🌐 Demo Mode | Full offline fallback with realistic Indian disaster scenario data |

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | Latest | Build tool & dev server |
| React Router | 6.x | Client-side routing |
| Leaflet | 1.9.4 | Interactive map engine |
| React-Leaflet | 5.0.0 | React bindings for Leaflet |
| OpenStreetMap | — | Free tile provider (no API key) |
| Tailwind CSS | 3.x | Utility-first styling |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18.x | Runtime |
| Express.js | ^4.21.2 | HTTP server & routing |
| CORS | ^2.8.5 | Cross-origin requests |
| dotenv | ^16.4.7 | Environment variables |

> **No database in this phase.** All data is stored in-memory. See [MongoDB Migration Path](#14-mongodb-migration-path) for future DB integration.

---

## 3. Project Structure

```
resQuard/
├── src/                          # React frontend
│   ├── components/
│   │   ├── common/               # Badge, Drawer, Modal, RiskDot, StatCard, Toast
│   │   ├── dashboard/            # RecentActivity, ResourceUtilization, SituationBar
│   │   ├── hospitals/            # HospitalDrawer, HospitalTable
│   │   ├── incidents/            # IncidentDrawerContent, IncidentFilters, IncidentTable, ReportIncidentModal
│   │   ├── layout/               # Header, Layout, Sidebar
│   │   ├── map/                  # All map components (see Section 5)
│   │   └── resources/            # ResourceDrawer, ResourceTable
│   ├── context/
│   │   └── AppContext.jsx        # Central React state store (live polling, GPS, workflow)
│   ├── data/
│   │   ├── demoIncidents.js      # 9 seeded incidents (real Indian coordinates)
│   │   ├── demoTeams.js          # 6 seeded response teams
│   │   ├── demoZones.js          # 5 disaster zones with polygons
│   │   └── initialData.js        # Legacy data (preserved for compatibility)
│   ├── pages/
│   │   ├── Dashboard.jsx         # Main dashboard with mini map
│   │   ├── Map.jsx               # Full interactive map page
│   │   ├── Incidents.jsx         # Incident management table
│   │   ├── Hospitals.jsx         # Hospital capacity view
│   │   ├── Resources.jsx         # Resource tracking
│   │   ├── Login.jsx             # Authentication page
│   │   ├── Profile.jsx           # User profile
│   │   └── Settings.jsx          # App settings
│   ├── services/
│   │   ├── incidentService.js    # CRUD + demo fallback for incidents
│   │   ├── teamService.js        # Team data service
│   │   ├── zoneService.js        # Disaster zone service
│   │   ├── geocodingService.js   # Nominatim reverse geocoding
│   │   └── routingService.js     # OSRM route calculation
│   ├── styles/
│   │   ├── global.css            # App-wide styles
│   │   └── map.css               # Leaflet & map-specific styles
│   ├── App.jsx                   # Route definitions
│   └── main.jsx                  # Entry point
│
├── backend/                      # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js      # INCIDENT_TYPES, SEVERITIES, STATUSES, WORKFLOW_STEPS
│   │   │   └── env.js            # Loads .env, exports config object
│   │   ├── services/
│   │   │   ├── incidentRepository.js  # In-memory incident store (9 seeded records)
│   │   │   ├── teamRepository.js      # In-memory team store (6 seeded records)
│   │   │   ├── incidentService.js     # Business logic: filtering, pagination, workflow validation
│   │   │   └── teamService.js         # Business logic: assignment validation
│   │   ├── controllers/
│   │   │   ├── healthController.js    # GET /api/health
│   │   │   ├── incidentController.js  # Incident CRUD handlers
│   │   │   └── teamController.js      # Team CRUD handlers
│   │   ├── routes/
│   │   │   ├── incidentRoutes.js      # /api/incidents routes
│   │   │   ├── teamRoutes.js          # /api/teams routes
│   │   │   └── index.js               # Mounts all routers
│   │   ├── middleware/
│   │   │   ├── errorHandler.js        # Global error handler + 404
│   │   │   └── validate.js            # Request field validation helpers
│   │   ├── utils/
│   │   │   ├── apiResponse.js         # Standardized API response class
│   │   │   └── idGenerator.js         # Auto-increment ID generators
│   │   ├── app.js                     # Express app setup
│   │   └── server.js                  # HTTP server entry point
│   ├── .env                           # Local secrets (not committed)
│   ├── .env.example                   # Template for .env
│   ├── .gitignore
│   └── package.json
│
├── public/                       # Static assets
├── index.html                    # HTML entry point
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
├── package.json                  # Frontend deps (react, leaflet, etc.)
└── RESQUARD_DOCUMENTATION.md     # ← You are here
```

---

## 4. Frontend Architecture

### Routing (`App.jsx`)

| Route | Page | Auth Required |
|---|---|---|
| `/login` | Login.jsx | No |
| `/` | Dashboard.jsx | Yes |
| `/map` | Map.jsx | Yes |
| `/incidents` | Incidents.jsx | Yes |
| `/hospitals` | Hospitals.jsx | Yes |
| `/resources` | Resources.jsx | Yes |
| `/profile` | Profile.jsx | Yes |
| `/settings` | Settings.jsx | Yes |

### State Management (`AppContext.jsx`)

`AppContext` is the single source of truth for the entire app. Key state:

```js
{
  incidents: [],          // All active incidents
  teams: [],              // All response teams
  zones: [],              // Disaster zones
  userLocation: null,     // { lat, lng } from Browser Geolocation API
  isPolling: false,       // Live polling active flag
  lastUpdated: null,      // Timestamp of last data refresh
  demoMode: true,         // Falls back to local data when API unavailable
  selectedIncident: null, // Currently selected incident (for drawer/popup)
  filter: 'all',          // Active filter in incident table
}
```

**Live Polling:** AppContext polls `incidentService.getAll()` every **25 seconds** automatically when the map page is active.

---

## 5. Interactive Disaster Map

All map components live in `src/components/map/`.

### Component Tree

```
Map.jsx (page)
└── DisasterMap.jsx              # Root Leaflet MapContainer
    ├── TileLayer                # OpenStreetMap tiles
    ├── UserLocationMarker.jsx   # Blue pulsing dot (GPS position)
    ├── IncidentClusters.jsx     # Clustered incident markers (by severity color)
    │   └── IncidentPopup.jsx    # Click popup with full incident details
    ├── ResponseTeamMarker.jsx   # Team vehicle markers with status badges
    ├── DisasterZoneOverlay.jsx  # Polygon overlays for risk zones
    ├── IncidentDensityOverlay.jsx # Heatmap-style density visualization
    ├── MapClickHandler.jsx      # Handles map click → report new incident
    ├── MapControls.jsx          # GPS center, zoom controls, layer toggles
    ├── IncidentMapFilters.jsx   # Filter incidents by type/severity on map
    ├── LayerPanel.jsx           # Toggle layers (zones, teams, density)
    └── MapLegend.jsx            # Color legend for severity levels
```

`MapCanvas.jsx` is a thin adapter used on the **Dashboard mini-map** (`<MapCanvas variant="mini" />`). It passes props straight to `DisasterMap.jsx` for backward compatibility.

### Map Icon System (`mapIcons.js`)

All markers use `L.divIcon` with inline SVGs — **no external image files** needed. This avoids Vite bundling issues with Leaflet's default icon paths.

| Marker | Visual | Used For |
|---|---|---|
| Critical | 🔴 Red pulsing circle | Critical severity incidents |
| High | 🟠 Orange circle | High severity incidents |
| Medium | 🟡 Yellow circle | Medium severity incidents |
| Low | 🟢 Green circle | Low / Resolved incidents |
| Team | 🚑 Blue van icon | Response teams |
| User | 💙 Blue GPS dot | Your current location |

### Map Layers (Toggleable)

| Layer | Default | Description |
|---|---|---|
| Incident Markers | ON | Clustered severity-colored pins |
| Disaster Zones | ON | Polygon overlays (red/orange/yellow fill) |
| Response Teams | ON | Team vehicle icons with status |
| Density Overlay | OFF | Incident density heatmap |

### Technologies Used

| Tech | Purpose |
|---|---|
| **Leaflet 1.9.4** | Core map engine |
| **React-Leaflet 5.0.0** | React component bindings |
| **OpenStreetMap** | Free map tiles (no API key required) |
| **Browser Geolocation API** | User GPS location (`navigator.geolocation`) |
| **Nominatim** | Reverse geocoding (coordinate → address) |
| **OSRM** | Open-source routing (team → incident route) |

### GPS Location Flow

```
User clicks "My Location"
  → navigator.geolocation.getCurrentPosition()
    → Success: setUserLocation({ lat, lng })
      → Map flies to user position
      → UserLocationMarker renders pulsing dot
    → Error: Toast notification shown
```

---

## 6. Frontend Services Layer

### `incidentService.js`

Handles all incident data operations with **automatic demo mode fallback**:

```js
// When VITE_API_BASE_URL is set → calls REST API
// When VITE_API_BASE_URL is empty → uses localStorage + demoIncidents.js

getAll(filters?)        // GET /api/incidents
getById(id)             // GET /api/incidents/:id
create(data)            // POST /api/incidents
update(id, data)        // PUT /api/incidents/:id
updateStatus(id,status) // PATCH /api/incidents/:id/status
delete(id)              // DELETE /api/incidents/:id
```

### `teamService.js`

```js
getAll()                // GET /api/teams
getById(id)             // GET /api/teams/:id
updateStatus(id,status) // PATCH /api/teams/:id/status
assign(id, incidentId)  // PATCH /api/teams/:id/assign
```

### `zoneService.js`

```js
getAll()                // Returns disaster zone polygons
```

### `geocodingService.js`

Uses **Nominatim** (OpenStreetMap's free geocoder):

```js
reverseGeocode(lat, lng) // → { address, city, state, country }
```

### `routingService.js`

Uses **OSRM** (free open-source routing):

```js
getRoute(fromLatLng, toLatLng) // → { distance, duration, coordinates[] }
```

---

## 7. Backend Architecture

### Layered Architecture

```
HTTP Request
    ↓
Express Router (routes/)
    ↓
Controller (controllers/)    ← Handles req/res, calls service
    ↓
Service (services/*Service)  ← Business logic, validation
    ↓
Repository (services/*Repository) ← Data access (in-memory array)
    ↓
Response via ApiResponse utility
```

### File Descriptions

| File | Purpose |
|---|---|
| `server.js` | Starts HTTP server, logs port |
| `app.js` | Creates Express app, sets up CORS, JSON parsing, mounts routes |
| `config/env.js` | Loads `.env`, exports `config` object |
| `config/constants.js` | All allowed enum values (types, statuses, severities) |
| `utils/apiResponse.js` | `ApiResponse.success()`, `.created()`, `.error()` static methods |
| `utils/idGenerator.js` | `generateIncidentId()`, `generateTeamId()` (auto-increment) |
| `services/incidentRepository.js` | In-memory incident array + CRUD async methods |
| `services/teamRepository.js` | In-memory team array + CRUD async methods |
| `services/incidentService.js` | Filtering, pagination, workflow validation |
| `services/teamService.js` | Assignment validation, status transitions |
| `middleware/errorHandler.js` | Global Express error handler + 404 handler |
| `middleware/validate.js` | Required field checks, lat/lng range validation |
| `controllers/healthController.js` | `GET /api/health` → server status |
| `controllers/incidentController.js` | All incident CRUD handlers |
| `controllers/teamController.js` | All team CRUD handlers |
| `routes/incidentRoutes.js` | Maps HTTP verbs → incident controller |
| `routes/teamRoutes.js` | Maps HTTP verbs → team controller |
| `routes/index.js` | Mounts all routers under `/api` |

---

## 8. REST API Reference

**Base URL:** `http://localhost:5000/api`

All responses follow the `ApiResponse` format:

```json
{
  "success": true,
  "message": "OK",
  "data": { ... },
  "timestamp": "2026-09-29T18:05:00.000Z"
}
```

---

### Health

#### `GET /api/health`

Check if the backend is running.

**Response `200`:**
```json
{
  "success": true,
  "message": "Res-QGIRD backend is running",
  "data": {
    "status": "ok",
    "uptime": 123.45,
    "env": "development"
  }
}
```

---

### Incidents

#### `GET /api/incidents`

Get all incidents with optional filters.

**Query Parameters:**

| Param | Type | Example | Description |
|---|---|---|---|
| `type` | string | `Fire` | Filter by incident type |
| `severity` | string | `Critical` | Filter by severity |
| `status` | string | `Reported` | Filter by status |
| `page` | number | `1` | Page number (default: 1) |
| `limit` | number | `20` | Results per page (default: 20) |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "incidents": [ { ...incident } ],
    "total": 9,
    "page": 1,
    "limit": 20
  }
}
```

---

#### `GET /api/incidents/:id`

Get a single incident by ID.

**Response `200`:**
```json
{
  "success": true,
  "data": { ...incident }
}
```

**Response `404`:**
```json
{
  "success": false,
  "message": "Incident not found"
}
```

---

#### `POST /api/incidents`

Report a new incident.

**Request Body (required fields):**

```json
{
  "title": "Building Fire at MG Road",
  "type": "Fire",
  "severity": "Critical",
  "lat": 12.9716,
  "lng": 77.5946,
  "address": "MG Road, Bengaluru",
  "reportedBy": "Citizen"
}
```

**Optional fields:** `description`, `affectedCount`, `assignedTeamId`

**Response `201`:**
```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": { ...incident }
}
```

---

#### `PUT /api/incidents/:id`

Update an incident (full update).

**Request Body:** Same shape as POST, all fields optional.

**Response `200`:**
```json
{
  "success": true,
  "message": "Incident updated",
  "data": { ...updatedIncident }
}
```

---

#### `PATCH /api/incidents/:id/status`

Advance incident workflow status.

**Request Body:**
```json
{
  "status": "Verified"
}
```

**Valid status transitions (in order):**
```
Reported → Verified → Assigned → Rescue Dispatched → En Route → On Scene → Resolved
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Status updated to Verified",
  "data": { ...incident }
}
```

**Response `400` (invalid transition):**
```json
{
  "success": false,
  "message": "Invalid status transition from 'On Scene' to 'Reported'"
}
```

---

#### `DELETE /api/incidents/:id`

Delete an incident.

**Response `200`:**
```json
{
  "success": true,
  "message": "Incident deleted"
}
```

---

### Teams

#### `GET /api/teams`

Get all response teams.

**Response `200`:**
```json
{
  "success": true,
  "data": [ { ...team } ]
}
```

---

#### `GET /api/teams/:id`

Get a single team by ID.

---

#### `PATCH /api/teams/:id/status`

Update team status.

**Request Body:**
```json
{
  "status": "Available"
}
```

**Valid statuses:** `Available`, `Assigned`, `En Route`, `On Scene`, `Unavailable`

---

#### `PATCH /api/teams/:id/assign`

Assign a team to an incident.

**Request Body:**
```json
{
  "incidentId": "INC-001"
}
```

**Response `400` if team is not Available:**
```json
{
  "success": false,
  "message": "Team is not available (current status: En Route)"
}
```

---

## 9. Data Models

### Incident

```json
{
  "id": "INC-001",
  "title": "Structural Fire at MG Road",
  "type": "Fire",
  "severity": "Critical",
  "status": "On Scene",
  "lat": 12.9716,
  "lng": 77.5946,
  "address": "MG Road, Bengaluru, Karnataka",
  "description": "5-storey commercial building fire, multiple casualties reported",
  "reportedBy": "Fire Control Room",
  "affectedCount": 45,
  "assignedTeamId": "TEAM-001",
  "reportedAt": "2026-09-29T06:30:00.000Z",
  "updatedAt": "2026-09-29T07:15:00.000Z"
}
```

### Team

```json
{
  "id": "TEAM-001",
  "name": "Alpha Fire Unit",
  "type": "Fire",
  "status": "On Scene",
  "lat": 12.9720,
  "lng": 77.5950,
  "members": 6,
  "equipment": ["Fire Engine", "Thermal Camera", "Rescue Kit"],
  "assignedIncidentId": "INC-001",
  "phone": "+91-80-1001-0001"
}
```

### Disaster Zone

```json
{
  "id": "ZONE-001",
  "name": "Bengaluru Central Risk Zone",
  "riskLevel": "High",
  "color": "#ff4444",
  "polygon": [
    [12.9800, 77.5900],
    [12.9900, 77.6100],
    [12.9700, 77.6200],
    [12.9600, 77.5900]
  ],
  "description": "Dense urban area with high fire risk"
}
```

---

## 10. Workflow Engine

Incidents move through a defined lifecycle. The backend validates all transitions:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐
│ Reported │ → │ Verified │ → │ Assigned │ → │ Rescue Dispatched│
└──────────┘    └──────────┘    └──────────┘    └──────────────────┘
                                                          ↓
                                                   ┌──────────┐
                                                   │ En Route │
                                                   └──────────┘
                                                          ↓
                                                   ┌──────────┐
                                                   │ On Scene │
                                                   └──────────┘
                                                          ↓
                                                   ┌──────────┐
                                                   │ Resolved │
                                                   └──────────┘
```

**Special statuses** (can be set anytime):
- `In Progress` — parallel work happening
- `False Alarm` — skip to closed state

---

## 11. Environment Variables

### Frontend (`.env.local` in project root)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> If this is **not set**, the app runs in **Demo Mode** using local data.

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**All available variables:**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Backend server port |
| `NODE_ENV` | `development` | Environment name |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |

---

## 12. Running the Project

### Prerequisites

- Node.js ≥ 18.x
- npm (use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`)

### Start the Frontend

```powershell
# In project root (c:\Users\ASUS\Downloads\resQuard)
npm.cmd install
npm.cmd run dev
# → http://localhost:5173
```

### Start the Backend

```powershell
# In backend directory
cd backend
npm.cmd install
npm.cmd run dev
# → http://localhost:5000
```

### Enable Live API Connection

Create `c:\Users\ASUS\Downloads\resQuard\.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Then restart the frontend dev server. The app will connect to the real backend instead of demo mode.

### Verify Backend is Running

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Expected:
```json
{ "success": true, "message": "Res-QGIRD backend is running" }
```

---

## 13. Deployment

### Frontend — Vercel

The React frontend is already deployed on Vercel.

**To redeploy after changes:**

```bash
# Push to GitHub main branch (Vercel auto-deploys)
git add .
git commit -m "feat: add backend integration"
git push origin main
```

**Set env vars in Vercel Dashboard:**

```
VITE_API_BASE_URL = https://your-backend.railway.app/api
```

### Backend — Railway / Render / Fly.io (recommended free options)

**Railway (recommended):**
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `resQuard` repo → set root to `/backend`
4. Add environment variables: `PORT`, `NODE_ENV=production`, `FRONTEND_URL=https://your-vercel-app.vercel.app`
5. Railway auto-assigns a public URL

**Render:**
1. Go to [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node src/server.js`

---

## 14. MongoDB Migration Path

The backend is designed with a **Repository Pattern** — swapping in MongoDB requires only replacing `incidentRepository.js` and `teamRepository.js`.

### Step 1 — Install Mongoose

```bash
npm install mongoose
```

### Step 2 — Add MongoDB URI to `.env`

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/resquard
```

### Step 3 — Create Mongoose Models

```js
// src/models/Incident.js
import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  id: String,
  title: { type: String, required: true },
  type: String,
  severity: String,
  status: { type: String, default: 'Reported' },
  lat: Number,
  lng: Number,
  address: String,
  reportedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Incident', incidentSchema);
```

### Step 4 — Replace Repository Methods

```js
// Replace in-memory array operations with Mongoose calls:
// getAll()    → Incident.find(filter).lean()
// getById(id) → Incident.findOne({ id })
// create(d)   → new Incident(d).save()
// update(id)  → Incident.findOneAndUpdate({ id }, data, { new: true })
// delete(id)  → Incident.findOneAndDelete({ id })
```

**Controllers and services require zero changes.**

---

## 15. Git & Version Control

> **Note:** Git is not pre-installed on this machine. Use the instructions below to set up version control.

### Install Git

Download from: [https://git-scm.com/download/win](https://git-scm.com/download/win)

### Initialize Repository

```powershell
# In project root
git init
git add .
git commit -m "feat: initial commit — Res-QGIRD full stack"
```

### Push to GitHub

```powershell
# Create a repo at github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/resQuard.git
git branch -M main
git push -u origin main
```

### Recommended `.gitignore`

```
node_modules/
dist/
.env
.env.local
backend/.env
*.log
```

---

## Summary of Completed Work

| Module | Status | Notes |
|---|---|---|
| React Frontend | ✅ Complete | Vite + React + Tailwind, all pages |
| Interactive Map | ✅ Complete | Leaflet + OpenStreetMap, real GPS, clustering |
| Map Components | ✅ Complete | 12 map components built |
| Services Layer | ✅ Complete | incident, team, zone, geocoding, routing |
| Demo Data | ✅ Complete | 9 incidents, 6 teams, 5 zones (real Indian coords) |
| AppContext | ✅ Complete | Live polling, GPS state, workflow engine |
| Backend Setup | ✅ Complete | package.json, .env, config, utils, repositories |
| Backend Services | 🔄 In Progress | incidentService.js, teamService.js |
| Backend Controllers | 🔄 In Progress | health, incident, team controllers |
| Backend Routes | 🔄 In Progress | Route files + index |
| Backend App/Server | 🔄 In Progress | app.js, server.js |
| Frontend `.env.local` | ⏳ Pending | Add VITE_API_BASE_URL after backend deployed |

---

*Documentation generated for Res-QGIRD v1.0 — September 2026*
