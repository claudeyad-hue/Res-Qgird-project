import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  INITIAL_RESOURCES,
  INITIAL_HOSPITALS,
  INITIAL_USER,
} from '../data/initialData';
import incidentService from '../services/incidentService';
import teamService from '../services/teamService';
import zoneService from '../services/zoneService';
import authService from '../services/authService';

const AppContext = createContext(null);

// Complete emergency incident response workflow (Section O)
// REPORT -> VERIFY -> ASSIGN RESPONSE TEAM -> RESCUE DISPATCHED -> IN PROGRESS -> RESOLVED
const WORKFLOW_ORDER = [
  'Reported',
  'Verified',
  'Assigned',
  'Rescue Dispatched',
  'In Progress',
  'Resolved',
];

const LEGACY_STATUS_MAP = {
  unassigned: 'Reported',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
};

export function AppProvider({ children }) {
  // Authentication State — hydrated from stored session token
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(authService.getToken()));

  // User Profile — hydrated from stored session user or default initial user
  const [user, setUser] = useState(() => authService.getUser() || INITIAL_USER);

  // Appearance & Theme State ('system' | 'light' | 'dark')
  const [theme, setTheme] = useState('system');

  // Notifications setting ('Enabled' | 'Disabled')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Hydrate & refresh session with backend on load
  useEffect(() => {
    async function verifySession() {
      const token = authService.getToken();
      if (token) {
        try {
          const freshUser = await authService.getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
            setIsAuthenticated(true);
          }
        } catch {
          // Keep current stored user if network is unavailable
        }
      }
    }
    verifySession();
  }, []);

  // Data Collections
  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [zones, setZones] = useState([]);
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [hospitals] = useState(INITIAL_HOSPITALS);
  const [transferRequests, setTransferRequests] = useState({});

  // User GPS Location (Section D & Z: strictly null until user clicks Locate Me)
  const [userLocation, setUserLocation] = useState(null);

  // Real-Time Polling & Telemetry State (Section W)
  const [lastUpdated, setLastUpdated] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  // Drawer & Modal State
  const [drawer, setDrawer] = useState({ isOpen: false, type: null, id: null });
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedMapPoint, setSelectedMapPoint] = useState(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '' });

  // Map Filter & Layer State (Section S)
  const [mapLayers, setMapLayers] = useState({
    incidents: true,
    hospitals: true,
    teams: true,
    zones: true,
    density: false,
    shelters: false,
    resources: false,
  });
  const [mapZoom, setMapZoom] = useState(1);
  const [mapSearch, setMapSearch] = useState('');

  // Toast Helper
  const showToast = useCallback((message) => {
    setToast({ show: true, message });
  }, []);

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial load of incidents, teams, and zones via service layer
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [loadedIncidents, loadedTeams, loadedZones] = await Promise.all([
          incidentService.getIncidents(),
          teamService.getTeams(),
          zoneService.getZones(),
        ]);
        setIncidents(loadedIncidents);
        setTeams(loadedTeams);
        setZones(loadedZones);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Error initializing services:', err);
      }
    }
    loadInitialData();
  }, []);

  // Live updates / controlled polling (Section W: refresh every 25 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsPolling(true);
        const freshIncidents = await incidentService.getIncidents();
        setIncidents(freshIncidents);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Polling check encountered error:', err.message);
      } finally {
        setTimeout(() => setIsPolling(false), 600);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Derived user avatar initials
  const avatarInitials = useMemo(() => {
    if (!user.name) return 'AD';
    return user.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user.name]);

  // Compute non-resolved critical incidents count
  const criticalCount = useMemo(() => {
    return incidents.filter((i) => {
      const isCritical = String(i.severity).toLowerCase() === 'critical';
      const isResolved = String(i.status).toLowerCase() === 'resolved';
      return isCritical && !isResolved;
    }).length;
  }, [incidents]);

  // Drawer handlers
  const openDrawer = useCallback((type, id) => {
    setDrawer({ isOpen: true, type, id });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ isOpen: false, type: null, id: null });
  }, []);

  // Modal handlers
  const openReportModal = useCallback((coords = null) => {
    if (coords) setSelectedMapPoint(coords);
    setIsReportModalOpen(true);
  }, []);

  const closeReportModal = useCallback(() => {
    setIsReportModalOpen(false);
    setSelectedMapPoint(null);
  }, []);

  // Authentication actions
  const login = useCallback((authData) => {
    setIsAuthenticated(true);
    if (authData?.user) {
      setUser(authData.user);
      if (authData.token) {
        authService.saveSession(authData.token, authData.user);
      }
    } else if (authData?.role || authData?.email) {
      setUser((prev) => {
        const updated = {
          ...prev,
          role: authData.role || prev.role,
          email: authData.email || prev.email,
        };
        authService.saveUser(updated);
        return updated;
      });
    }
  }, []);

  const logout = useCallback(() => {
    closeDrawer();
    closeReportModal();
    authService.clearSession();
    setIsAuthenticated(false);
    showToast('Signed out of console.');
  }, [closeDrawer, closeReportModal, showToast]);

  // Profile update
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  }, []);

  // Incident actions - Assign team to incident (Section N, O)
  const assignTeam = useCallback((incidentId, teamName = 'Rescue Team Alpha', teamId = null) => {
    // Determine assigned team
    const assignedName = teamName;
    const assignedId = teamId || 'TEAM-01';

    // Update in-memory state
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            team: assignedName,
            assignedTeamId: assignedId,
            status: inc.status === 'Reported' || inc.status === 'Verified' ? 'Assigned' : inc.status,
          };
        }
        return inc;
      })
    );

    // Update team status
    setTeams((prev) =>
      prev.map((t) => {
        if (t.teamId === assignedId || t.name === assignedName) {
          return {
            ...t,
            status: 'Assigned',
            currentIncidentId: incidentId,
          };
        }
        return t;
      })
    );

    // Persist via services
    incidentService.updateIncident(incidentId, {
      team: assignedName,
      assignedTeamId: assignedId,
      status: 'Assigned',
    });
    teamService.updateTeamStatus(assignedId, 'Assigned', incidentId);

    showToast(`${assignedName} dispatched to ${incidentId}.`);
  }, [showToast]);

  // Incident actions - Advance status workflow (Section O)
  // REPORT -> VERIFY -> ASSIGN RESPONSE TEAM -> RESCUE DISPATCHED -> IN PROGRESS -> RESOLVED
  const updateIncidentStatus = useCallback((incidentId, forcedStatus = null) => {
    let nextStatus = null;

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          if (forcedStatus) {
            nextStatus = forcedStatus;
          } else {
            // Find current status index in workflow
            const currentNorm = LEGACY_STATUS_MAP[inc.status] || inc.status;
            const currentIdx = WORKFLOW_ORDER.indexOf(currentNorm);
            if (currentIdx >= 0 && currentIdx < WORKFLOW_ORDER.length - 1) {
              nextStatus = WORKFLOW_ORDER[currentIdx + 1];
            } else if (currentNorm === 'Resolved') {
              nextStatus = 'Resolved';
            } else {
              nextStatus = 'In Progress';
            }
          }

          const updated = {
            ...inc,
            status: nextStatus,
            severity: nextStatus === 'Resolved' ? 'Resolved' : inc.severity,
          };

          incidentService.updateIncident(incidentId, {
            status: nextStatus,
            severity: updated.severity,
          });

          return updated;
        }
        return inc;
      })
    );

    if (nextStatus === 'Resolved') {
      showToast('Incident marked Resolved.');
    } else if (nextStatus) {
      showToast(`Status updated to ${nextStatus}.`);
    }
  }, [showToast]);

  // Report new incident (Section L: immediate marker, no page reload)
  const reportIncident = useCallback(async (incidentData) => {
    try {
      const created = await incidentService.createIncident(incidentData);
      setIncidents((prev) => [created, ...prev]);
      closeReportModal();
      showToast(`Incident ${created.id} reported successfully.`);
      return created;
    } catch (err) {
      showToast(`Error saving incident: ${err.message}`);
    }
  }, [closeReportModal, showToast]);

  // Reset to initial demo dataset (Section X)
  const resetDemoData = useCallback(() => {
    const demo = incidentService.resetDemoData();
    setIncidents(demo);
    showToast('Reset to initial demo scenario.');
  }, [showToast]);

  // Resource actions
  const allocateResource = useCallback((resourceId, quantity, destination, priority) => {
    let success = false;
    let resourceInfo = null;

    setResources((prev) =>
      prev.map((res) => {
        if (res.id === resourceId) {
          const newAmount = res.amount - quantity;
          const newStatus = newAmount < 1000 ? 'low' : 'available';
          resourceInfo = { ...res, newAmount, newStatus, quantity, destination, priority };
          success = true;
          return {
            ...res,
            amount: newAmount,
            status: newStatus,
          };
        }
        return res;
      })
    );

    if (success && resourceInfo) {
      closeDrawer();
      showToast(`${quantity.toLocaleString()} ${resourceInfo.unit} allocated to ${destination}.`);
    }
    return success;
  }, [closeDrawer, showToast]);

  // Hospital actions
  const requestHospitalTransfer = useCallback((hospitalId) => {
    setTransferRequests((prev) => ({
      ...prev,
      [hospitalId]: true,
    }));
    showToast('Transfer request sent.');
  }, [showToast]);

  // Hospital capacity aggregations
  const hospitalStats = useMemo(() => {
    return {
      availableBeds: hospitals.reduce((sum, h) => sum + h.bedsAvail, 0),
      icuBeds: hospitals.reduce((sum, h) => sum + h.icuAvail, 0),
      ambulances: hospitals.reduce((sum, h) => sum + h.ambulances, 0),
    };
  }, [hospitals]);

  // Map controls
  const toggleMapLayer = useCallback((layerName) => {
    setMapLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setMapZoom((prev) => Math.min(1.6, Math.round((prev + 0.1) * 10) / 10));
  }, []);

  const zoomOut = useCallback(() => {
    setMapZoom((prev) => Math.max(0.7, Math.round((prev - 0.1) * 10) / 10));
  }, []);

  const value = {
    // Auth & User
    isAuthenticated,
    login,
    logout,
    user,
    updateUser,
    avatarInitials,

    // Theme & Settings
    theme,
    setTheme,
    toggleAppearance: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    notificationsEnabled,
    toggleNotifications: () => setNotificationsEnabled((n) => !n),

    // Data Collections
    incidents,
    criticalCount,
    teams,
    zones,
    resources,
    hospitals,
    hospitalStats,
    transferRequests,

    // Real-Time & Demo
    userLocation,
    setUserLocation,
    lastUpdated,
    isPolling,
    demoMode,
    setDemoMode,
    resetDemoData,

    // Actions
    assignTeam,
    updateIncidentStatus,
    reportIncident,
    allocateResource,
    requestHospitalTransfer,

    // Drawer & Modal
    drawer,
    openDrawer,
    closeDrawer,
    isReportModalOpen,
    openReportModal,
    closeReportModal,
    selectedMapPoint,
    setSelectedMapPoint,
    isPickingLocation,
    setIsPickingLocation,

    // Toast
    toast,
    showToast,

    // Map
    mapLayers,
    toggleMapLayer,
    mapZoom,
    zoomIn,
    zoomOut,
    mapSearch,
    setMapSearch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
