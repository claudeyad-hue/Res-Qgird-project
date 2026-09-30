export const SEV_LABEL = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  resolved: 'Resolved',
};

export const STATUS_FLOW = {
  unassigned: 'in-progress',
  'in-progress': 'resolved',
  resolved: 'resolved',
};

export const INITIAL_INCIDENTS = [
  {
    id: 'INC-1042',
    type: 'Flood',
    severity: 'critical',
    location: 'Sector 14',
    affected: 48,
    time: '12 min ago',
    status: 'in-progress',
    team: 'Rescue Team Alpha',
    x: 22,
    y: 38,
    desc: 'Rapid water rise following upstream levee breach.',
  },
  {
    id: 'INC-1038',
    type: 'Building Damage',
    severity: 'high',
    location: 'Sector 8',
    affected: 25,
    time: '25 min ago',
    status: 'unassigned',
    team: null,
    x: 58,
    y: 22,
    desc: 'Structural cracks reported in a 4-storey residential block.',
  },
  {
    id: 'INC-1031',
    type: 'Landslide',
    severity: 'medium',
    location: 'Sector 21',
    affected: 15,
    time: '40 min ago',
    status: 'in-progress',
    team: 'Rescue Team Bravo',
    x: 75,
    y: 60,
    desc: 'Slope failure blocking the secondary access road.',
  },
  {
    id: 'INC-1020',
    type: 'Power Outage',
    severity: 'medium',
    location: 'Sector 5',
    affected: 200,
    time: '1 hr ago',
    status: 'in-progress',
    team: 'Rescue Team Charlie',
    x: 35,
    y: 70,
    desc: 'Substation failure affecting the northern residential grid.',
  },
  {
    id: 'INC-1010',
    type: 'Water Contamination',
    severity: 'high',
    location: 'Sector 12',
    affected: 90,
    time: '2 hr ago',
    status: 'unassigned',
    team: null,
    x: 50,
    y: 45,
    desc: 'Suspected runoff contamination in the local supply line.',
  },
  {
    id: 'INC-0998',
    type: 'Road Collapse',
    severity: 'resolved',
    location: 'Sector 3',
    affected: 0,
    time: '5 hr ago',
    status: 'resolved',
    team: 'Rescue Team Alpha',
    x: 15,
    y: 60,
    desc: 'Partial road collapse from erosion, since repaired.',
  },
];

export const INITIAL_RESOURCES = [
  {
    id: 'RES-01',
    type: 'Water',
    amount: 4200,
    unit: 'L',
    location: 'Warehouse A',
    status: 'available',
  },
  {
    id: 'RES-02',
    type: 'Medicine',
    amount: 840,
    unit: 'units',
    location: 'Hospital Zone',
    status: 'low',
  },
  {
    id: 'RES-03',
    type: 'Food',
    amount: 2100,
    unit: 'packs',
    location: 'Shelter A',
    status: 'available',
  },
  {
    id: 'RES-04',
    type: 'Emergency Equipment',
    amount: 310,
    unit: 'kits',
    location: 'Warehouse B',
    status: 'available',
  },
];

export const INITIAL_HOSPITALS = [
  {
    id: 'HOSP-01',
    name: 'City General Hospital',
    distance: '2.4 km',
    bedsTotal: 100,
    bedsAvail: 28,
    icuTotal: 12,
    icuAvail: 4,
    status: 'accepting',
    ambulances: 3,
    contact: '+91 11 2323-4000',
    latitude: 28.6328,
    longitude: 77.2197,
    x: 20,
    y: 30,
  },
  {
    id: 'HOSP-02',
    name: 'District Hospital',
    distance: '4.8 km',
    bedsTotal: 100,
    bedsAvail: 6,
    icuTotal: 12,
    icuAvail: 1,
    status: 'limited',
    ambulances: 1,
    contact: '+91 22 2410-7000',
    latitude: 19.0760,
    longitude: 72.8877,
    x: 60,
    y: 55,
  },
  {
    id: 'HOSP-03',
    name: 'Riverside Medical Center',
    distance: '6.1 km',
    bedsTotal: 80,
    bedsAvail: 52,
    icuTotal: 10,
    icuAvail: 7,
    status: 'accepting',
    ambulances: 2,
    contact: '+91 80 2699-5000',
    latitude: 12.9780,
    longitude: 77.6000,
    x: 40,
    y: 75,
  },
];

export const STATIC_EXTRA_MARKERS = [
  { id: 'hosp-marker-1', x: 12, y: 15, type: 'hosp', title: 'Hospital Station North' },
  { id: 'hosp-marker-2', x: 68, y: 80, type: 'hosp', title: 'District Field Hospital' },
  { id: 'team-marker-1', x: 85, y: 30, type: 'team', title: 'Rescue Team' },
  { id: 'team-marker-2', x: 68, y: 80, type: 'team', title: 'Rescue Team' },
];

export const INITIAL_USER = {
  name: 'Alex Dawson',
  role: 'Emergency Coordinator',
  org: 'City Disaster Management Authority',
  email: 'alex.dawson@unified.gov',
  phone: '+1 555-0142',
};

export const RECENT_ACTIVITY = [
  { time: '09:14', text: 'Rescue Team Alpha dispatched to Sector 14' },
  { time: '08:52', text: 'City General Hospital updated bed capacity' },
  { time: '08:30', text: 'Road Collapse in Sector 3 marked resolved' },
];

export const RESOURCE_UTILIZATION = [
  { label: 'Water', percent: 82 },
  { label: 'Food', percent: 64 },
  { label: 'Medicine', percent: 47 },
];

export const RESOURCE_AVAILABILITY = [
  { label: 'Water', percent: 82 },
  { label: 'Food', percent: 64 },
  { label: 'Medicine', percent: 47 },
  { label: 'Equipment', percent: 71 },
];

export const SCREEN_TITLES = {
  dashboard: {
    title: (name = 'Admin') => `Good morning, ${name.split(' ')[0] || 'Admin'}`,
    sub: 'Monitor emergency operations and coordinate response teams.',
  },
  map: {
    title: () => 'Live Disaster Map',
    sub: '',
  },
  incidents: {
    title: () => 'Incidents',
    sub: 'Track and coordinate active emergencies.',
  },
  resources: {
    title: () => 'Emergency Resources',
    sub: 'Monitor and allocate critical resources.',
  },
  hospitals: {
    title: () => 'Hospitals',
    sub: 'Monitor emergency healthcare capacity.',
  },
  profile: {
    title: () => 'Profile',
    sub: 'Manage your account and role.',
  },
  settings: {
    title: () => 'Settings',
    sub: 'Configure your console preferences.',
  },
};
