import React from 'react';
import Badge from '../common/Badge';
import RiskDot from '../common/RiskDot';

function formatStatus(status) {
  if (!status) return 'Reported';
  if (status === 'in-progress') return 'In Progress';
  if (status === 'unassigned') return 'Reported';
  return status;
}

export default function IncidentTable({ incidents, onSelectIncident }) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="table-responsive">
      <table className="incident-table">
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Incident</th>
            <th>Location</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Team</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="8">
              <div className="empty-state">
                <div className="glyph">◌</div>
                No incidents match this filter.
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="incident-table">
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Incident</th>
            <th>Location</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Team</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              onClick={() => onSelectIncident(incident.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectIncident(incident.id);
                }
              }}
            >
              <td aria-hidden="true"><RiskDot severity={incident.severity} /></td>
              <td className="id-cell" data-label="ID">{incident.id}</td>
              <td data-label="Incident">{incident.title || incident.type}</td>
              <td data-label="Location">{incident.address || incident.location}</td>
              <td data-label="Severity"><Badge severity={incident.severity} /></td>
              <td data-label="Status">{formatStatus(incident.status)}</td>
              <td data-label="Team">{incident.team || incident.assignedTeamId || '—'}</td>
              <td data-label="Time">{incident.time || (incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString() : '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
