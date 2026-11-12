import React, { useMemo, useState } from 'react';

const BASEMAPS = [
  { id: 'street', icon: '🗺️', label: 'Standard Street Map', source: 'OpenStreetMap' },
  { id: 'satellite', icon: '🛰️', label: 'Satellite Imagery', source: 'Esri World Imagery' },
  { id: 'satelliteLabels', icon: '🏷️', label: 'Satellite with Labels', source: 'Esri World Imagery + Reference' },
  { id: 'terrain', icon: '⛰️', label: 'Terrain / Elevation View', source: 'Esri World Topographic Map' },
  { id: 'dark', icon: '🌑', label: 'Dark Tactical Map', source: 'CARTO Dark Matter' },
];

const LAYER_CATEGORIES = [
  {
    id: 'services', icon: '🚑', label: 'Emergency Services', layers: [
      ['hospitals', '🏥', 'Hospitals'], ['medicalCentres', '⚕️', 'Emergency Medical Centres'],
      ['ambulances', '🚑', 'Ambulance Locations'], ['resources', '📦', 'Emergency Resources'], ['teams', '🛟', 'Rescue Teams'],
      ['police', '🚓', 'Police Stations'], ['fireStations', '🚒', 'Fire Stations'],
      ['responseCentres', '🏢', 'Disaster Response Centres'], ['shelters', '⛺', 'Emergency Shelters'],
      ['bloodBanks', '🩸', 'Blood Banks'], ['volunteers', '🙋', 'Volunteer Centres'],
    ],
  },
  {
    id: 'incidents', icon: '⚠️', label: 'Disaster Incidents', layers: [
      ['incidents', '⚠️', 'All Incidents'],
      ['incident_fire', '🔥', 'Fire Incidents'], ['incident_flood', '🌊', 'Flood Incidents'],
      ['incident_earthquake', '〰️', 'Earthquake Reports'], ['incident_landslide', '⛰️', 'Landslides'],
      ['incident_collapse', '🏚️', 'Building Collapse Reports'], ['incident_road', '🚧', 'Road Accidents'],
      ['incident_industrial', '🏭', 'Industrial Accidents'], ['incident_chemical', '☣️', 'Chemical Hazard Reports'],
      ['incident_missing', '🔎', 'Missing Person Reports'], ['zones_evacuation', '➡️', 'Evacuation Zones'],
      ['zones_affected', '🟥', 'Disaster-Affected Areas'], ['incident_unverified', '❔', 'Unverified Incident Reports'],
    ],
  },
  {
    id: 'infrastructure', icon: '🛣️', label: 'Infrastructure', layers: [
      ['roads_main', '🛣️', 'Main Roads'], ['roads_highways', '🛤️', 'Highways'],
      ['roads_local', '↔️', 'Local Roads'], ['roads_blocked', '⛔', 'Blocked Roads'],
      ['roads_closed', '🚫', 'Road Closures'], ['bridges', '🌉', 'Bridges'],
      ['railways', '🚆', 'Railway Lines'], ['airports', '✈️', 'Airports'],
      ['power', '⚡', 'Power Stations'], ['water', '💧', 'Water Supply Facilities'],
      ['communications', '📡', 'Communication Infrastructure'],
    ],
  },
  {
    id: 'environment', icon: '🌦️', label: 'Environmental Data', layers: [
      ['zones_flood', '🌊', 'Flood Risk Zones'], ['waterBodies', '💧', 'Water Bodies'],
      ['rivers', '〰️', 'Rivers'], ['lakes', '🏞️', 'Lakes'], ['terrain', '⛰️', 'Terrain Elevation'],
      ['slope', '📐', 'Slope & Landslide Risk'], ['rainfall', '🌧️', 'Rainfall Data'],
      ['weatherAlerts', '⛈️', 'Weather Alerts'], ['zones_flood', '🌊', 'Demonstration Flood Risk Zones'],
      ['weatherObservations', '🌡️', 'Current Weather Observations'],
      ['zones_hazard', '🟠', 'Demonstration Hazard Zones'],
    ],
  },
  {
    id: 'population', icon: '👥', label: 'Population & Risk', layers: [
      ['populationDensity', '👥', 'Population Density'], ['vulnerablePopulation', '🧑‍🦽', 'Vulnerable Population Areas'],
      ['historicalZones', '📚', 'Historical Disaster Zones'], ['density', '🔴', 'Incident Density'],
    ],
  },
];

const layerKeyForAvailability = {
  hospitals: 'hospitals', ambulances: 'ambulances', teams: 'teams', shelters: 'shelters',
  zones: 'zones_hazard', zones_hazard: 'zones_hazard', zones_flood: 'zones_flood', zones_evacuation: 'zones_evacuation',
  zones_affected: 'zones_affected', density: 'incidents',
};

export default function LayerPanel({
  layers, availableLayers = {}, onToggleLayer, basemap = 'street', onBasemapChange,
  onShowAll, onHideOverlays, onReset, dataUpdated, layerSources = {}, is3D = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ basemaps: true, incidents: true, services: true });
  const [showLegend, setShowLegend] = useState(false);
  const normalizedQuery = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => LAYER_CATEGORIES.map((category) => ({
    ...category,
    layers: category.layers.filter(([, , label]) => !normalizedQuery || label.toLowerCase().includes(normalizedQuery)),
  })).filter((category) => category.layers.length), [normalizedQuery]);

  const availableOverlayCount = Object.entries(availableLayers).filter(([, available]) => available).length;
  const activeCount = Object.entries(availableLayers).filter(([key, available]) => available && layers[key]).length;

  const isAvailable = (key) => availableLayers[key] ?? Boolean(layerKeyForAvailability[key] && availableLayers[layerKeyForAvailability[key]]);
  const getLayerSource = (key) => {
    const canonicalKey = key.startsWith('incident_') || key === 'density'
      ? 'incidents'
      : key.startsWith('zones_')
      ? 'zones'
      : key === 'ambulances'
      ? 'resources'
      : key;
    const source = layerSources[canonicalKey];
    if (source === 'API') return 'API';
    if (source === 'Open-Meteo') return 'Open-Meteo';
    if (source?.startsWith('demo')) return 'Demo';
    return null;
  };

  if (!layers || !onToggleLayer) return null;

  const toggleCategory = (category) => setExpanded((current) => ({ ...current, [category]: !current[category] }));

  return (
    <div className={`layer-panel ${isOpen ? 'expanded' : 'collapsed'}`} aria-label="Map layer manager">
      <button type="button" className="layer-panel-toggle" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen}>
        <span aria-hidden="true">🗂️</span><span>Map Layers</span>
        <span className="layer-active-count">{activeCount}/{availableOverlayCount} active</span>
        <span aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="layer-panel-body" role="region" aria-label="Layer controls">
          <label className="layer-search-label" htmlFor="map-layer-search">Search layers</label>
          <input id="map-layer-search" className="layer-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search layers…" />
          {!is3D && <section className="layer-category">
            <button className="layer-category-heading" type="button" onClick={() => toggleCategory('basemaps')} aria-expanded={normalizedQuery ? true : expanded.basemaps}>
              <span>🗺️</span><span>Base Maps</span><span>{normalizedQuery || expanded.basemaps ? '−' : '+'}</span>
            </button>
            {(normalizedQuery || expanded.basemaps) && BASEMAPS.filter((item) => !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery)).map((item) => (
              <button key={item.id} type="button" className={`layer-option basemap-option${item.unavailable ? ' unavailable' : ''}`} title={item.source} aria-pressed={basemap === item.id} disabled={item.unavailable} onClick={() => onBasemapChange?.(item.id)}>
                <span className="layer-option-icon">{item.icon}</span><span className="layer-option-label">{item.label}</span>
                {item.unavailable && <span className="layer-unavailable" title={item.source}>Unavailable</span>}
                {basemap === item.id && !item.unavailable && <span className="layer-visible">Selected</span>}
              </button>
            ))}
          </section>}
          {is3D && <p className="layer-3d-note">3D mode uses satellite imagery, terrain elevation and mapped building heights. Use the camera controls to tilt or rotate the view.</p>}

          {filteredCategories.map((category) => (
            <section className="layer-category" key={category.id}>
              <button className="layer-category-heading" type="button" onClick={() => toggleCategory(category.id)} aria-expanded={normalizedQuery ? true : Boolean(expanded[category.id])}>
                <span>{category.icon}</span><span>{category.label}</span><span>{normalizedQuery || expanded[category.id] ? '−' : '+'}</span>
              </button>
              {(normalizedQuery || expanded[category.id]) && category.layers.map(([key, icon, label]) => {
                const available = isAvailable(key);
                const source = available ? getLayerSource(key) : null;
                return (
                  <button key={key} type="button" className={`layer-option${available ? '' : ' unavailable'}`} title={available ? 'Toggle layer visibility' : 'No connected geographic data source'} aria-pressed={available && Boolean(layers[key])} disabled={!available} onClick={() => onToggleLayer(key)}>
                    <span className="layer-option-icon">{icon}</span><span className="layer-option-label">{label}</span>
                    <span className={available && layers[key] ? 'layer-visible' : 'layer-unavailable'}>{available ? (layers[key] ? 'On' : 'Off') : 'No source'}</span>
                    {source && <span className={`layer-source-tag${source === 'Demo' ? ' demo' : ''}`}>{source}</span>}
                  </button>
                );
              })}
            </section>
          ))}

          <div className="layer-panel-actions">
            <button type="button" onClick={onShowAll}>Show All Layers</button>
            <button type="button" onClick={onHideOverlays}>Hide All Overlays</button>
            <button type="button" onClick={() => { onReset?.(); setSearch(''); setExpanded({ basemaps: true, incidents: true, services: true }); }}>Reset Layers</button>
          </div>
          <button type="button" className="layer-legend-toggle" aria-expanded={showLegend} onClick={() => setShowLegend((value) => !value)}>
            {showLegend ? 'Hide legend' : 'Show legend'}
          </button>
          {showLegend && <div className="layer-legend">
            <span><i className="legend-swatch legend-incident" /> Incidents (severity colored)</span>
            <span><i className="legend-swatch legend-hospital" /> Hospital</span>
            <span><i className="legend-swatch legend-team" /> Response team</span>
            <span><i className="legend-swatch legend-zone" /> Demonstration hazard zone</span>
            <small>Imagery: {BASEMAPS.find((item) => item.id === basemap)?.source}</small>
            <small>Operational records are simulated in demo mode. Layer refresh: {dataUpdated || 'waiting for data'}.</small>
          </div>}
          <div className="layer-data-source">
            <strong>Data sources</strong>
            <span>Street: OpenStreetMap. Satellite, labels and terrain: Esri. Dark: CARTO. Point weather observations: Open-Meteo. No official weather-alert or rainfall raster feed is connected.</span>
            <span>API means the configured backend returned the records; it does not certify them as real or live. Demo labels identify simulated/local datasets.</span>
            <span>Last app data refresh: {dataUpdated || 'waiting for first refresh'}.</span>
          </div>
        </div>
      )}
    </div>
  );
}
