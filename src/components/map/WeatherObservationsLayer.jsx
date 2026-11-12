import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GHAZIABAD_CONFIG } from '../../utils/geoUtils';
import { weatherService } from '../../services/weatherService';

export default function WeatherObservationsLayer({ visible, weather }) {
  if (!visible || !weather || weather.isFallback) return null;

  const [latitude, longitude] = GHAZIABAD_CONFIG.center;
  const advisory = weatherService.getWeatherAdvisory(weather);
  const icon = L.divIcon({
    className: 'weather-observation-marker',
    html: `<span>${weather.icon}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker position={[latitude, longitude]} icon={icon} zIndexOffset={1200}>
      <Popup>
        <div className="popup-container">
          <div className="popup-header">
            <div><span className="popup-id">OPEN-METEO</span><h4 className="popup-title">Current Weather Observation</h4></div>
          </div>
          <div className="popup-grid">
            <div className="popup-item"><span className="popup-label">Conditions</span><span className="popup-val">{weather.label}</span></div>
            <div className="popup-item"><span className="popup-label">Temperature</span><span className="popup-val">{weather.temperature}°C</span></div>
            <div className="popup-item"><span className="popup-label">Wind</span><span className="popup-val">{weather.windspeed} km/h</span></div>
            {advisory && <div className="popup-item"><span className="popup-label">Weather advisory</span><span className="popup-val">{advisory.message}</span></div>}
            <div className="popup-item"><span className="popup-label">Coordinates</span><span className="popup-val">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span></div>
            <div className="popup-item"><span className="popup-label">Observation time</span><span className="popup-val">{weather.time || 'Not reported'}</span></div>
          </div>
          <div className="popup-desc">Point observation for Ghaziabad; this is not a spatial rainfall layer or an official weather alert feed.</div>
          <small>Source: {weather.source}</small>
        </div>
      </Popup>
    </Marker>
  );
}
