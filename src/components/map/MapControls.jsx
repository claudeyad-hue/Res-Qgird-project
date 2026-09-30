import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function MapControls({
  onLocateMe,
  isLocating,
  incidents = [],
  mapWrapperRef,
}) {
  const map = useMap();

  const handleResetView = () => {
    // Default view: Center on India with sensible zoom level (Section C)
    map.flyTo([20.5937, 78.9629], 5, { duration: 0.8 });
  };

  const handleFitIncidents = () => {
    const validPoints = incidents
      .filter((i) => typeof i.latitude === 'number' && typeof i.longitude === 'number')
      .map((i) => [i.latitude, i.longitude]);

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
    } else {
      handleResetView();
    }
  };

  const handleFullscreen = () => {
    if (!mapWrapperRef?.current) return;
    const elem = mapWrapperRef.current;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="map-floating-controls">
      {/* Locate Me button (Section D) */}
      <button
        type="button"
        className={`map-control-btn ${isLocating ? 'active' : ''}`}
        onClick={onLocateMe}
        title="Locate my position via GPS"
        aria-label="Locate Me"
      >
        <span style={{ fontSize: '14px' }}>🎯</span>
        <span>{isLocating ? 'Locating…' : 'Locate Me'}</span>
      </button>

      {/* Fit Incidents button */}
      <button
        type="button"
        className="map-control-btn"
        onClick={handleFitIncidents}
        title="Fit all incidents on screen"
        aria-label="Fit Incidents"
      >
        <span style={{ fontSize: '13px' }}>⛶</span>
        <span>Fit Incidents</span>
      </button>

      {/* Reset View button */}
      <button
        type="button"
        className="map-control-btn"
        onClick={handleResetView}
        title="Reset map view to India"
        aria-label="Reset View"
      >
        <span style={{ fontSize: '13px' }}>↺</span>
        <span>Reset View</span>
      </button>

      {/* Fullscreen button */}
      <button
        type="button"
        className="map-control-btn"
        onClick={handleFullscreen}
        title="Toggle Fullscreen"
        aria-label="Toggle Fullscreen"
      >
        <span style={{ fontSize: '13px' }}>🗖</span>
        <span>Fullscreen</span>
      </button>

      {/* Zoom in/out buttons */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
        <button
          type="button"
          className="map-control-btn"
          style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          onClick={handleZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="map-control-btn"
          style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          onClick={handleZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
}
