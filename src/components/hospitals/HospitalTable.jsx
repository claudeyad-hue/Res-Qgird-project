import React from 'react';

const ownershipLabel = (ownership) => ({
  government: 'Government',
  private: 'Private',
  'not-published': 'Not stated by source',
}[ownership] || 'Not stated by source');

const verificationLabel = (status) => {
  if (status === 'district-directory-listed') return 'District directory';
  if (status === 'official-snapshot-needs-reverification') return 'Official snapshot · recheck needed';
  if (status === 'district-health-directory-needs-reverification') return 'District health directory · recheck needed';
  if (status === 'official-directory-needs-reverification') return 'Official directory · recheck needed';
  return 'Unverified';
};

export default function HospitalTable({ hospitals = [], onSelectHospital }) {
  if (!hospitals.length) return <div className="empty-state" role="status">No hospital records match these filters.</div>;
  return (
    <div className="table-responsive">
      <table className="hospital-table">
        <thead><tr>
          <th>Facility</th><th>Type</th><th>Classification</th><th>Address</th>
          <th>Contact</th><th>Live availability</th><th>Source status</th>
        </tr></thead>
        <tbody>{hospitals.map((hospital) => (
          <tr key={hospital.id} onClick={() => onSelectHospital?.(hospital.id)} role="button" tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectHospital?.(hospital.id); } }}>
            <td data-label="Facility" style={{ fontWeight: 600 }}>{hospital.name}</td>
            <td data-label="Type">{hospital.category || 'Not published'}</td>
            <td data-label="Classification"><span className={`hospital-classification ${hospital.ownership || 'not-published'}`}>{ownershipLabel(hospital.ownership)}</span></td>
            <td data-label="Address">{hospital.address || 'Address not published'}</td>
            <td data-label="Contact">{hospital.contact || 'Not published'}</td>
            <td data-label="Live availability">{hospital.liveAvailability?.updatedAt ? `Updated ${new Date(hospital.liveAvailability.updatedAt).toLocaleString()}` : 'Live availability not connected'}</td>
            <td data-label="Source status" title={`Source checked ${hospital.sourceCheckedAt ? new Date(hospital.sourceCheckedAt).toLocaleDateString() : 'date not recorded'}`}>
              {verificationLabel(hospital.verificationStatus)}<br />
              <small>{hospital.sourceCheckedAt ? `Source checked ${new Date(hospital.sourceCheckedAt).toLocaleDateString()}` : 'Check date unavailable'}</small>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
