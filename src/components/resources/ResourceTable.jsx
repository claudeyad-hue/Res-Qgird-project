import React from 'react';
import Badge from '../common/Badge';

export default function ResourceTable({ resources = [], onSelectResource, canAllocate = false }) {
  if (!resources.length) return <div className="empty-state" role="status">No resource records match this view.</div>;
  return (
    <div className="table-responsive">
      <table className="resource-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Available</th>
            <th>Location</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {resources.map(res => (
            <tr key={res.id} onClick={() => onSelectResource(res.id)}>
              <td className="id-cell" data-label="ID">{res.id}</td>
              <td data-label="Type">{res.type}</td>
              <td data-label="Available">{res.amount == null ? 'Not reported' : `${res.amount.toLocaleString()} ${res.unit || ''}`}</td>
              <td data-label="Location">{res.location || 'Not reported'}</td>
              <td data-label="Status">{res.status ? <Badge type="resource" status={res.status} /> : 'Not reported'}</td>
              <td data-label="Action">
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ height: '34px', padding: '0 12px', fontSize: '13px' }}
                  disabled={!canAllocate || res.amount == null}
                  onClick={e => { e.stopPropagation(); onSelectResource(res.id); }}
                >
                  Allocate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
