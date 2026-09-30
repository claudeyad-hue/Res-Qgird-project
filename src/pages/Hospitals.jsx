import React from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';
import HospitalTable from '../components/hospitals/HospitalTable';
import HospitalDrawer from '../components/hospitals/HospitalDrawer';
import StatCard from '../components/common/StatCard';

export default function Hospitals() {
  const {
    hospitals, hospitalStats,
    drawer, openDrawer, closeDrawer,
    requestHospitalTransfer, transferRequests,
  } = useApp();

  const selectedHospital = drawer.type === 'hospital'
    ? hospitals.find(h => h.id === drawer.id)
    : null;

  return (
    <>
      <Header
        title="Hospitals"
        subtitle="Monitor emergency healthcare capacity."
      />
      <div className="screen-body">
        {/* Stats */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 'var(--space-section)' }}>
          <StatCard value={hospitalStats.availableBeds} label="Beds available" />
          <StatCard value={hospitalStats.icuBeds} label="ICU beds available" />
          <StatCard value={hospitalStats.ambulances} label="Ambulances ready" />
        </div>

        {/* Table */}
        <HospitalTable
          hospitals={hospitals}
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
      />
    </>
  );
}
