import { connectDatabase, disconnectDatabase, isDatabaseConnected } from '../src/config/database.js';
import ambulanceRepository from '../src/repositories/ambulanceRepository.js';
import { GHAZIABAD_AMBULANCES } from '../src/data/ghaziabadAmbulances.js';

try {
  await connectDatabase();
  if (!isDatabaseConnected()) throw new Error('MongoDB is not connected. Set MONGODB_URI before synchronizing official records.');
  const records = await ambulanceRepository.upsertSourceRecords(GHAZIABAD_AMBULANCES);
  console.log(`Synchronized ${records.length} source-backed ambulance service records.`);
} catch (error) {
  console.error(`Ambulance sync failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
