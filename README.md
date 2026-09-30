# ResQuard — Unified Disaster Management Console

> **React.js Migration** of the original HTML/CSS/JS application.  
> Built with **Vite + React 19 + React Router v7 + JSX**.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
resQuard/
├── index.html
├── vite.config.js
├── package.json
├── README.md
│
└── src/
    ├── main.jsx                  # App entry point
    ├── App.jsx                   # Router + AuthGuard
    │
    ├── styles/
    │   └── global.css            # All CSS variables, layouts, components
    │
    ├── data/
    │   └── initialData.js        # Incidents, Hospitals, Resources, Users
    │
    ├── context/
    │   └── AppContext.jsx        # Global state: auth, theme, incidents, resources, hospitals
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx        # Shell wrapper (Sidebar + Outlet + Toast)
    │   │   ├── Sidebar.jsx       # Navigation sidebar with active states
    │   │   └── Header.jsx        # Top bar with title + avatar
    │   │
    │   ├── common/
    │   │   ├── Toast.jsx         # Global toast notification
    │   │   ├── Modal.jsx         # Reusable modal with Escape dismiss
    │   │   ├── Drawer.jsx        # Slide-in drawer with scrim
    │   │   ├── Badge.jsx         # Severity / status badges
    │   │   ├── StatCard.jsx      # Dashboard stat card
    │   │   └── RiskDot.jsx       # Coloured severity dot
    │   │
    │   ├── dashboard/
    │   │   ├── SituationBar.jsx        # Current situation alert bar
    │   │   ├── ResourceUtilization.jsx # Bar chart rows
    │   │   └── RecentActivity.jsx      # Activity feed
    │   │
    │   ├── map/
    │   │   ├── MapCanvas.jsx     # Interactive marker map (mini/full/hospital)
    │   │   ├── LayerPanel.jsx    # Layer toggles overlay
    │   │   └── MapLegend.jsx     # Severity colour legend
    │   │
    │   ├── incidents/
    │   │   ├── IncidentFilters.jsx        # Search + chip filters + Report button
    │   │   ├── IncidentTable.jsx          # Sortable incident table
    │   │   ├── IncidentDrawerContent.jsx  # Drawer detail + action buttons
    │   │   └── ReportIncidentModal.jsx    # New incident modal form
    │   │
    │   ├── resources/
    │   │   ├── ResourceTable.jsx   # Resource list table
    │   │   └── ResourceDrawer.jsx  # Allocation drawer with validation
    │   │
    │   └── hospitals/
    │       ├── HospitalTable.jsx   # Hospital capacity table
    │       └── HospitalDrawer.jsx  # Hospital detail + transfer request
    │
    └── pages/
        ├── Login.jsx       # Login screen with validation
        ├── Dashboard.jsx   # Main dashboard
        ├── Map.jsx         # Full live map page
        ├── Incidents.jsx   # Incident management page
        ├── Resources.jsx   # Resource management page
        ├── Hospitals.jsx   # Hospital capacity page
        ├── Profile.jsx     # User profile + inline edit
        └── Settings.jsx    # Theme, notifications, sign out
```

---

## ✅ Features Migrated

| Feature | Status |
|---|---|
| Login screen with email & password validation | ✅ Done |
| Role selection on login | ✅ Done |
| Auth guard (redirect unauthenticated users) | ✅ Done |
| Logout / Sign out | ✅ Done |
| Sidebar navigation (all 7 screens) | ✅ Done |
| Active nav state with React Router | ✅ Done |
| Critical incident badge on nav | ✅ Done |
| Dashboard stats (5 stat cards) | ✅ Done |
| Situation bar (live summary) | ✅ Done |
| Mini incident map on dashboard | ✅ Done |
| Active incidents panel on dashboard | ✅ Done |
| Resource utilization bar chart | ✅ Done |
| Recent activity feed | ✅ Done |
| Hospital capacity quick stats | ✅ Done |
| Full live map with incident markers | ✅ Done |
| Map layer toggles (incidents/hospitals/teams) | ✅ Done |
| Map zoom in / out | ✅ Done |
| Map search filter | ✅ Done |
| Map legend | ✅ Done |
| Incident list with search | ✅ Done |
| Incident severity chip filters | ✅ Done |
| Incident detail drawer | ✅ Done |
| Assign team to incident | ✅ Done |
| Update incident status (flow) | ✅ Done |
| Report incident modal with form | ✅ Done |
| Resource list table | ✅ Done |
| Resource allocation drawer | ✅ Done |
| Allocation quantity validation | ✅ Done |
| Hospital list table | ✅ Done |
| Hospital detail drawer with capacity bars | ✅ Done |
| Hospital transfer request | ✅ Done |
| Profile view with user details | ✅ Done |
| Inline profile editing | ✅ Done |
| Profile form validation (email) | ✅ Done |
| Save profile with toast feedback | ✅ Done |
| Settings page | ✅ Done |
| Dark / Light theme toggle | ✅ Done |
| Notification toggle | ✅ Done |
| Toast notifications (global) | ✅ Done |
| Reusable Modal component | ✅ Done |
| Reusable Drawer component | ✅ Done |
| Responsive layout (desktop + mobile) | ✅ Done |
| Mobile bottom navigation bar | ✅ Done |
| Keyboard accessibility (Escape, Enter) | ✅ Done |

---

## 📦 Dependencies Added

| Package | Version | Reason |
|---|---|---|
| `react` | ^19.2.8 | Core framework |
| `react-dom` | ^19.2.8 | DOM rendering |
| `react-router-dom` | ^7.x | Client-side routing between screens |
| `vite` | ^8.3.0 | Build tool & dev server |
| `@vitejs/plugin-react` | ^6.1.1 | Vite React JSX transform |

> No Redux, no external UI library, no extra icon fonts. All icons use Unicode/emoji characters matching the original design.

---

## 🔁 State Architecture

All shared state lives in **`AppContext.jsx`**:

```
AppContext
├── Auth          → isAuthenticated, login(), logout()
├── User          → name, role, email, phone, org
├── Incidents     → list, reportIncident(), assignTeam(), updateIncidentStatus()
├── Resources     → list, allocateResource()
├── Hospitals     → list, requestHospitalTransfer()
├── Drawer        → isOpen, type, id, openDrawer(), closeDrawer()
├── Modal         → isReportModalOpen, openReportModal(), closeReportModal()
├── Toast         → show, message, showToast()
├── Theme         → theme, toggleAppearance()
├── Notifications → enabled, toggleNotifications()
└── Map           → layers, zoom, search, toggleMapLayer(), zoomIn(), zoomOut()
```

---

## 🎨 UI Preservation

- All CSS custom properties (`--primary`, `--critical`, `--high`, etc.) preserved exactly
- Dark/light theme via `data-theme` attribute on `<html>`
- Pulse animation on critical markers retained
- All hover, active, and focus states preserved
- Responsive breakpoint at `860px` — sidebar collapses to mobile bottom bar
- Drawer slide transition, scrim fade, toast slide-up all preserved

---

## 🛠 How to Run

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

### Demo Login
Use **any email** in a valid format (e.g. `admin@unified.gov`) and **any password** ≥ 6 characters.

---

## 📋 Migration Notes

1. **No `dangerouslySetInnerHTML`** — every element is proper JSX
2. **Zero DOM manipulation** — all `getElementById`, `classList`, `innerHTML` replaced with React state
3. **Data separated** into `src/data/initialData.js` — no hardcoded data in JSX
4. **Map** uses CSS grid + absolute-positioned markers (same as original) — no external map library needed
5. **Forms** use controlled inputs with `useState`
6. **Toasts** auto-dismiss after 2.2 seconds via `useEffect`

---

*Generated — ResQuard React Migration · 2026*
