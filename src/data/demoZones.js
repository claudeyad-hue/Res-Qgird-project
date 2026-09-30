// Disaster / Risk Zones model conforming to Section Q
// Supports Circle and Polygon overlays
// Each zone contains: zoneId, name, type, riskLevel, description, shape ('circle' | 'polygon'), coordinates / center & radius

export const DEMO_ZONES = [
  {
    zoneId: 'ZONE-FL-01',
    name: 'Yamuna Lowland Inundation Zone',
    type: 'flood',
    riskLevel: 'Critical',
    description: 'High-risk floodplain zone submerged under 2.5m floodwaters. Evacuation mandatory.',
    shape: 'polygon',
    coordinates: [
      [28.6700, 77.2200],
      [28.6600, 77.2600],
      [28.6100, 77.2700],
      [28.5900, 77.2400],
      [28.6200, 77.2100],
    ],
    color: '#C0392B',
    fillColor: '#C0392B',
    fillOpacity: 0.25,
  },
  {
    zoneId: 'ZONE-EV-02',
    name: 'Puri Coastal Surge Evacuation Sector',
    type: 'evacuation',
    riskLevel: 'Critical',
    description: 'Immediate mandatory coastal evacuation within 5 km of shoreline due to Category-3 storm surge.',
    shape: 'circle',
    center: [19.8135, 85.8312],
    radius: 7000, // meters
    color: '#C9701E',
    fillColor: '#C9701E',
    fillOpacity: 0.2,
  },
  {
    zoneId: 'ZONE-HZ-03',
    name: 'Ambattur Chemical Hazmat Exclusion Perimeter',
    type: 'restricted',
    riskLevel: 'High',
    description: 'Hazardous airborne particle exclusion perimeter. Respirator gear required for all entering personnel.',
    shape: 'circle',
    center: [13.0827, 80.2707],
    radius: 3500, // meters
    color: '#9B59B6',
    fillColor: '#9B59B6',
    fillOpacity: 0.22,
  },
  {
    zoneId: 'ZONE-LS-04',
    name: 'Joshimath Active Landslide Vulnerability Corridor',
    type: 'landslide',
    riskLevel: 'High',
    description: 'Geologically active fault zone with ongoing slope movement. Heavy machinery restricted.',
    shape: 'polygon',
    coordinates: [
      [30.5800, 79.5200],
      [30.5900, 79.6000],
      [30.5200, 79.6200],
      [30.5000, 79.5500],
    ],
    color: '#D35400',
    fillColor: '#D35400',
    fillOpacity: 0.22,
  },
  {
    zoneId: 'ZONE-FL-05',
    name: 'Brahmaputra Flood Relief Staging Basin',
    type: 'flood',
    riskLevel: 'High',
    description: 'Riverbank overflow sector with active air-drop relief routes and boat corridors.',
    shape: 'circle',
    center: [26.1445, 91.7362],
    radius: 5500, // meters
    color: '#2980B9',
    fillColor: '#2980B9',
    fillOpacity: 0.2,
  },
];
