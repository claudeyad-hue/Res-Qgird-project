import React from 'react';

function HospitalStatusBadge({ status }) {
  const map = {
    accepting: { cls: 'b-resolved', label: 'Accepting' },
    limited: { cls: 'b-high', label: 'Limited' },
    full: { cls: 'b-critical', label: 'Full' },
  };
  const { cls, label } = map[status] || { cls: 'b-medium', label: status };
  return (
    <span className={`badge ${cls}`}>
      <span className="d" />
      {label}
    </span>
  );
}

export default function HospitalTable({ hospitals, onSelectHospital }) {
  return (
    <div className="table-responsive">
      <table className="hospital-table">
        <thead>
          <tr>
            <th>Hospital</th>
            <th>Distance</th>
            <th>Beds available</th>
            <th>ICU available</th>
            <th>Ambulances</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {hospitals.map((h) => (
            <tr
              key={h.id}
              onClick={() => onSelectHospital?.(h.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectHospital?.(h.id);
                }
              }}
            >
              <td data-label="Hospital" style={{ fontWeight: 500 }}>{h.name}</td>
              <td data-label="Distance">{h.distance}</td>
              <td data-label="Beds available">{h.bedsAvail} / {h.bedsTotal}</td>
              <td data-label="ICU available">{h.icuAvail} / {h.icuTotal}</td>
              <td data-label="Ambulances">{h.ambulances}</td>
              <td data-label="Status"><HospitalStatusBadge status={h.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
