import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';
import HospitalTable from '../components/hospitals/HospitalTable';
import HospitalDrawer from '../components/hospitals/HospitalDrawer';
import StatCard from '../components/common/StatCard';

export default function Hospitals() {
  const {
    hospitals, hospitalStats, user, updateHospitalAvailability,
    drawer, openDrawer, closeDrawer,
    requestHospitalTransfer, transferRequests,
  } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [ownership, setOwnership] = useState('all');
  const [emergency, setEmergency] = useState('all');

  const categories = useMemo(() => [...new Set(hospitals.map((hospital) => hospital.category).filter(Boolean))].sort(), [hospitals]);
  const filteredHospitals = useMemo(() => hospitals.filter((hospital) => {
    const q = search.trim().toLowerCase();
    const text = `${hospital.name || ''} ${hospital.address || ''} ${hospital.category || ''} ${hospital.contact || ''}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (category !== 'all' && hospital.category !== category) return false;
    if (ownership !== 'all' && hospital.ownership !== ownership) return false;
    if (emergency === 'listed' && hospital.emergencyServiceListed !== true) return false;
    if (emergency === 'not-listed' && hospital.emergencyServiceListed === true) return false;
    return true;
  }), [hospitals, search, category, ownership, emergency]);

  const selectedHospital = drawer.type === 'hospital'
    ? hospitals.find(h => h.id === drawer.id)
    : null;

  return (
    <>
      <Header
        title="Hospitals"
        subtitle="Officially listed Ghaziabad health facilities. Live availability is not connected."
      />
      <div className="screen-body">
        <div role="note" className="hospital-data-notice">
          Facility listings and phone numbers are attributed to official government sources. A listing does not confirm current operation. Beds, oxygen, ambulances and live emergency status are not available from a verified live feed.
        </div>
        <div className="stat-grid stat-grid-3" style={{ marginBottom: 'var(--space-section)' }}>
          <StatCard value={hospitalStats.total} label="Official source listings" />
          <StatCard value={hospitalStats.mapped} label="With source-published map coordinates" />
          <StatCard value="Not connected" label="Live availability feed" />
        </div>

        <div className="hospital-filters" aria-label="Hospital filters">
          <label>Search hospitals<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, address, category or phone" /></label>
          <label>Facility type<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All facility types</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Ownership<select value={ownership} onChange={(event) => setOwnership(event.target.value)}><option value="all">All classifications</option><option value="government">Government</option><option value="private">Private</option><option value="not-published">Not stated by source</option></select></label>
          <label>Emergency service listing<select value={emergency} onChange={(event) => setEmergency(event.target.value)}><option value="all">All</option><option value="listed">Listed in source</option><option value="not-listed">Not listed / unknown</option></select></label>
        </div>
        <HospitalTable
          hospitals={filteredHospitals}
          onSelectHospital={id => openDrawer('hospital', id)}
        />
      </div>

      {/* Hospital Detail Drawer */}
      <HospitalDrawer
        hospital={selectedHospital}
        isOpen={drawer.isOpen && drawer.type === 'hospital'}
        onClose={closeDrawer}
        onTransfer={requestHospitalTransfer}
        alreadyRequested={selectedHospital ? !!transferRequests[selectedHospital.id] : false}
        canUpdateAvailability={user?.role === 'hospital_admin' && user?.hospitalIds?.includes(selectedHospital?.id)}
        onUpdateAvailability={updateHospitalAvailability}
      />
    </>
  );
}
