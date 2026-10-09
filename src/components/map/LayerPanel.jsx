import React from 'react';

export default function LayerPanel({ layers, onToggleLayer }) {
  if (!layers || !onToggleLayer) return null;

  return (
    <div className="layer-panel" aria-label="Map Layer Toggles">
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
  );
}
