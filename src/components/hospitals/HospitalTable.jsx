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
    <table>
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
        {hospitals.map(h => (
          <tr key={h.id} onClick={() => onSelectHospital(h.id)}>
            <td style={{ fontWeight: 500 }}>{h.name}</td>
            <td>{h.distance}</td>
            <td>{h.bedsAvail} / {h.bedsTotal}</td>
            <td>{h.icuAvail} / {h.icuTotal}</td>
            <td>{h.ambulances}</td>
            <td><HospitalStatusBadge status={h.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
