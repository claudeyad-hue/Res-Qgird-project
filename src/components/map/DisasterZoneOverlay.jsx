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
        <div className="popup-item">
          <span className="popup-label">Geographic location</span>
          <span className="popup-val">
            {zone.center
              ? `${zone.center[0].toFixed(5)}, ${zone.center[1].toFixed(5)}`
              : Array.isArray(zone.coordinates) && zone.coordinates.length
              ? `${(zone.coordinates.reduce((sum, point) => sum + point[0], 0) / zone.coordinates.length).toFixed(5)}, ${(zone.coordinates.reduce((sum, point) => sum + point[1], 0) / zone.coordinates.length).toFixed(5)}`
              : 'Not reported'}
          </span>
        </div>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--ink-muted)', lineHeight: '1.45' }}>
        {zone.description}
      </p>
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#D35400', fontWeight: 700 }}>
        DEMONSTRATION ZONE · Last updated: {zone.updatedAt || 'Not reported'}
      </div>
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
