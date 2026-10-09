// Comprehensive REST API Test Suite for Unified Disaster Management Console
// Tests all 10 endpoints required by Phase C & Phase H:
// 1. GET /api/health
// 2. GET /api/incidents
// 3. GET /api/incidents/:id
// 4. GET /api/hospitals
// 5. GET /api/hospitals/:id
// 6. GET /api/resources
// 7. GET /api/resources/:id
// 8. GET /api/hospitals/nearest (Phase G)
// 9. POST /api/routes/incident (Phase H)
// 10. POST /api/routes/hospital (Phase H)
// Also tests boundary enforcement & error conditions.

import app from '../src/app.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- Unified Disaster Management Console REST API Test Suite ---\n');

  // Start internal test server on ephemeral port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. GET /api/health
    console.log('Testing 1: GET /api/health');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthData.success === true, 'Health payload has success: true');
    assert(healthData.data.server === 'ok', 'Health reports server: ok');
    assert(Boolean(healthData.data.operationalArea), 'Health confirms operationalArea configured');

    // 2. GET /api/incidents
    console.log('\nTesting 2: GET /api/incidents');
    const incRes = await fetch(`${baseUrl}/api/incidents`);
    const incData = await incRes.json();
    assert(incRes.status === 200, 'Incidents list returns HTTP 200');
    assert(incData.success === true, 'Incidents payload has success: true');
    assert(Array.isArray(incData.data), 'Incidents data is an array');
    assert(incData.data.length >= 6, 'Incidents contain seeded Ghaziabad demo records');
    const firstInc = incData.data[0];

    // 3. GET /api/incidents/:id
    console.log('\nTesting 3: GET /api/incidents/:id');
    const singleIncRes = await fetch(`${baseUrl}/api/incidents/${firstInc.id}`);
    const singleIncData = await singleIncRes.json();
    assert(singleIncRes.status === 200, `Incident ${firstInc.id} returns HTTP 200`);
    assert(singleIncData.success === true, 'Incident detail has success: true');
    assert(singleIncData.data.id === firstInc.id, 'Incident ID matches requested ID');

    // 3b. Non-existent incident
    const missingIncRes = await fetch(`${baseUrl}/api/incidents/INC-NON-EXISTENT`);
    assert(missingIncRes.status === 404, 'Non-existent incident returns HTTP 404');

    // 4. GET /api/hospitals
    console.log('\nTesting 4: GET /api/hospitals');
    const hospRes = await fetch(`${baseUrl}/api/hospitals`);
    const hospData = await hospRes.json();
    assert(hospRes.status === 200, 'Hospitals list returns HTTP 200');
    assert(hospData.success === true, 'Hospitals payload has success: true');
    assert(Array.isArray(hospData.data), 'Hospitals data is an array');
    assert(hospData.data.length >= 6, 'Hospitals contain seeded Ghaziabad demo records');
    const firstHosp = hospData.data[0];

    // 5. GET /api/hospitals/:id
    console.log('\nTesting 5: GET /api/hospitals/:id');
    const singleHospRes = await fetch(`${baseUrl}/api/hospitals/${firstHosp.id}`);
    const singleHospData = await singleHospRes.json();
    assert(singleHospRes.status === 200, `Hospital ${firstHosp.id} returns HTTP 200`);
    assert(singleHospData.success === true, 'Hospital detail has success: true');
    assert(singleHospData.data.id === firstHosp.id, 'Hospital ID matches requested ID');

    // 6. GET /api/resources
    console.log('\nTesting 6: GET /api/resources');
    const resRes = await fetch(`${baseUrl}/api/resources`);
    const resData = await resRes.json();
    assert(resRes.status === 200, 'Resources list returns HTTP 200');
    assert(resData.success === true, 'Resources payload has success: true');
    assert(Array.isArray(resData.data), 'Resources data is an array');
    assert(resData.data.length >= 6, 'Resources contain seeded Ghaziabad demo records');
    const firstResItem = resData.data[0];

    // 7. GET /api/resources/:id
    console.log('\nTesting 7: GET /api/resources/:id');
    const singleResRes = await fetch(`${baseUrl}/api/resources/${firstResItem.id}`);
    const singleResData = await singleResRes.json();
    assert(singleResRes.status === 200, `Resource ${firstResItem.id} returns HTTP 200`);
    assert(singleResData.success === true, 'Resource detail has success: true');
    assert(singleResData.data.id === firstResItem.id, 'Resource ID matches requested ID');

    // 8. GET /api/hospitals/nearest (Phase G)
    console.log('\nTesting 8: GET /api/hospitals/nearest');
    // Origin in Ghaziabad (e.g. Raj Nagar: 28.6850, 77.4420)
    const nearestRes = await fetch(`${baseUrl}/api/hospitals/nearest?latitude=28.6850&longitude=77.4420`);
    const nearestData = await nearestRes.json();
    assert(nearestRes.status === 200, 'Nearest hospital returns HTTP 200');
    assert(nearestData.success === true, 'Nearest hospital payload has success: true');
    assert(nearestData.data && nearestData.data.hospital, 'Nearest hospital returned valid hospital candidate');
    assert(typeof nearestData.data.distanceKm === 'number', 'Distance is computed dynamically in km');
    assert(nearestData.data.distanceKm > 0, 'Distance is non-zero');

    // 8b. Nearest with out-of-bounds coordinates
    const outOfBoundsNearest = await fetch(`${baseUrl}/api/hospitals/nearest?latitude=19.0760&longitude=72.8777`);
    assert(outOfBoundsNearest.status === 400, 'Out-of-bounds nearest query rejected with HTTP 400');

    // 9. POST /api/routes/incident (Phase H)
    console.log('\nTesting 9: POST /api/routes/incident');
    const routeIncRes = await fetch(`${baseUrl}/api/routes/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { latitude: 28.6692, longitude: 77.4538 }, // Ghaziabad center
        destinationId: firstInc.id,
      }),
    });
    const routeIncData = await routeIncRes.json();
    assert(routeIncRes.status === 200, 'Route to incident returns HTTP 200');
    assert(routeIncData.success === true, 'Route to incident returns success: true');
    assert(routeIncData.data.routeType === 'road', 'Route returned road route type');
    assert(Array.isArray(routeIncData.data.coordinates) && routeIncData.data.coordinates.length > 5, 'Route geometry has valid road polyline coordinates');
    assert(typeof routeIncData.data.distanceKm === 'number', 'Route has real distanceKm');
    assert(typeof routeIncData.data.durationMin === 'number', 'Route has real durationMin');

    // 9b. Route with out-of-boundary origin
    const outRouteIncRes = await fetch(`${baseUrl}/api/routes/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { latitude: 28.5355, longitude: 77.3910 }, // Noida (out of area)
        destinationId: firstInc.id,
      }),
    });
    assert(outRouteIncRes.status === 400, 'Out-of-area origin rejected with HTTP 400');

    // 10. POST /api/routes/hospital (Phase H)
    console.log('\nTesting 10: POST /api/routes/hospital');
    const routeHospRes = await fetch(`${baseUrl}/api/routes/hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { latitude: 28.6750, longitude: 77.4450 },
        destinationId: firstHosp.id,
      }),
    });
    const routeHospData = await routeHospRes.json();
    assert(routeHospRes.status === 200, 'Route to hospital returns HTTP 200');
    assert(routeHospData.success === true, 'Route to hospital returns success: true');
    assert(routeHospData.data.routeType === 'road', 'Route returned road route type');
    assert(Array.isArray(routeHospData.data.coordinates) && routeHospData.data.coordinates.length > 5, 'Hospital road geometry has polyline coordinates');
    assert(typeof routeHospData.data.distanceKm === 'number', 'Hospital route has real distanceKm');

    console.log(`\n==========================================`);
    console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`==========================================\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
