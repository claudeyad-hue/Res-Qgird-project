import mongoose from 'mongoose';
import env from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

import User from '../src/models/User.js';
import Incident from '../src/models/Incident.js';
import Resource from '../src/models/Resource.js';
import Hospital from '../src/models/Hospital.js';
import Team from '../src/models/Team.js';

// Development Seed Users
const SEED_USERS = [
  {
    name: 'Command Admin Alex',
    email: 'admin@unified.gov',
    password: 'password123',
    role: 'admin',
    phone: '+1 555-0101',
    organization: 'City Disaster Management Authority',
  },
  {
    name: 'Operator Olivia',
    email: 'operator@unified.gov',
    password: 'password123',
    role: 'operator',
    phone: '+1 555-0102',
    organization: 'Emergency Operations Center',
  },
  {
    name: 'Responder Ryan',
    email: 'responder@unified.gov',
    password: 'password123',
    role: 'responder',
    phone: '+1 555-0103',
    organization: 'Disaster Rapid Response Team Alpha',
  },
  {
    name: 'Dr. Maya Medical',
    email: 'medical@unified.gov',
    password: 'password123',
    role: 'medical',
    phone: '+1 555-0104',
    organization: 'City Healthcare Network',
  },
  {
    name: 'Public Viewer Victor',
    email: 'viewer@unified.gov',
    password: 'password123',
    role: 'viewer',
    phone: '+1 555-0105',
    organization: 'Public Information Bureau',
  },
];

// Development Seed Incidents
const SEED_INCIDENTS = [
  {
    incidentCode: 'INC-1042',
    title: 'Flash Flood and Levee Breach',
    description: 'Rapid water rise following upstream levee breach. Evacuations underway in low-lying residential sectors.',
    type: 'Flood',
    severity: 'critical',
    status: 'active',
    location: 'Sector 14 - North Bank',
    latitude: 28.6139,
    longitude: 77.2090,
    reportedBy: 'Field Sensor Node #12',
    affectedPeople: 48,
    priority: 1,
    assignedTeamName: 'Rescue Team Alpha',
  },
  {
    incidentCode: 'INC-1038',
    title: 'Severe Structural Damage',
    description: 'Structural cracks reported in a 4-storey residential block following foundation slippage.',
    type: 'Building Damage',
    severity: 'high',
    status: 'verified',
    location: 'Sector 8 - Old Quarter',
    latitude: 28.6250,
    longitude: 77.2150,
    reportedBy: 'Municipal Inspector',
    affectedPeople: 25,
    priority: 2,
    assignedTeamName: null,
  },
  {
    incidentCode: 'INC-1031',
    title: 'Secondary Road Landslide',
    description: 'Slope failure blocking the secondary arterial access road. Highway patrol requesting heavy earthmovers.',
    type: 'Landslide',
    severity: 'medium',
    status: 'active',
    location: 'Sector 21 - Valley Pass',
    latitude: 28.5800,
    longitude: 77.2300,
    reportedBy: 'Highway Patrol',
    affectedPeople: 15,
    priority: 3,
    assignedTeamName: 'Rescue Team Bravo',
  },
  {
    incidentCode: 'INC-1020',
    title: 'Main Grid Substation Power Outage',
    description: 'Substation failure affecting the northern residential and medical clinic auxiliary grid.',
    type: 'Power Outage',
    severity: 'medium',
    status: 'active',
    location: 'Sector 5 - Industrial Zone',
    latitude: 28.6500,
    longitude: 77.1800,
    reportedBy: 'Power Grid Operations',
    affectedPeople: 200,
    priority: 3,
    assignedTeamName: 'Logistics Unit Delta',
  },
  {
    incidentCode: 'INC-1010',
    title: 'Municipal Water Supply Contamination',
    description: 'Suspected runoff contamination in the local municipal supply line. Boil water notice issued.',
    type: 'Water Contamination',
    severity: 'high',
    status: 'reported',
    location: 'Sector 12 - West Reservoir',
    latitude: 28.6050,
    longitude: 77.1950,
    reportedBy: 'Water Quality Bureau',
    affectedPeople: 90,
    priority: 2,
    assignedTeamName: null,
  },
  {
    incidentCode: 'INC-0998',
    title: 'Road Collapse from Storm Erosion',
    description: 'Partial road collapse from heavy runoff erosion, since stabilized and repaired.',
    type: 'Road Collapse',
    severity: 'low',
    status: 'resolved',
    location: 'Sector 3 - Bypass Way',
    latitude: 28.6400,
    longitude: 77.2400,
    reportedBy: 'Traffic Control',
    affectedPeople: 0,
    priority: 4,
    assignedTeamName: 'Rescue Team Alpha',
  },
];

// Development Seed Resources
const SEED_RESOURCES = [
  {
    resourceCode: 'RES-01',
    name: 'Potable Drinking Water Storage',
    type: 'Water',
    quantity: 5000,
    availableQuantity: 4200,
    unit: 'L',
    location: 'Central Warehouse A',
    status: 'available',
  },
  {
    resourceCode: 'RES-02',
    name: 'Emergency Trauma & Antibiotic Kits',
    type: 'Medicine',
    quantity: 1000,
    availableQuantity: 240,
    unit: 'kits',
    location: 'Hospital Medical Depot',
    status: 'low',
  },
  {
    resourceCode: 'RES-03',
    name: 'Ready-to-Eat Emergency Rations',
    type: 'Food',
    quantity: 3000,
    availableQuantity: 2100,
    unit: 'packs',
    location: 'Community Shelter A',
    status: 'available',
  },
  {
    resourceCode: 'RES-04',
    name: 'Hydraulic Cutters and Rescue Gear',
    type: 'Emergency Equipment',
    quantity: 400,
    availableQuantity: 310,
    unit: 'sets',
    location: 'Logistics Depot B',
    status: 'available',
  },
  {
    resourceCode: 'RES-05',
    name: 'Emergency Blankets & Thermal Wraps',
    type: 'Shelter',
    quantity: 1500,
    availableQuantity: 1450,
    unit: 'pieces',
    location: 'Community Shelter B',
    status: 'available',
  },
];

// Development Seed Hospitals
const SEED_HOSPITALS = [
  {
    hospitalCode: 'HOSP-01',
    name: 'City General Hospital',
    location: 'Medical Enclave, Central Sector',
    latitude: 28.6328,
    longitude: 77.2197,
    contact: '+91 11 2323-4000',
    totalBeds: 100,
    availableBeds: 28,
    totalICUBeds: 12,
    availableICUBeds: 4,
    emergencyStatus: 'accepting',
    ambulances: 4,
  },
  {
    hospitalCode: 'HOSP-02',
    name: 'District Trauma Center',
    location: 'Western Ring Road, Sector 9',
    latitude: 28.6010,
    longitude: 77.1650,
    contact: '+91 11 2410-7000',
    totalBeds: 120,
    availableBeds: 14,
    totalICUBeds: 15,
    availableICUBeds: 2,
    emergencyStatus: 'limited',
    ambulances: 2,
  },
  {
    hospitalCode: 'HOSP-03',
    name: 'Riverside Community Medical Center',
    location: 'East Riverbank Road, Sector 18',
    latitude: 28.6180,
    longitude: 77.2500,
    contact: '+91 11 2699-5000',
    totalBeds: 80,
    availableBeds: 52,
    totalICUBeds: 10,
    availableICUBeds: 7,
    emergencyStatus: 'accepting',
    ambulances: 3,
  },
];

// Development Seed Teams
const SEED_TEAMS = [
  {
    teamCode: 'TEAM-01',
    name: 'Rescue Team Alpha',
    type: 'Search & Rescue',
    location: 'Sector 14 - North Bank',
    latitude: 28.6140,
    longitude: 77.2095,
    availability: 'deployed',
    contact: '+1 555-TEAM-01',
    members: [
      { name: 'Captain Harris', role: 'Team Lead', phone: '+1 555-0191' },
      { name: 'Sarah Chen', role: 'Paramedic', phone: '+1 555-0192' },
      { name: 'Marcus Brody', role: 'Heavy Rescue', phone: '+1 555-0193' },
    ],
  },
  {
    teamCode: 'TEAM-02',
    name: 'Rescue Team Bravo',
    type: 'Hazmat & Extraction',
    location: 'Sector 21 - Valley Pass',
    latitude: 28.5810,
    longitude: 77.2310,
    availability: 'assigned',
    contact: '+1 555-TEAM-02',
    members: [
      { name: 'Lt. Gomez', role: 'Hazmat Lead', phone: '+1 555-0181' },
      { name: 'David Kim', role: 'Field Tech', phone: '+1 555-0182' },
    ],
  },
  {
    teamCode: 'TEAM-03',
    name: 'Logistics Unit Delta',
    type: 'Supply & Transport',
    location: 'Sector 5 - Industrial Zone',
    latitude: 28.6490,
    longitude: 77.1810,
    availability: 'deployed',
    contact: '+1 555-TEAM-03',
    members: [
      { name: 'Sergeant Miller', role: 'Logistics Coordinator', phone: '+1 555-0171' },
    ],
  },
  {
    teamCode: 'TEAM-04',
    name: 'Medical Fast Response Team Echo',
    type: 'Triage & Medical',
    location: 'City General Staging Area',
    latitude: 28.6325,
    longitude: 77.2190,
    availability: 'available',
    contact: '+1 555-TEAM-04',
    members: [
      { name: 'Dr. Evelyn Carter', role: 'Emergency Physician', phone: '+1 555-0161' },
      { name: 'Nurse Paul', role: 'Triage Nurse', phone: '+1 555-0162' },
    ],
  },
];

async function seedDatabase() {
  console.log('[Seed] Starting database seeding process...');

  if (env.isProduction && !process.argv.includes('--force-production-seed')) {
    console.error('[Seed] REFUSING TO SEED: Production environment detected. Pass --force-production-seed if intentional.');
    process.exit(1);
  }

  try {
    await connectDatabase(env.MONGODB_URI);

    console.log('[Seed] Clearing existing development data...');
    await Promise.all([
      User.deleteMany({}),
      Incident.deleteMany({}),
      Resource.deleteMany({}),
      Hospital.deleteMany({}),
      Team.deleteMany({}),
    ]);

    console.log('[Seed] Inserting users...');
    for (const u of SEED_USERS) {
      await User.create(u);
    }

    console.log('[Seed] Inserting teams...');
    const insertedTeams = await Team.insertMany(SEED_TEAMS);
    const alphaTeam = insertedTeams.find((t) => t.teamCode === 'TEAM-01');
    const bravoTeam = insertedTeams.find((t) => t.teamCode === 'TEAM-02');
    const deltaTeam = insertedTeams.find((t) => t.teamCode === 'TEAM-03');

    console.log('[Seed] Inserting incidents...');
    const incidentsToInsert = SEED_INCIDENTS.map((inc) => {
      const copy = { ...inc };
      if (inc.assignedTeamName === 'Rescue Team Alpha' && alphaTeam) {
        copy.assignedTeam = alphaTeam._id;
      } else if (inc.assignedTeamName === 'Rescue Team Bravo' && bravoTeam) {
        copy.assignedTeam = bravoTeam._id;
      } else if (inc.assignedTeamName === 'Logistics Unit Delta' && deltaTeam) {
        copy.assignedTeam = deltaTeam._id;
      }
      return copy;
    });
    const insertedIncidents = await Incident.insertMany(incidentsToInsert);

    // Link incidents back to teams
    const floodIncident = insertedIncidents.find((i) => i.incidentCode === 'INC-1042');
    const landslideIncident = insertedIncidents.find((i) => i.incidentCode === 'INC-1031');
    const outageIncident = insertedIncidents.find((i) => i.incidentCode === 'INC-1020');

    if (alphaTeam && floodIncident) {
      await Team.findByIdAndUpdate(alphaTeam._id, { assignedIncident: floodIncident._id });
    }
    if (bravoTeam && landslideIncident) {
      await Team.findByIdAndUpdate(bravoTeam._id, { assignedIncident: landslideIncident._id });
    }
    if (deltaTeam && outageIncident) {
      await Team.findByIdAndUpdate(deltaTeam._id, { assignedIncident: outageIncident._id });
    }

    console.log('[Seed] Inserting resources...');
    await Resource.insertMany(SEED_RESOURCES);

    console.log('[Seed] Inserting hospitals...');
    await Hospital.insertMany(SEED_HOSPITALS);

    console.log('\n======================================================');
    console.log(' [Seed] Database seeded successfully for development!');
    console.log('======================================================');
    console.log(` - Users seeded:      ${SEED_USERS.length}`);
    console.log(` - Incidents seeded:  ${SEED_INCIDENTS.length}`);
    console.log(` - Resources seeded:  ${SEED_RESOURCES.length}`);
    console.log(` - Hospitals seeded:  ${SEED_HOSPITALS.length}`);
    console.log(` - Teams seeded:      ${SEED_TEAMS.length}`);
    console.log('\nDefault credentials (password for all is "password123"):');
    console.log('  Admin:     admin@unified.gov');
    console.log('  Operator:  operator@unified.gov');
    console.log('  Responder: responder@unified.gov');
    console.log('  Medical:   medical@unified.gov');
    console.log('  Viewer:    viewer@unified.gov');
    console.log('======================================================\n');

    await disconnectDatabase();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Seeding failed:', err);
    await disconnectDatabase();
    process.exit(1);
  }
}

seedDatabase();
