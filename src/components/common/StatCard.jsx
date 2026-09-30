import React from 'react';

export default function StatCard({ value, label, prefix = null }) {
  return (
    <div className="stat-card">
      <div className="n">
        {prefix}
        {value}
      </div>
      <div className="l">{label}</div>
    </div>
  );
}
