import React from 'react';
import Badge from '../common/Badge';

export default function ResourceTable({ resources, onSelectResource }) {
  return (
    <table>
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
            <td className="id-cell">{res.id}</td>
            <td>{res.type}</td>
            <td>{res.amount.toLocaleString()} {res.unit}</td>
            <td>{res.location}</td>
            <td><Badge type="resource" status={res.status} /></td>
            <td>
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
  );
}
