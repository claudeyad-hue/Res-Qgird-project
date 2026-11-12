import React from 'react';
import Badge from '../common/Badge';

export default function ResourceTable({ resources, onSelectResource }) {
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
              <td data-label="Available">{res.amount.toLocaleString()} {res.unit}</td>
              <td data-label="Location">{res.location}</td>
              <td data-label="Status"><Badge type="resource" status={res.status} /></td>
              <td data-label="Action">
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ height: '34px', padding: '0 12px', fontSize: '13px' }}
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
