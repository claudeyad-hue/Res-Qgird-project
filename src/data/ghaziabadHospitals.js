// Keep the frontend import path stable while the backend package owns the
// canonical source so Railway can deploy it from the /backend root directory.
export {
  GHAZIABAD_HOSPITALS,
  HOSPITAL_SOURCE_URLS,
} from '../../backend/src/data/ghaziabadHospitals.js';
