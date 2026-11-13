import React from 'react';

export default function ResourceUtilization({ resources = [] }) {
  const statuses = ['available', 'low', 'deployed', 'depleted'];
  return (
    <div className="quiet-card">
      <h4>Resource status</h4>
      {resources.length ? <div className="resource-status-summary">
        {statuses.map((status) => <div className="resource-status-row" key={status}><span>{status}</span><strong>{resources.filter((item) => String(item.status || '').toLowerCase() === status).length}</strong></div>)}
      </div> : <p className="muted-copy">No resource inventory records are connected.</p>}
      {resources.length > 0 && <p className="muted-copy">Counts reflect listed records; quantities are shown only where provided by the connected source.</p>}
    </div>
  );
}
