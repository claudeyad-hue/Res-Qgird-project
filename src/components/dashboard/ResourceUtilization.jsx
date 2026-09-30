import React from 'react';
import { RESOURCE_UTILIZATION } from '../../data/initialData';

export default function ResourceUtilization({ items = RESOURCE_UTILIZATION }) {
  return (
    <div className="quiet-card">
      <h4>Resource utilization</h4>
      {items.map((item, index) => (
        <div key={index} className="bar-row">
          <span>{item.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${item.percent}%` }}></div>
          </div>
          <span>{item.percent}%</span>
        </div>
      ))}
    </div>
  );
}
