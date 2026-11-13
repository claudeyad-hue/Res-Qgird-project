import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { INITIAL_HOSPITALS } from '../data/initialData';
import incidentService from '../services/incidentService';
import teamService from '../services/teamService';
import zoneService from '../services/zoneService';
import hospitalApiService from '../services/hospitalApiService';
import ambulanceApiService from '../services/ambulanceApiService';
import resourceApiService from '../services/resourceApiService';
import { API_BASE } from '../services/apiConfig.js';
import authApiService from '../services/authApiService.js';
import { readSessionToken } from '../services/apiClient.js';

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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(readSessionToken()));

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
  const [resources, setResources] = useState([]);
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [ambulances, setAmbulances] = useState([]);
  const [dataSources, setDataSources] = useState({
    incidents: 'not connected', teams: 'not connected', hospitals: 'official directory', ambulances: 'not connected', resources: 'not connected', zones: 'not connected',
  });
  const [transferRequests, setTransferRequests] = useState({});

  // User GPS Location (Section D & Z: strictly null until user clicks Locate Me)
  const [userLocation, setUserLocation] = useState(null);

  // Real-Time Polling & Telemetry State (Section W)
  const [lastUpdated, setLastUpdated] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

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

  const signIn = useCallback(async (email, password) => {
    const account = await authApiService.login(email, password);
    setUser(account);
    return account;
  }, []);

  const signOut = useCallback(() => {
    authApiService.clearSession();
    setUser(null);
    setIncidents([]);
    setTeams([]);
    setZones([]);
    setResources([]);
    setHospitals(INITIAL_HOSPITALS);
    setDataSources({ incidents: 'not connected', teams: 'not connected', hospitals: 'official directory', resources: 'not connected', zones: 'not connected' });
  }, []);

  useEffect(() => {
    if (!readSessionToken()) {
      setAuthLoading(false);
      return;
    }
    let cancelled = false;
    authApiService.getCurrentUser()
      .then((account) => { if (!cancelled) setUser(account); })
      .catch(() => { authApiService.clearSession(); if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setAuthLoading(false); });
    return () => { cancelled = true; };
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
    if ((!user && API_BASE) || authLoading) return undefined;
    setIsInitialLoading(true);
    let cancelled = false;
    async function loadInitialData() {
      try {
        const results = await Promise.allSettled([
          incidentService.getIncidents(),
          teamService.getTeams(),
          zoneService.getZones(),
          hospitalApiService.getHospitals(),
          ambulanceApiService.getAmbulances(),
          resourceApiService.getResources(),
        ]);
        const [loadedIncidents, loadedTeams, loadedZones, loadedHospitals, loadedAmbulances, loadedResources] = results;
        if (cancelled) return;
        if (loadedIncidents.status === 'fulfilled') setIncidents(loadedIncidents.value);
        if (loadedIncidents.status === 'fulfilled') {
          knownIncidentIds.current = new Set(loadedIncidents.value.map((incident) => incident.id));
        }
        if (loadedTeams.status === 'fulfilled') setTeams(loadedTeams.value);
        if (loadedZones.status === 'fulfilled') setZones(loadedZones.value);
        if (loadedHospitals.status === 'fulfilled' && loadedHospitals.value) setHospitals(loadedHospitals.value);
        if (loadedAmbulances.status === 'fulfilled' && loadedAmbulances.value) setAmbulances(loadedAmbulances.value);
        if (loadedResources.status === 'fulfilled' && loadedResources.value) setResources(loadedResources.value);
        setDataSources({
          incidents: loadedIncidents.status === 'fulfilled' ? (API_BASE ? 'API' : 'not connected') : 'unavailable',
          teams: loadedTeams.status === 'fulfilled' ? (API_BASE ? 'API' : 'not connected') : 'unavailable',
          hospitals: loadedHospitals.status === 'fulfilled' && loadedHospitals.value && API_BASE ? 'API' : 'official directory',
          ambulances: loadedAmbulances.status === 'fulfilled' && Array.isArray(loadedAmbulances.value) ? (API_BASE ? 'API' : 'not connected') : 'unavailable',
          resources: loadedResources.status === 'fulfilled' && Array.isArray(loadedResources.value) ? (API_BASE ? 'API' : 'not connected') : 'not connected',
          zones: 'not connected',
        });
        for (const result of results) {
          if (result.status === 'rejected') console.warn('A data service could not be loaded:', result.reason?.message);
        }
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Error initializing services:', err);
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    }
    loadInitialData();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Live updates / controlled polling (Section W: refresh every 25 seconds)
  useEffect(() => {
    if (!user || !API_BASE) return undefined;
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
  }, [notificationsEnabled, user]);

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
  const userName = user?.name;
  const avatarInitials = useMemo(() => {
    if (!userName) return 'U';
    return userName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [userName]);

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
    if (!API_BASE) {
      showToast('Incident reporting is unavailable until the backend is connected.');
      return;
    }
    if (coords) setSelectedMapPoint(coords);
    setIsReportModalOpen(true);
  }, [showToast]);

  const closeReportModal = useCallback(() => {
    setIsReportModalOpen(false);
    setSelectedMapPoint(null);
  }, []);

  // Profile update
  // Incident actions - Assign team to incident (Section N, O)
  const assignTeam = useCallback(async (incidentId, teamName = null, teamId = null) => {
    const assignedId = teamId || null;
    const assignedTeam = teams.find((team) => (assignedId && (team.teamId === assignedId || team.id === assignedId)) || (teamName && team.name === teamName));
    if (!incidents.some((incident) => incident.id === incidentId) || !assignedTeam) {
      showToast('Assignment failed: select an existing incident and response team.');
      return false;
    }
    try {
      await incidentService.updateIncident(incidentId, {
        team: assignedTeam.name,
        assignedTeamId: assignedId,
        status: 'Assigned',
      });
      await teamService.updateTeamStatus(assignedId, 'assigned', incidentId);
      setIncidents((previous) => previous.map((incident) => incident.id === incidentId
        ? { ...incident, team: assignedTeam.name, assignedTeamId: assignedId, status: 'Assigned' }
        : incident));
      setTeams((previous) => previous.map((team) => (team.teamId === assignedId || team.id === assignedId)
        ? { ...team, status: 'assigned', availability: 'assigned', currentIncidentId: incidentId }
        : team));
      showToast(`${assignedTeam.name} assigned to ${incidentId}.`);
      return true;
    } catch (error) {
      showToast(`Assignment failed: ${error.message}`);
      return false;
    }
  }, [teams, incidents, showToast]);

  // Incident actions - Advance status workflow (Section O)
  // REPORT -> VERIFY -> ASSIGN RESPONSE TEAM -> RESCUE DISPATCHED -> IN PROGRESS -> RESOLVED
  const updateIncidentStatus = useCallback(async (incidentId, forcedStatus = null) => {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return false;
    const currentNorm = LEGACY_STATUS_MAP[incident.status] || incident.status;
    const currentIdx = WORKFLOW_ORDER.indexOf(currentNorm);
    const nextStatus = forcedStatus || (currentIdx >= 0 && currentIdx < WORKFLOW_ORDER.length - 1 ? WORKFLOW_ORDER[currentIdx + 1] : currentNorm);
    try {
      await incidentService.updateIncident(incidentId, { status: nextStatus });
      setIncidents((previous) => previous.map((item) => item.id === incidentId ? { ...item, status: nextStatus } : item));
      showToast(nextStatus === 'Resolved' ? 'Incident marked resolved.' : `Status updated to ${nextStatus}.`);
      return true;
    } catch (error) {
      showToast(`Incident update failed: ${error.message}`);
      return false;
    }
  }, [incidents, showToast]);

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

  // Resource actions
  const allocateResource = useCallback(async (resourceId, quantity, destination, priority) => {
    const resource = resources.find((item) => item.id === resourceId);
    if (!resource || resource.amount == null || !Number.isFinite(Number(quantity)) || quantity <= 0 || quantity > resource.amount || !String(destination || '').trim()) return false;
    try {
      const saved = await resourceApiService.allocate(resource, quantity, destination, priority);
      const updated = saved || {
        ...resource,
        amount: resource.amount - quantity,
        status: resource.amount - quantity <= 0 ? 'depleted' : resource.amount - quantity < 1000 ? 'low' : 'available',
        allocations: [...(resource.allocations || []), { amount: Number(quantity), destination: String(destination).trim(), priority, allocatedAt: new Date().toISOString(), allocatedBy: user?.id }],
      };
      setResources((previous) => previous.map((item) => item.id === resourceId ? updated : item));
      closeDrawer();
      showToast(`${quantity.toLocaleString()} ${resource.unit || ''} allocated to ${destination} (${priority} priority).`.trim());
      return true;
    } catch (error) {
      showToast(`Resource allocation failed: ${error.message}`);
      return false;
    }
  }, [resources, user, closeDrawer, showToast]);

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
    avatarInitials,
    signIn,
    signOut,
    authLoading,
    authApiConfigured: authApiService.isConfigured,
    isInitialLoading,

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
    ambulances,
    dataSources,
    hospitalStats,
    transferRequests,

    // Real-Time
    userLocation,
    setUserLocation,
    lastUpdated,
    isPolling,

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
