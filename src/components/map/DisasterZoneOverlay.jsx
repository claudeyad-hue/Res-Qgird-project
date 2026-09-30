import React from 'react';
import { Circle, Polygon, Popup } from 'react-leaflet';

export default function DisasterZoneOverlay({ zone }) {
  if (!zone) return null;

  const pathOptions = {
    color: zone.color || '#C0392B',
    fillColor: zone.fillColor || zone.color || '#C0392B',
    fillOpacity: zone.fillOpacity || 0.22,
    weight: 2,
    dashArray: zone.type === 'evacuation' ? '6, 6' : undefined,
  };

  const popupContent = (
    <div className="popup-container" style={{ minWidth: '220px' }}>
      <div className="popup-header">
        <div>
          <span className="popup-id">{zone.zoneId}</span>
          <h4 className="popup-title">{zone.name}</h4>
        </div>
      </div>
      <div className="popup-grid">
        <div className="popup-item">
          <span className="popup-label">Zone Type</span>
          <span className="popup-val" style={{ textTransform: 'capitalize' }}>{zone.type}</span>
        </div>
        <div className="popup-item">
          <span className="popup-label">Risk Level</span>
          <span
            className="popup-val"
            style={{
              color: zone.riskLevel === 'Critical' ? '#C0392B' : zone.riskLevel === 'High' ? '#D35400' : '#D4AC0D',
            }}
          >
            {zone.riskLevel}
          </span>
        </div>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--ink-muted)', lineHeight: '1.45' }}>
        {zone.description}
      </p>
    </div>
  );

  if (zone.shape === 'circle' && zone.center && typeof zone.radius === 'number') {
    return (
      <Circle center={zone.center} radius={zone.radius} pathOptions={pathOptions}>
        <Popup>{popupContent}</Popup>
      </Circle>
    );
  }

  if (zone.shape === 'polygon' && Array.isArray(zone.coordinates)) {
    return (
      <Polygon positions={zone.coordinates} pathOptions={pathOptions}>
        <Popup>{popupContent}</Popup>
      </Polygon>
    );
  }

  return null;
}
