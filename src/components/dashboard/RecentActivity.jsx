import React from 'react';

export default function RecentActivity({ incidents = [] }) {
  const activities = [...incidents]
    .filter((incident) => incident.reportedAt || incident.updatedAt)
    .sort((a, b) => new Date(b.updatedAt || b.reportedAt) - new Date(a.updatedAt || a.reportedAt))
    .slice(0, 4);
  return (
    <div className="quiet-card">
      <h4>Recent incident updates</h4>
      {activities.length ? activities.map((incident) => (
        <div key={incident.id} className="activity-row">
          <time dateTime={incident.updatedAt || incident.reportedAt}>{new Date(incident.updatedAt || incident.reportedAt).toLocaleString()}</time>
          <span>{incident.title || incident.type} · {incident.status || 'Status not reported'}</span>
        </div>
      )) : <p className="muted-copy">No timestamped incident updates available.</p>}
    </div>
  );
}
