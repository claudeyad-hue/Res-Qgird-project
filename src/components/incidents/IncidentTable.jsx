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
      <table>
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
    );
  }

  return (
    <table>
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
            <td>
              <RiskDot severity={incident.severity} />
            </td>
            <td className="id-cell">{incident.id}</td>
            <td>{incident.title || incident.type}</td>
            <td>{incident.address || incident.location}</td>
            <td>
              <Badge severity={incident.severity} />
            </td>
            <td>{formatStatus(incident.status)}</td>
            <td>{incident.team || incident.assignedTeamId || '—'}</td>
            <td>{incident.time || (incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString() : '—')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
