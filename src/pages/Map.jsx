import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';
import DisasterMap from '../components/map/DisasterMap';
import IncidentMapFilters from '../components/map/IncidentMapFilters';
import MapLegend from '../components/map/MapLegend';
import Drawer from '../components/common/Drawer';
import IncidentDrawerContent, { IncidentDrawerActions } from '../components/incidents/IncidentDrawerContent';
import HospitalDrawer from '../components/hospitals/HospitalDrawer';
import ReportIncidentMapModal from '../components/map/ReportIncidentMapModal';

export default function MapPage() {
  const {
    incidents,
    hospitals,
    drawer,
    closeDrawer,
    assignTeam,
    updateIncidentStatus,
    requestHospitalTransfer,
    transferRequests,
    reportIncident,
    isReportModalOpen,
    openReportModal,
    closeReportModal,
    selectedMapPoint,
    setSelectedMapPoint,
    isPickingLocation,
    setIsPickingLocation,
    userLocation,
    demoMode,
    resetDemoData,
  } = useApp();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState('all');

  const selectedIncident = drawer.type === 'incident' ? incidents.find((i) => i.id === drawer.id) : null;
  const selectedHospital = drawer.type === 'hospital' ? hospitals.find((h) => h.id === drawer.id) : null;

  const handleResetFilters = () => {
    setSearch('');
    setActiveFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
    setTimeRangeFilter('all');
  };

  const handlePickOnMap = (coords) => {
    setIsPickingLocation(false);
    if (coords) {
      setSelectedMapPoint(coords);
      openReportModal(coords);
    }
  };

  return (
    <>
      <Header
        title="Live Disaster Response Map"
        subtitle="Real-time incident tracking, rescue team telemetry, and hazard boundary zones."
      />

      {/* Demo Mode Notice Banner (Section X) */}
      {demoMode && (
        <div className="demo-banner">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="demo-badge">DEMO DATA</span>
            <span>Simulated emergency scenario for demonstration. Never use for actual life-threatening events.</span>
          </div>
          <button
            type="button"
            className="link-btn"
            style={{ color: '#F39C12', fontSize: '12px', fontWeight: 600 }}
            onClick={resetDemoData}
            title="Reset incident list to initial demo state"
          >
            Reset Demo Scenario ↺
          </button>
        </div>
      )}

      {/* Interactive Search & Filter Controls (Section J) */}
      <IncidentMapFilters
        searchQuery={search}
        onSearchChange={setSearch}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        timeRangeFilter={timeRangeFilter}
        onTimeRangeFilterChange={setTimeRangeFilter}
        onReportClick={() => openReportModal()}
        onResetFilters={handleResetFilters}
      />

      {/* Legend Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px var(--space-page)',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--line)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <MapLegend />
        <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
          Tip: Click on any marker or hazard zone for telemetry and dispatch options.
        </span>
      </div>

      {/* Real Interactive Leaflet Disaster Map (Section C, K, S, T) */}
      <DisasterMap
        variant="full"
        searchQuery={search}
        activeFilter={activeFilter}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        timeRangeFilter={timeRangeFilter}
        onPickLocation={handlePickOnMap}
        isPickingLocation={isPickingLocation}
      />

      {/* Incident Detail Drawer (Section I, O, P) */}
      <Drawer
        isOpen={drawer.isOpen && drawer.type === 'incident'}
        onClose={closeDrawer}
        scrim="mobile-only"
        title={selectedIncident ? `${selectedIncident.type} — ${selectedIncident.id}` : 'Incident'}
        actions={
          <IncidentDrawerActions
            incident={selectedIncident}
            onAssignTeam={assignTeam}
            onUpdateStatus={updateIncidentStatus}
            userLocation={userLocation}
          />
        }
      >
        <IncidentDrawerContent incident={selectedIncident} userLocation={userLocation} />
      </Drawer>

      {/* Hospital Drawer */}
      <HospitalDrawer
        hospital={selectedHospital}
        isOpen={drawer.isOpen && drawer.type === 'hospital'}
        onClose={closeDrawer}
        scrim="mobile-only"
        onTransfer={requestHospitalTransfer}
        alreadyRequested={selectedHospital ? Boolean(transferRequests[selectedHospital.id]) : false}
      />

      {/* Report Incident Modal (Section L) */}
      <ReportIncidentMapModal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        onSubmit={reportIncident}
        initialCoords={selectedMapPoint}
        userLocation={userLocation}
        onPickOnMap={() => setIsPickingLocation(true)}
      />
    </>
  );
}
