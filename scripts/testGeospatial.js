// Unit & Integration Tests for Ghaziabad Geolocation, Boundary Validation & Routing
import {
  GHAZIABAD_CONFIG,
  isPointInPolygon,
  isPointInOperationalArea,
  validateCoordinates,
  calculateDistance,
  findNearestHospital,
  fetchOSRMRoute,
} from '../src/utils/geoUtils.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' Ghaziabad Geolocation & Geospatial Test Suite');
  console.log('====================================================\n');

  // 1. CONFIGURATION & BOUNDARY INITIALIZATION
  console.log('--- Test Suite 1: Operational Area Configuration ---');
  assert(GHAZIABAD_CONFIG.id === 'GHAZIABAD_UP', 'Config ID is GHAZIABAD_UP');
  assert(GHAZIABAD_CONFIG.center[0] === 28.6692 && GHAZIABAD_CONFIG.center[1] === 77.4538, 'Center coordinates configured to Ghaziabad');
  assert(GHAZIABAD_CONFIG.defaultZoom === 12, 'Default zoom is level 12');
  assert(Array.isArray(GHAZIABAD_CONFIG.boundaryPolygon) && GHAZIABAD_CONFIG.boundaryPolygon.length >= 8, 'Boundary polygon has sufficient vertices');

  // 2. POINT-IN-POLYGON & BOUNDARY VALIDATION
  console.log('\n--- Test Suite 2: Ghaziabad Boundary Validation ---');

  // Points known to be inside Ghaziabad
  const insidePoints = [
    { name: 'MMG Hospital Ghaziabad', lat: 28.6672, lng: 77.4326 },
    { name: 'Indirapuram Central Hub', lat: 28.6410, lng: 77.3750 },
    { name: 'Raj Nagar RDC', lat: 28.6855, lng: 77.4421 },
    { name: 'Sahibabad Industrial Area', lat: 28.6650, lng: 77.3620 },
    { name: 'Vasundhara Sector 14', lat: 28.6530, lng: 77.3820 },
    { name: 'Kaushambi Sector 1', lat: 28.6433, lng: 77.3242 },
  ];

  insidePoints.forEach((pt) => {
    const isInside = isPointInOperationalArea({ latitude: pt.lat, longitude: pt.lng });
    assert(isInside === true, `Point inside Ghaziabad accepted: ${pt.name} (${pt.lat}, ${pt.lng})`);
  });

  // Points strictly outside Ghaziabad
  const outsidePoints = [
    { name: 'Connaught Place, New Delhi', lat: 28.6328, lng: 77.2197 },
    { name: 'Noida Sector 62', lat: 28.6250, lng: 77.3650 },
    { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
    { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  ];

  outsidePoints.forEach((pt) => {
    const isInside = isPointInOperationalArea({ latitude: pt.lat, longitude: pt.lng });
    assert(isInside === false, `Point outside Ghaziabad rejected: ${pt.name} (${pt.lat}, ${pt.lng})`);
  });

  // Coordinate validator
  const validCheck = validateCoordinates({ latitude: 28.6672, longitude: 77.4326 });
  assert(validCheck.valid === true && validCheck.insideArea === true, 'validateCoordinates confirms in-area coordinates');

  const outCheck = validateCoordinates({ latitude: 19.0760, longitude: 72.8777 });
  assert(outCheck.valid === true && outCheck.insideArea === false && typeof outCheck.error === 'string', 'validateCoordinates returns error message for out-of-area');

  const invalidCheck = validateCoordinates({ latitude: 'invalid', longitude: 77.4326 });
  assert(invalidCheck.valid === false, 'validateCoordinates rejects NaN coordinates');

  // 3. HAVERSINE DISTANCE CALCULATION
  console.log('\n--- Test Suite 3: Haversine Distance Calculation ---');
  // Distance from Karhera (28.6812, 77.4125) to MMG Hospital (28.6672, 77.4326) is approx 2.5 km
  const dist1 = calculateDistance(
    { latitude: 28.6812, longitude: 77.4125 },
    { latitude: 28.6672, longitude: 77.4326 }
  );
  assert(dist1 > 2.0 && dist1 < 3.0, `Calculated straight-line distance is realistic: ${dist1} km`);

  const samePointDist = calculateDistance(
    { latitude: 28.6812, longitude: 77.4125 },
    { latitude: 28.6812, longitude: 77.4125 }
  );
  assert(samePointDist === 0, 'Distance to same point is 0 km');

  // 4. DYNAMIC NEAREST HOSPITAL RANKING
  console.log('\n--- Test Suite 4: Dynamic Nearest Hospital Selection ---');
  const sampleHospitals = [
    {
      id: 'HOSP-01',
      name: 'MMG District Hospital',
      latitude: 28.6672,
      longitude: 77.4326,
      status: 'accepting',
      bedsAvail: 42,
    },
    {
      id: 'HOSP-02',
      name: 'Yashoda Hospital Kaushambi',
      latitude: 28.6433,
      longitude: 77.3242,
      status: 'accepting',
      bedsAvail: 68,
    },
    {
      id: 'HOSP-OUT',
      name: 'AIIMS Delhi (Out of Area)',
      latitude: 28.5672,
      longitude: 77.2100, // Delhi - outside Ghaziabad
      status: 'accepting',
      bedsAvail: 100,
    },
    {
      id: 'HOSP-UNAVAIL',
      name: 'Closed Clinic Ghaziabad',
      latitude: 28.6815,
      longitude: 77.4126, // Close, but unavailable
      status: 'unavailable',
      bedsAvail: 0,
    },
  ];

  const incidentPoint = { latitude: 28.6855, longitude: 77.4421 }; // RDC Raj Nagar
  const nearestResult = findNearestHospital(incidentPoint, sampleHospitals);

  assert(nearestResult !== null, 'Found nearest suitable hospital');
  assert(nearestResult.hospital.id === 'HOSP-01', `Selected closest eligible hospital: ${nearestResult.hospital.name}`);
  assert(nearestResult.hospital.id !== 'HOSP-OUT', 'Excluded hospital outside Ghaziabad boundary');
  assert(nearestResult.hospital.id !== 'HOSP-UNAVAIL', 'Excluded unavailable hospital');
  assert(nearestResult.distanceType === 'straight-line', 'Identifies distance type as straight-line');
  assert(typeof nearestResult.distance === 'number', `Dynamic distance reported: ${nearestResult.distance} km`);

  // 5. ROAD ROUTING INTEGRATION & NON-FABRICATION GUARANTEES
  console.log('\n--- Test Suite 5: Road Routing & Error Handling ---');
  // 5.1 Invalid coordinate check
  const badRoute = await fetchOSRMRoute({ latitude: 'bad' }, { latitude: 28.6672, longitude: 77.4326 });
  assert(badRoute.status === 'error', 'Invalid coordinates produce status: error');
  assert(badRoute.coordinates.length === 0, 'No coordinates fabricated on error');
  assert(badRoute.distanceKm === 0 && badRoute.durationMin === 0, 'No fake ETA/distance produced on error');

  // 5.2 Real OSRM call between two Ghaziabad locations
  console.log('Testing live OSRM driving route between Ghaziabad points...');
  try {
    const liveRoute = await fetchOSRMRoute(
      { latitude: 28.6410, longitude: 77.3750 }, // Indirapuram
      { latitude: 28.6855, longitude: 77.4421 }, // RDC Raj Nagar
      { timeoutMs: 8000 }
    );

    if (liveRoute.status === 'ok') {
      assert(liveRoute.coordinates.length > 5, `OSRM returned valid polyline geometry with ${liveRoute.coordinates.length} waypoints`);
      assert(liveRoute.distanceKm > 0, `OSRM reported road distance: ${liveRoute.distanceKm} km`);
      assert(liveRoute.durationMin > 0, `OSRM reported road travel duration: ${liveRoute.durationMin} min`);
      assert(liveRoute.routeType === 'road', 'Identified route type as real road');
    } else {
      console.log(`  (Note: OSRM public server responded with error/timeout: ${liveRoute.message})`);
      assert(liveRoute.coordinates.length === 0, 'Non-fabrication guarantee respected when OSRM is unreachable');
    }
  } catch (err) {
    console.error('OSRM route exception:', err);
  }

  // Summary
  console.log('\n====================================================');
  console.log(` Test Execution Finished: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
