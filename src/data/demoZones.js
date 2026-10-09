// Disaster / Risk Zones model conforming to Section Q
// Ghaziabad Operational Scope: Hindon Basin, Sahibabad Industrial Zone, etc.

export const DEMO_ZONES = [
  {
    zoneId: 'ZONE-FL-01',
    name: 'Hindon River Inundation Warning Zone',
    type: 'flood',
    riskLevel: 'Critical',
    description: '[DEMO] Low-lying flood buffer along Hindon riverbed in Karhera-Raj Nagar ext.',
    shape: 'polygon',
    coordinates: [
      [28.7100, 77.4200],
      [28.6900, 77.4100],
      [28.6650, 77.4050],
      [28.6500, 77.3950],
      [28.6550, 77.4100],
      [28.6850, 77.4250],
    ],
    color: '#C0392B',
    fillColor: '#C0392B',
    fillOpacity: 0.22,
  },
  {
    zoneId: 'ZONE-HZ-02',
    name: 'Sahibabad Industrial Hazmat Cordon',
    type: 'restricted',
    riskLevel: 'High',
    description: '[DEMO] Industrial containment area for chemical packaging storage units.',
    shape: 'circle',
    center: [28.6650, 77.3620],
    radius: 1800, // meters
    color: '#9B59B6',
    fillColor: '#9B59B6',
    fillOpacity: 0.20,
  },
  {
    zoneId: 'ZONE-EV-03',
    name: 'RDC Raj Nagar Evacuation Corridor',
    type: 'evacuation',
    riskLevel: 'High',
    description: '[DEMO] Temporary pedestrian safety zone around damaged commercial block.',
    shape: 'circle',
    center: [28.6855, 77.4421],
    radius: 900, // meters
    color: '#E67E22',
    fillColor: '#E67E22',
    fillOpacity: 0.25,
  },
];
