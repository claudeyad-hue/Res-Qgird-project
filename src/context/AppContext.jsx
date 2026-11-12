import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  INITIAL_RESOURCES,
  INITIAL_HOSPITALS,
  INITIAL_USER,
} from '../data/initialData';
import incidentService from '../services/incidentService';
import teamService from '../services/teamService';
import zoneService from '../services/zoneService';
import hospitalApiService from '../services/hospitalApiService';
import resourceApiService from '../services/resourceApiService';
import { API_BASE } from '../services/apiConfig.js';

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

function readPreference(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  // Demo profile — preserve local profile edits without requiring an account.
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('resquard_auth_user');
      return storedUser ? { ...INITIAL_USER, ...JSON.parse(storedUser) } : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // Appearance & Theme State ('system' | 'light' | 'dark')
  const [theme, setTheme] = useState(() => {
    const saved = readPreference('resquard_theme', 'system');
    return ['system', 'light', 'dark'].includes(saved) ? saved : 'system';
  });

  // Notifications setting ('Enabled' | 'Disabled')
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => readPreference('resquard_notifications', 'false') === 'true');

  // Data Collections
  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [zones, setZones] = useState([]);
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [dataSources, setDataSources] = useState({
    incidents: 'demo/local', teams: 'demo/local', hospitals: 'official directory', resources: 'demo', zones: 'demo',
  });
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
  const knownIncidentIds = useRef(new Set());

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '' });

  // Map Filter & Layer State (Section S)
  const [mapLayers, setMapLayers] = useState({
    incidents: true,
    hospitals: true,
    hospitals_government: true,
    hospitals_private: true,
    hospitals_unclassified: true,
    hospital_emergency_listed: false,
    teams: true,
    zones: true,
    density: false,
    shelters: false,
    resources: false,
    ambulances: true,
    incident_fire: true,
    incident_flood: true,
    incident_earthquake: true,
    incident_landslide: true,
    incident_collapse: true,
    incident_road: true,
    incident_industrial: true,
    incident_chemical: true,
    incident_missing: true,
    incident_unverified: true,
    zones_flood: true,
    zones_evacuation: true,
    zones_hazard: true,
    weatherObservations: true,
  });
  const [mapZoom, setMapZoom] = useState(1);
  const [mapSearch, setMapSearch] = useState('');

  // Toast Helper
  const showToast = useCallback((message) => {
    setToast({ show: true, message });
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      let permission = Notification.permission;
      if (permission === 'default') permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Browser notifications were not enabled. Allow them in your browser to receive critical incident alerts.');
        return;
      }
    } else if (!notificationsEnabled) {
      showToast('This browser does not support notifications.');
      return;
    }
    setNotificationsEnabled((enabled) => !enabled);
  }, [notificationsEnabled, showToast]);

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
        const results = await Promise.allSettled([
          incidentService.getIncidents(),
          teamService.getTeams(),
          zoneService.getZones(),
          hospitalApiService.getHospitals(),
          resourceApiService.getResources(),
        ]);
        const [loadedIncidents, loadedTeams, loadedZones, loadedHospitals, loadedResources] = results;
        if (loadedIncidents.status === 'fulfilled') setIncidents(loadedIncidents.value);
        if (loadedIncidents.status === 'fulfilled') {
          knownIncidentIds.current = new Set(loadedIncidents.value.map((incident) => incident.id));
        }
        if (loadedTeams.status === 'fulfilled') setTeams(loadedTeams.value);
        if (loadedZones.status === 'fulfilled') setZones(loadedZones.value);
        if (loadedHospitals.status === 'fulfilled' && loadedHospitals.value) setHospitals(loadedHospitals.value);
        if (loadedResources.status === 'fulfilled' && loadedResources.value) setResources(loadedResources.value);
        setDataSources({
          incidents: loadedIncidents.status === 'fulfilled' && API_BASE ? 'API' : 'demo/local',
          teams: loadedTeams.status === 'fulfilled' && API_BASE ? 'API' : 'demo/local',
          hospitals: loadedHospitals.status === 'fulfilled' && loadedHospitals.value && API_BASE ? 'API' : 'official directory',
          resources: loadedResources.status === 'fulfilled' && loadedResources.value && API_BASE ? 'API' : 'demo',
          zones: 'demo',
        });
        for (const result of results) {
          if (result.status === 'rejected') console.warn('A data service could not be loaded:', result.reason?.message);
        }
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
        const newlyCritical = freshIncidents.filter((incident) => {
          const isNew = !knownIncidentIds.current.has(incident.id);
          knownIncidentIds.current.add(incident.id);
          return isNew && String(incident.severity).toLowerCase() === 'critical';
        });
        if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          for (const incident of newlyCritical) {
            new Notification('Critical incident reported', {
              body: `${incident.title || incident.type} — ${incident.address || incident.location || 'Location pending'}`,
            });
          }
        }
        setIncidents(freshIncidents);
        if (API_BASE) setDataSources((sources) => ({ ...sources, incidents: 'API' }));
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Polling check encountered error:', err.message);
      } finally {
        setTimeout(() => setIsPolling(false), 600);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('resquard_theme', theme); } catch { /* Ignore preference storage failures. */ }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('resquard_notifications', String(notificationsEnabled)); } catch { /* Ignore preference storage failures. */ }
  }, [notificationsEnabled]);

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

  // Profile update
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      try { localStorage.setItem('resquard_auth_user', JSON.stringify(updated)); } catch { /* Ignore storage failures. */ }
      return updated;
    });
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
      if (created?.id) knownIncidentIds.current.add(created.id);
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
  const allocateResource = useCallback(async (resourceId, quantity, destination, priority) => {
    const resource = resources.find((item) => item.id === resourceId);
    if (!resource || quantity <= 0 || quantity > resource.amount) return false;
    try {
      const saved = await resourceApiService.allocate(resource, quantity);
      const updated = saved || {
        ...resource,
        amount: resource.amount - quantity,
        status: resource.amount - quantity <= 0 ? 'depleted' : resource.amount - quantity < 1000 ? 'low' : 'available',
      };
      setResources((previous) => previous.map((item) => item.id === resourceId ? updated : item));
      closeDrawer();
      showToast(`${quantity.toLocaleString()} ${resource.unit} allocated to ${destination} (${priority} priority).`);
      return true;
    } catch (error) {
      showToast(`Resource allocation failed: ${error.message}`);
      return false;
    }
  }, [resources, closeDrawer, showToast]);

  // Hospital actions
  const requestHospitalTransfer = useCallback((hospitalId) => {
    setTransferRequests((prev) => ({
      ...prev,
      [hospitalId]: true,
    }));
    showToast('Transfer request sent.');
  }, [showToast]);

  const updateHospitalAvailability = useCallback(async (hospitalId, availability) => {
    const updated = await hospitalApiService.updateAvailability(hospitalId, availability);
    setHospitals((current) => current.map((hospital) => hospital.id === hospitalId ? {
      ...hospital,
      ...updated,
      liveAvailability: updated.liveAvailability,
      availabilityLabel: null,
    } : hospital));
    showToast('Hospital availability update recorded.');
    return updated;
  }, [showToast]);

  // Hospital capacity aggregations
  const hospitalStats = useMemo(() => {
    const availabilityUpdates = hospitals
      .map((hospital) => hospital.liveAvailability?.updatedAt)
      .filter(Boolean);
    return {
      total: hospitals.length,
      mapped: hospitals.filter((hospital) => Number.isFinite(hospital.latitude) && Number.isFinite(hospital.longitude)).length,
      availabilityUpdates: availabilityUpdates.length,
      liveAvailabilityConnected: availabilityUpdates.length > 0,
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
    // User profile
    user,
    updateUser,
    avatarInitials,

    // Theme & Settings
    theme,
    setTheme,
    toggleAppearance: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    notificationsEnabled,
    toggleNotifications,

    // Data Collections
    incidents,
    criticalCount,
    teams,
    zones,
    resources,
    hospitals,
    dataSources,
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
    updateHospitalAvailability,

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
    setMapLayers,
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
