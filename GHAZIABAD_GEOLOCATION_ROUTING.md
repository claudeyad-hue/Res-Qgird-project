# Ghaziabad Geolocation & Routing Implementation Report
## Unified Disaster Management Console

---

### Executive Summary

The **Unified Disaster Management Console** has been upgraded with a comprehensive **Ghaziabad-Only Geolocation and Road-Routing Engine**. All geographic records (incidents, hospitals, emergency resources, dispatch response teams, and hazard zones), coordinate validations, browser geolocation queries, nearest hospital triage scoring, and turn-by-turn road routing calculations are strictly restricted to the operational boundaries of **Ghaziabad, Uttar Pradesh, India**.

---

### 1. Architectural Overview & Geographic Scope

#### 1.1 Initial Operating Area Configuration
The initial operational area is configured in `src/utils/geoUtils.js` (frontend) and mirrored in `backend/src/utils/geoUtils.js` (backend) under `GHAZIABAD_CONFIG`:

- **Operational Area Name:** `Ghaziabad, Uttar Pradesh, India`
- **Initial Map Center Coordinates:** `[28.6692, 77.4538]`
- **Initial Map Zoom Level:** `12`
- **Bounding Box Pre-Filter:**
  - Latitude: `28.5800° N` to `28.7800° N`
  - Longitude: `77.3000° E` to `77.5600° E`

#### 1.2 Documented Operational Boundary Polygon
To avoid treating a rough radius as an administrative boundary, an official approximate polygon enclosing the Ghaziabad Municipal and District operational response zone was defined and rendered on the map:
```javascript
boundaryPolygon: [
  [28.7650, 77.4100], // Northwest (Muradnagar approach)
  [28.7750, 77.4700], // North / Duhai
  [28.7400, 77.5300], // Northeast (Govindpuram / Dasna North)
  [28.6850, 77.5450], // East (Dasna / Masuri border)
  [28.6300, 77.5250], // Southeast (NH-9 / Wave City border)
  [28.6000, 77.4550], // South (Crossings Republik / Greater Noida West border)
  [28.6320, 77.3680], // Southwest (NH-9 border along Indirapuram / Noida Sector 62)
  [28.6350, 77.3150], // West-Southwest (Kaushambi / Delhi Anand Vihar border)
  [28.6850, 77.3300], // West (Sahibabad / Seemapuri Delhi border)
  [28.7300, 77.3700], // Northwest (Loni / Mohan Nagar approach)
]
```

#### 1.3 Point-In-Polygon Validation Engine
A reusable ray-casting point-in-polygon algorithm (`isPointInPolygon` and `isPointInOperationalArea`) verifies every coordinate pair:
1. Fast bounding box rejection eliminates distant points in sub-microsecond time.
2. Ray-casting polygon intersection guarantees strict adherence to the district boundary.
3. Coordinates outside Ghaziabad (e.g., Delhi, Noida, Mumbai, international points) are strictly rejected.

---

### 2. Browser Geolocation API Integration

When the operator clicks **"Use My Location"**:
1. Checks browser support (`'geolocation' in navigator`).
2. Requests device GPS permission via `navigator.geolocation.getCurrentPosition`.
3. Handles all error states gracefully:
   - **Permission Denied (Code 1):** Informative notification explaining that location permission is required for vehicle dispatch routing.
   - **Position Unavailable (Code 2):** Clear feedback on hardware/network GPS unavailability.
   - **Request Timeout (Code 3):** User-friendly timeout message with retry instructions.
4. **Boundary Verification:**
   - **In-Area Coordinates:** Stored in React state (`userLocation`), renders a distinct blue beacon marker on the map, flies the viewport to the user at zoom level 14, and enables the **"Route to Incident"** action.
   - **Out-of-Area Coordinates:** Strictly rejected. Does **not** fabricate a location, silently relocate markers, or compute routes from outside Ghaziabad. Displays an explanatory notification banner:
     > *"Your current location (lat, lng) is outside the active operational response area (Ghaziabad, Uttar Pradesh). Navigation and emergency dispatch are only supported within Ghaziabad."*
5. **Simulated In-Area Location for Evaluators:**
   - Evaluators running the console outside Ghaziabad can click **"Demo Location (Ghaziabad HQ)"** / **"Simulate In-Area Location (Ghaziabad)"** to simulate an in-area origin (Indirapuram Command Hub, `28.6410, 77.3750`) without falsifying real GPS readings, ensuring complete evaluation workflows can be executed from anywhere in the world.

---

### 3. Operational Data Records (Demonstration Scenarios)

All operational records have been localized to Ghaziabad and are explicitly labelled as demonstration records.

#### 3.1 Incidents (`src/data/demoIncidents.js`)
- `INC-1042`: Hindon River Embankment Overflow & Inundation (`28.6812, 77.4125`) — Critical, In Progress (NDRF Taskforce 01).
- `INC-1038`: Structural Failure in Commercial Complex, RDC Raj Nagar (`28.6855, 77.4421`) — Critical, Reported.
- `INC-1031`: Chemical Packaging Warehouse Fire, Sahibabad Site 4 (`28.6650, 77.3620`) — High, Assigned (SDRF Rapid Hazmat Unit).
- `INC-1025`: Multi-Vehicle Collision on Hindon Elevated Road, Vasundhara (`28.6530, 77.3820`) — High, Rescue Dispatched.
- `INC-1020`: Mass Food Poisoning at Community Hall, Vaishali Sector 4 (`28.6480, 77.3410`) — Medium, Verified.
- `INC-1014`: Chlorine Gas Cylinder Leak, Kavi Nagar Sector 19 (`28.6720, 77.4610`) — High, In Progress.
- `INC-0998`: Embankment Cave-In on Vijay Nagar Link (`28.6380, 77.4550`) — Low, Resolved.

#### 3.2 Healthcare Facilities (`src/data/initialData.js`)
- `HOSP-01`: MMG District Hospital Ghaziabad (`28.6672, 77.4326`) — Accepting, 42/180 Beds, 7/24 ICU.
- `HOSP-02`: Yashoda Super Speciality Hospital, Kaushambi (`28.6433, 77.3242`) — Accepting, 68/300 Beds, 14/60 ICU.
- `HOSP-03`: Max Super Speciality Hospital, Vaishali (`28.6455, 77.3392`) — Accepting, 55/350 Beds, 12/70 ICU.
- `HOSP-04`: Santosh Medical College & Hospital, Pratap Vihar (`28.6508, 77.4410`) — Accepting, 36/200 Beds, 5/30 ICU.
- `HOSP-05`: Sarvodaya Hospital, Kavi Nagar (`28.6750, 77.4510`) — Accepting, 18/120 Beds, 3/16 ICU.
- `HOSP-06`: Narendra Mohan Hospital, Mohan Nagar (`28.6885, 77.3912`) — Accepting, 40/250 Beds, 8/35 ICU.
- `HOSP-07`: Vijay Nagar Community Health Facility (`28.6360, 77.4560`) — Status: `unavailable` (used to demonstrate exclusion of unavailable hospitals).

#### 3.3 Emergency Resources (`src/data/initialData.js`)
- `RES-01`: Water Tanker Unit (5,000 L), Kavi Nagar Depot (`28.6740, 77.4520`).
- `RES-02`: Emergency Medicine Kits (650 units), MMG Hospital Medical Store (`28.6670, 77.4330`).
- `RES-03`: Emergency Rations (3,200 packs), Mohan Nagar Godown (`28.6870, 77.3930`).
- `RES-04`: Inflatable Rescue Boats (12 boats), Karhera Hindon Staging Base (`28.6800, 77.4100`).
- `RES-05`: Advanced Life Support Ambulances (6 units), Vaishali Sector 1 Hub (`28.6460, 77.3400`).

---

### 4. Dynamic Nearest Hospital Triage Engine

Implemented in `src/utils/geoUtils.js` (`findNearestHospital`):
1. **Scope Filtering:** Only considers candidate hospitals with verified coordinates inside the Ghaziabad boundary.
2. **Exclusion Criteria:** Excludes hospitals with status `unavailable`, `closed`, or `diverting` (e.g. `HOSP-07`).
3. **Haversine Distance Metric:** Dynamically computes straight-line distance (km) using great-circle geometry.
4. **Availability Scoring Tier:** Ranks candidates first by proximity, then by operational acceptance and bed capacity.
5. **Metric Transparency:** Clearly labels the initial triage output as **"Straight-Line (Haversine)"** distance so operators are never confused between straight-line proximity and driving distance.

---

### 5. Genuine Road Routing Engine (OSRM)

Integrated in `src/utils/geoUtils.js` (`fetchOSRMRoute`):
- **Provider:** Public Open Source Routing Machine (OSRM) driving API (`router.project-osrm.org`).
- **Workflows:**
  - **Route A:** In-area user location $\rightarrow$ Selected Ghaziabad incident.
  - **Route B:** Selected Ghaziabad incident $\rightarrow$ Selected suitable Ghaziabad hospital.
- **Visual Presentation:** Renders decoded road polyline geometry directly on Leaflet map:
  - Route A (User $\rightarrow$ Incident): Royal Blue (`#2F6FE0`).
  - Route B (Incident $\rightarrow$ Hospital): Emerald Green (`#27AE60`).
  - Destination Marker: Custom pulsing triage icon.
- **Non-Fabrication Guarantees:**
  - Only genuine OSRM responses with status `ok` produce geometry, distance, and duration.
  - If network or server routing fails, the system returns `status: 'error'`, empty coordinates `[]`, distance `0`, and a clear error explanation.
  - **No straight-line fallbacks are disguised as driving routes**, and no synthetic ETAs are fabricated.

---

### 6. Map UI Controls & Context-Aware Actions

The map controls in `src/components/map/RoutingControls.jsx` and `src/components/map/RoutingPanel.jsx` provide:
- **Incident Quick Selector:** Lists valid Ghaziabad incidents or allows clicking map markers directly.
- **Use My Location:** Requests browser GPS; validates against the Ghaziabad polygon.
- **Route to Incident:** Active only when an in-area origin and incident are selected.
- **Find Nearest Hospital:** Ranks eligible Ghaziabad healthcare centers.
- **Route to Hospital:** Active only when an incident and candidate hospital are selected.
- **Clear Routes:** Resets active routes and triage panels with a single click.
- **Floating Telemetry Panel:** Shows destination, actual road distance in km, driving ETA in minutes, and routing engine verification.

---

### 7. Backend Coordinate Validation

In `backend/src/services/incidentService.js` and `backend/src/utils/geoUtils.js`:
- Incident creation (`POST /api/incidents` or `/api/v1/incidents`) and coordinate updates (`PATCH /api/incidents/:id`) enforce `validateCoordinates`.
- Any submission with coordinates outside Ghaziabad is rejected on the backend with HTTP `400 Bad Request`:
  ```json
  {
    "success": false,
    "error": {
      "message": "Submitted coordinates are outside the operational area (Ghaziabad).",
      "code": "OUT_OF_OPERATIONAL_AREA"
    }
  }
  ```
- **Zero MongoDB additions or database schema migrations introduced**, satisfying non-negotiable Rule 4.

---

### 8. Verification & Test Execution Results

The geospatial unit test suite (`scripts/testGeospatial.js`) was executed via `npm test`:

```
====================================================
 Ghaziabad Geolocation & Geospatial Test Suite
====================================================

--- Test Suite 1: Operational Area Configuration ---
  ✓ PASS: Config ID is GHAZIABAD_UP
  ✓ PASS: Center coordinates configured to Ghaziabad
  ✓ PASS: Default zoom is level 12
  ✓ PASS: Boundary polygon has sufficient vertices

--- Test Suite 2: Ghaziabad Boundary Validation ---
  ✓ PASS: Point inside Ghaziabad accepted: MMG Hospital Ghaziabad (28.6672, 77.4326)
  ✓ PASS: Point inside Ghaziabad accepted: Indirapuram Central Hub (28.641, 77.375)
  ✓ PASS: Point inside Ghaziabad accepted: Raj Nagar RDC (28.6855, 77.4421)
  ✓ PASS: Point inside Ghaziabad accepted: Sahibabad Industrial Area (28.665, 77.362)
  ✓ PASS: Point inside Ghaziabad accepted: Vasundhara Sector 14 (28.653, 77.382)
  ✓ PASS: Point inside Ghaziabad accepted: Kaushambi Sector 1 (28.6433, 77.3242)
  ✓ PASS: Point outside Ghaziabad rejected: Connaught Place, New Delhi (28.6328, 77.2197)
  ✓ PASS: Point outside Ghaziabad rejected: Noida Sector 62 (28.625, 77.365)
  ✓ PASS: Point outside Ghaziabad rejected: Mumbai, Maharashtra (19.076, 72.8777)
  ✓ PASS: Point outside Ghaziabad rejected: Bengaluru, Karnataka (12.9716, 77.5946)
  ✓ PASS: Point outside Ghaziabad rejected: Kolkata, West Bengal (22.5726, 88.3639)
  ✓ PASS: Point outside Ghaziabad rejected: London, UK (51.5074, -0.1278)
  ✓ PASS: validateCoordinates confirms in-area coordinates
  ✓ PASS: validateCoordinates returns error message for out-of-area
  ✓ PASS: validateCoordinates rejects NaN coordinates

--- Test Suite 3: Haversine Distance Calculation ---
  ✓ PASS: Calculated straight-line distance is realistic: 2.5 km
  ✓ PASS: Distance to same point is 0 km

--- Test Suite 4: Dynamic Nearest Hospital Selection ---
  ✓ PASS: Found nearest suitable hospital
  ✓ PASS: Selected closest eligible hospital: MMG District Hospital
  ✓ PASS: Excluded hospital outside Ghaziabad boundary
  ✓ PASS: Excluded unavailable hospital
  ✓ PASS: Identifies distance type as straight-line
  ✓ PASS: Dynamic distance reported: 2.24 km

--- Test Suite 5: Road Routing & Error Handling ---
  ✓ PASS: Invalid coordinates produce status: error
  ✓ PASS: No coordinates fabricated on error
  ✓ PASS: No fake ETA/distance produced on error
Testing live OSRM driving route between Ghaziabad points...
  ✓ PASS: OSRM returned valid polyline geometry with 259 waypoints
  ✓ PASS: OSRM reported road distance: 12.6 km
  ✓ PASS: OSRM reported road travel duration: 15 min
  ✓ PASS: Identified route type as real road

====================================================
 Test Execution Finished: 34 Passed, 0 Failed
====================================================
```

- **Linter Check:** `npm.cmd run lint` passed with 0 errors across 134 files.
- **Production Build:** `npm.cmd run build` transformed 145 modules and produced a clean production bundle in `dist/`.

---

### 9. Step-by-Step Browser Demonstration Workflow

To demonstrate the full workflow in any modern browser:

1. **Start the Frontend Application:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in Google Chrome, Microsoft Edge, or Firefox.

2. **Login:**
   - On `/login`, enter any authorized credentials (e.g. `alex.dawson@ghaziabad.gov.in`, password: `password123`).
   - Role: `Emergency Coordinator`. Click **Sign in →**.

3. **Dashboard:**
   - Note the updated Ghaziabad emergency metrics and situation status.
   - Click **Full map →** or select **Live Map** from the left navigation bar.

4. **Map Initial View:**
   - Verify the map initially centers on **Ghaziabad, Uttar Pradesh** (zoom level 12).
   - Observe the dashed blue **Ghaziabad Operational Boundary Polygon**.
   - Note that all incident, hospital, team, and resource markers are situated inside Ghaziabad.

5. **Select Incident:**
   - In the top-right routing panel, select `INC-1042: Flood` (Karhera Hindon River) from the dropdown, or click the marker on the map.

6. **Acquire Location:**
   - Click **🎯 Use My Location**.
   - If evaluated inside Ghaziabad, browser GPS is validated and marked with a blue beacon.
   - If evaluated outside Ghaziabad, the console displays the out-of-area notification banner:
     *"Your location is outside the active operational response area (Ghaziabad, Uttar Pradesh)."*
   - Click **Demo Location (Ghaziabad HQ)** or **Simulate In-Area Location (Ghaziabad)** to establish an in-area command origin at Indirapuram (`28.6410, 77.3750`).

7. **Route A (Dispatch Route to Incident):**
   - Click **🚨 Route to Incident**.
   - Observe the blue road polyline dynamically rendered along the Ghaziabad road network.
   - View actual road distance and driving ETA in the floating routing panel.

8. **Find Nearest Suitable Hospital:**
   - Click **🏥 Find Nearest Hospital**.
   - The triage engine computes straight-line distances using the Haversine formula, excludes unavailable hospitals (such as `HOSP-07`), and selects the closest eligible facility (`MMG District Hospital Ghaziabad`).
   - The panel displays the straight-line distance, bed availability, and status.

9. **Route B (Transfer Route to Hospital):**
   - Click **🚑 Route to Hospital**.
   - The green road polyline is rendered from the incident location to the hospital, with a pulsing triage destination pin.
   - The routing panel updates with road distance, driving ETA, and verified route status.

10. **Clear & Reset:**
    - Click **✕ Clear Routes** to reset active routes and resume general surveillance.

---

### 10. Modified and Created Files Summary

| File Path | Action | Description |
|:---|:---|:---|
| `src/utils/geoUtils.js` | Updated | Ghaziabad configuration, boundary polygon, point-in-polygon ray casting, coordinate validator, dynamic hospital triage, and OSRM road routing without fake fallbacks. |
| `backend/src/utils/geoUtils.js` | Created | Backend geospatial validation mirroring the Ghaziabad boundary. |
| `backend/src/services/incidentService.js` | Updated | Backend coordinate validation rejecting out-of-area submissions with `400 Bad Request`. |
| `src/services/incidentService.js` | Updated | Frontend service updated with Ghaziabad defaults, coordinate validation, and isolated local storage key. |
| `src/data/initialData.js` | Updated | Localized hospitals, resources, and operational data within Ghaziabad. |
| `src/data/demoIncidents.js` | Updated | Realistic Ghaziabad emergency demonstration incidents with valid coordinates. |
| `src/data/demoTeams.js` | Updated | Response teams positioned within Ghaziabad districts. |
| `src/data/demoZones.js` | Updated | Hazard overlays mapped to Ghaziabad geographic landmarks. |
| `src/components/map/DisasterMap.jsx` | Updated | Initial Ghaziabad center & zoom, boundary polygon layer, in-area record filtering, robust geolocation handling, and out-of-area rejection. |
| `src/components/map/RoutingControls.jsx` | Updated | Context-aware routing actions, geolocation triggers, and demo origin helper. |
| `src/components/map/RoutingPanel.jsx` | Updated | Clear distinction between straight-line and driving distances; non-fabrication error display. |
| `src/components/map/RouteLayer.jsx` | Updated | Strict rendering of road polylines only on status `ok`. |
| `src/components/map/ReportIncidentMapModal.jsx` | Updated | Ghaziabad coordinate default, boundary validation, and out-of-area warning banner. |
| `scripts/testGeospatial.js` | Created | Comprehensive automated unit test suite. |
| `package.json` | Updated | Added `npm test` and `npm run test:geo` scripts. |
| `GHAZIABAD_GEOLOCATION_ROUTING.md` | Created | Comprehensive technical report and demonstration guide. |

---

### 11. Known Limitations & Future Expansion

- **Routing Provider Limits:** Public demo OSRM (`router.project-osrm.org`) has rate throttling under heavy concurrency. In high-traffic production environments, point to a self-hosted OSRM docker instance or OpenRouteService instance via environment variable.
- **Single Operational Area:** Currently scoped exclusively to Ghaziabad, Uttar Pradesh. `GHAZIABAD_CONFIG` is decoupled in `geoUtils.js` so that adding future districts requires only adding corresponding boundary polygon definitions.
