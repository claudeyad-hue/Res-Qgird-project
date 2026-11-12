import env from '../src/config/env.js';
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from '../src/config/database.js';
import Hospital from '../src/models/Hospital.js';
import { GHAZIABAD_HOSPITALS } from '../../src/data/ghaziabadHospitals.js';

// Exact names from the retired synthetic hospital fixtures plus the names being
// curated here. Only these matching Hospital documents are replaced; other
// hospitals, incidents, resources, users and teams are untouched.
const retiredDemoNames = [
  'City General Hospital',
  'District Trauma Center',
  'Riverside Community Medical Center',
  'MMG District Hospital Ghaziabad',
  'Yashoda Super Speciality Hospital, Kaushambi',
  'Max Super Speciality Hospital, Vaishali',
  'Santosh Medical College & Hospital',
  'Sarvodaya Hospital, Kavi Nagar',
  'Narendra Mohan Hospital',
  'Vijay Nagar Community Health Facility (Closed/Diverting)',
];

const doApply = process.argv.includes('--apply');

async function syncHospitals() {
  if (env.isProduction && !doApply) {
    console.error('[Hospital sync] Production database detected. Re-run with --apply after reviewing the dry-run summary.');
    process.exitCode = 2;
    return;
  }
  await connectDatabase(env.MONGODB_URI);
  try {
    if (!isDatabaseConnected()) {
      throw new Error('MongoDB is not connected. Hospital sync stopped without reading or writing collections.');
    }
    const replacedNames = [...new Set([...retiredDemoNames, ...GHAZIABAD_HOSPITALS.map((hospital) => hospital.name)])];
    const filter = { name: { $in: replacedNames } };
    const matched = await Hospital.countDocuments(filter);
    console.log(`[Hospital sync] Official Ghaziabad listings: ${GHAZIABAD_HOSPITALS.length}`);
    console.log(`[Hospital sync] Existing exact-name documents to replace: ${matched}`);
    console.log(`[Hospital sync] Mode: ${doApply ? 'APPLY' : 'DRY RUN (no writes)'}; other collections are not modified.`);
    if (!doApply) return;

    await Hospital.deleteMany(filter);
    const operations = GHAZIABAD_HOSPITALS.map((record) => {
      const { id, sources, address, ...fields } = record;
      return {
        updateOne: {
          filter: { hospitalCode: id },
          update: {
            $set: {
              ...fields,
              hospitalCode: id,
              address: address || null,
              location: address || null,
              sourceUrls: sources,
              sourceUrl: sources[0] || null,
              latitude: record.latitude ?? null,
              longitude: record.longitude ?? null,
              totalBeds: null,
              availableBeds: null,
              totalICUBeds: null,
              availableICUBeds: null,
              ambulances: null,
              emergencyStatus: 'unknown',
              availabilitySource: null,
              liveAvailability: { beds: null, icuBeds: null, oxygen: null, ambulances: null, emergencyStatus: null, updatedAt: null, updatedBy: null, source: null },
            },
          },
          upsert: true,
        },
      };
    });
    const result = await Hospital.bulkWrite(operations, { ordered: true });
    console.log(`[Hospital sync] Upserted official listings. Modified: ${result.modifiedCount}; inserted: ${result.upsertedCount}.`);
  } finally {
    await disconnectDatabase();
  }
}

syncHospitals().catch(async (error) => {
  console.error('[Hospital sync] Failed:', error.message);
  await disconnectDatabase();
  process.exitCode = 1;
});
