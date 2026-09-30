import React from 'react';
import { SEV_LABEL } from '../../data/initialData';

export default function Badge({ severity = 'medium', type = 'severity', status }) {
  if (type === 'resource') {
    const isLow = status === 'low';
    return (
      <span className={`badge ${isLow ? 'b-high' : 'b-resolved'}`}>
        <span className="d"></span>
        {isLow ? 'Low' : 'Available'}
      </span>
    );
  }

  const s = String(severity || 'medium').toLowerCase();
  const label = SEV_LABEL[s] || severity;

  return (
    <span className={`badge b-${s}`}>
      <span className="d"></span>
      {label}
    </span>
  );
}
