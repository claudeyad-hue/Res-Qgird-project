import React from 'react';

export default function SituationBar({
  situation = '3 active emergency zones require attention.',
  updated = 'Last updated: 2 minutes ago',
}) {
  return (
    <div className="situation-bar">
      <div>
        <div className="label">CURRENT SITUATION</div>
        <p>{situation}</p>
      </div>
      <div className="updated">{updated}</div>
    </div>
  );
}
