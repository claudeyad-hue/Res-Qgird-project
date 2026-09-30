import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';
import IncidentFilters from '../components/incidents/IncidentFilters';
import IncidentTable from '../components/incidents/IncidentTable';
import ReportIncidentModal from '../components/incidents/ReportIncidentModal';
import Drawer from '../components/common/Drawer';
import IncidentDrawerContent, { IncidentDrawerActions } from '../components/incidents/IncidentDrawerContent';

export default function Incidents() {
  const {
    incidents,
    drawer, openDrawer, closeDrawer,
    assignTeam, updateIncidentStatus,
    isReportModalOpen, openReportModal, closeReportModal,
    reportIncident,
    userLocation,
  } = useApp();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const s = String(inc.severity || '').toLowerCase();
      const st = String(inc.status || '').toLowerCase();
      const matchesSev =
        filter === 'all' ||
        s === filter.toLowerCase() ||
        (filter === 'resolved' && st === 'resolved');

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (inc.type && inc.type.toLowerCase().includes(q)) ||
        (inc.title && inc.title.toLowerCase().includes(q)) ||
        (inc.address && inc.address.toLowerCase().includes(q)) ||
        (inc.location && inc.location.toLowerCase().includes(q)) ||
        (inc.id && inc.id.toLowerCase().includes(q));

      return matchesSev && matchesSearch;
    });
  }, [incidents, filter, search]);

  const selectedIncident = drawer.type === 'incident'
    ? incidents.find(i => i.id === drawer.id)
    : null;

  return (
    <>
      <Header
        title="Incidents"
        subtitle="Track and coordinate active emergencies."
      />
      <div className="screen-body">
        <IncidentFilters
          activeFilter={filter}
          onFilterChange={setFilter}
          searchQuery={search}
          onSearchChange={setSearch}
          onReportClick={openReportModal}
        />
        <IncidentTable
          incidents={filtered}
          onSelectIncident={id => openDrawer('incident', id)}
        />
      </div>

      {/* Incident Detail Drawer */}
      <Drawer
        isOpen={drawer.isOpen && drawer.type === 'incident'}
        onClose={closeDrawer}
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

      {/* Report Incident Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        onSubmit={reportIncident}
      />
    </>
  );
}
