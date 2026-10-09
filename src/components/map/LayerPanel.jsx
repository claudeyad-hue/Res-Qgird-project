import React, { useState } from 'react';

export default function LayerPanel({ layers, onToggleLayer }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!layers || !onToggleLayer) return null;

  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className={`layer-panel ${isOpen ? 'expanded' : 'collapsed'}`} aria-label="Map Layer Toggles">
      <button
        type="button"
        className="layer-panel-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Toggle map layers overlay"
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: '13px' }}>🥞</span>
        <span style={{ fontWeight: 600 }}>Layers ({activeCount})</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="layer-panel-body">
          <h5>ACTIVE LAYERS</h5>
          <label>
            <input
              type="checkbox"
              checked={Boolean(layers.incidents)}
              onChange={() => onToggleLayer('incidents')}
            />
            <span>Incidents</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={Boolean(layers.teams)}
              onChange={() => onToggleLayer('teams')}
            />
            <span>Rescue Teams</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={Boolean(layers.zones)}
              onChange={() => onToggleLayer('zones')}
            />
            <span>Disaster Zones</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={Boolean(layers.density)}
              onChange={() => onToggleLayer('density')}
            />
            <span>Incident Density</span>
          </label>
          {layers.hospitals !== undefined && (
            <label>
              <input
                type="checkbox"
                checked={Boolean(layers.hospitals)}
                onChange={() => onToggleLayer('hospitals')}
              />
              <span>Hospitals</span>
            </label>
          )}
          {layers.resources !== undefined && (
            <label>
              <input
                type="checkbox"
                checked={Boolean(layers.resources)}
                onChange={() => onToggleLayer('resources')}
              />
              <span>Resources & Ambulances</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
