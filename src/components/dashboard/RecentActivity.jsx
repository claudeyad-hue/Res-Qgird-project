import React from 'react';
import { RECENT_ACTIVITY } from '../../data/initialData';

export default function RecentActivity({ activities = RECENT_ACTIVITY }) {
  return (
    <div className="quiet-card">
      <h4>Recent activity</h4>
      {activities.map((act, index) => (
        <div key={index} className="bar-row">
          <span>{act.time}</span>
          <span>{act.text}</span>
        </div>
      ))}
    </div>
  );
}
