import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import { createUserGpsIcon } from './mapIcons';

export default function UserLocationMarker({ location }) {
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return null;
  }

  const { latitude, longitude, accuracy } = location;
  const icon = createUserGpsIcon();

  return (
    <>
      <Marker position={[latitude, longitude]} icon={icon}>
        <Popup>
          <div className="popup-container" style={{ minWidth: '220px' }}>
            <div className="popup-header">
              <h4 className="popup-title" style={{ color: '#2F6FE0' }}>📍 Your Location</h4>
            </div>
            <div style={{ fontSize: '12.5px', lineHeight: '1.6', fontFamily: 'monospace' }}>
              <div><strong>Latitude:</strong> {latitude.toFixed(6)}</div>
              <div><strong>Longitude:</strong> {longitude.toFixed(6)}</div>
              {typeof accuracy === 'number' && (
                <div><strong>Accuracy:</strong> ±{Math.round(accuracy)} m</div>
              )}
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--ink-muted)' }}>
              GPS fix active via Browser Geolocation API
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Accuracy circle if accuracy is reasonable (up to 5000m) */}
      {typeof accuracy === 'number' && accuracy > 0 && accuracy <= 5000 && (
        <Circle
          center={[latitude, longitude]}
          radius={accuracy}
          pathOptions={{
            color: '#2F6FE0',
            fillColor: '#2F6FE0',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        />
      )}
    </>
  );
}
