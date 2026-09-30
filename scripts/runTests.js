import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

let mongod;
let request;

async function runAllTests() {
  console.log('====================================================');
  console.log(' Starting Unified Disaster Management Backend Tests');
  console.log('====================================================\n');

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

  try {
    console.log('[Setup] Initializing in-memory MongoDB test server...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await connectDatabase(uri);
    request = supertest(app);
    console.log('[Setup] Test database ready.\n');

    // ----------------------------------------------------
    // TEST SUITE 1: HEALTH CHECK
    // ----------------------------------------------------
    console.log('--- Test Suite 1: Health Check ---');
    const healthRes = await request.get('/api/v1/health');
    assert(healthRes.status === 200, 'GET /api/v1/health returns 200 OK');
    assert(healthRes.body.success === true, 'Health check returns success: true');
    assert(healthRes.body.data.server === 'ok', 'Server status is "ok"');
    assert(healthRes.body.data.database === 'connected', 'Database status is "connected"');

    // Test backward compatibility alias /api/health
    const legacyHealthRes = await request.get('/api/health');
    assert(legacyHealthRes.status === 200, 'GET /api/health alias returns 200 OK');

    // ----------------------------------------------------
    // TEST SUITE 2: AUTHENTICATION & TOKENS
    // ----------------------------------------------------
    console.log('\n--- Test Suite 2: Authentication ---');

    // 2.1 Register Admin
    const adminRegRes = await request.post('/api/v1/auth/register').send({
      name: 'Admin Test User',
      email: 'admin.test@unified.gov',
      password: 'password123',
      role: 'admin',
    });
    assert(adminRegRes.status === 201, 'POST /api/v1/auth/register returns 201');
    assert(adminRegRes.body.success === true, 'Register response has success: true');
    assert(adminRegRes.body.data.token, 'Register returns JWT token');
    assert(adminRegRes.body.data.user.role === 'admin', 'Registered user has role "admin"');
    const adminToken = adminRegRes.body.data.token;

    // 2.2 Register Viewer
    const viewerRegRes = await request.post('/api/v1/auth/register').send({
      name: 'Viewer Test User',
      email: 'viewer.test@unified.gov',
      password: 'password123',
      role: 'viewer',
    });
    const viewerToken = viewerRegRes.body.data.token;
    assert(viewerRegRes.status === 201, 'POST /api/v1/auth/register returns 201 for viewer');

    // 2.3 Duplicate Registration
    const dupRegRes = await request.post('/api/v1/auth/register').send({
      name: 'Duplicate Admin',
      email: 'admin.test@unified.gov',
      password: 'password123',
    });
    assert(dupRegRes.status === 409, 'Duplicate email registration returns 409 Conflict');
    assert(dupRegRes.body.error.code === 'USER_EXISTS', 'Error code is USER_EXISTS');

    // 2.4 Login Success
    const loginRes = await request.post('/api/v1/auth/login').send({
      email: 'admin.test@unified.gov',
      password: 'password123',
    });
    assert(loginRes.status === 200, 'POST /api/v1/auth/login returns 200');
    assert(loginRes.body.data.token, 'Login returns token');

    // 2.5 Login Invalid Password
    const badLoginRes = await request.post('/api/v1/auth/login').send({
      email: 'admin.test@unified.gov',
      password: 'wrongpassword',
    });
    assert(badLoginRes.status === 401, 'Login with wrong password returns 401 Unauthorized');

    // 2.6 GET /me with valid token
    const meRes = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(meRes.status === 200, 'GET /api/v1/auth/me returns 200 with valid token');
    assert(meRes.body.data.email === 'admin.test@unified.gov', 'GET /me returns correct user');

    // 2.7 GET /me without token (Unauthorized error test)
    const noAuthMeRes = await request.get('/api/v1/auth/me');
    assert(noAuthMeRes.status === 401, 'GET /me without token returns 401 Unauthorized');
    assert(noAuthMeRes.body.error.code === 'UNAUTHORIZED', 'Error code is UNAUTHORIZED');

    // 2.8 GET /me with invalid token
    const badTokenMeRes = await request
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload');
    assert(badTokenMeRes.status === 401, 'GET /me with invalid token returns 401 Unauthorized');

    // ----------------------------------------------------
    // TEST SUITE 3: INCIDENT API (CRUD, Filter, Search, Pagination)
    // ----------------------------------------------------
    console.log('\n--- Test Suite 3: Incident API ---');

    // 3.1 Create Incident
    const createIncRes = await request.post('/api/v1/incidents').send({
      title: 'Flash Flood in Sector 14',
      description: 'Rapid water level rising near the bridge.',
      type: 'Flood',
      severity: 'critical',
      status: 'active',
      location: 'Sector 14',
      latitude: 28.6139,
      longitude: 77.2090,
      reportedBy: 'Emergency Hotline',
      affectedPeople: 50,
    });
    assert(createIncRes.status === 201, 'POST /api/v1/incidents returns 201 Created');
    assert(createIncRes.body.success === true, 'Incident creation returns success: true');
    assert(createIncRes.body.data.severity === 'critical', 'Incident severity is critical');
    assert(createIncRes.body.data.latitude === 28.6139, 'Latitude coordinate saved');
    assert(createIncRes.body.data.longitude === 77.2090, 'Longitude coordinate saved');
    const incidentId = createIncRes.body.data._id || createIncRes.body.data.id;

    // Create a second incident for filtering
    await request.post('/api/v1/incidents').send({
      title: 'Landslide on Hill Road',
      description: 'Secondary road blocked by falling debris.',
      type: 'Landslide',
      severity: 'medium',
      status: 'reported',
      location: 'Hill Road Pass',
      latitude: 28.5800,
      longitude: 77.2300,
      affectedPeople: 10,
    });

    // 3.2 Read Single Incident
    const getIncRes = await request.get(`/api/v1/incidents/${incidentId}`);
    assert(getIncRes.status === 200, 'GET /api/v1/incidents/:id returns 200');
    assert(getIncRes.body.data.title === 'Flash Flood in Sector 14', 'Incident title matches');

    // 3.3 Filter by Status
    const filterRes = await request.get('/api/v1/incidents?status=reported');
    assert(filterRes.status === 200, 'GET /api/v1/incidents?status=reported returns 200');
    assert(filterRes.body.data.length === 1, 'Filter returns 1 matching incident');

    // 3.4 Search
    const searchRes = await request.get('/api/v1/incidents?search=Flood');
    assert(searchRes.status === 200, 'GET /api/v1/incidents?search=Flood returns 200');
    assert(searchRes.body.data.length === 1, 'Search finds 1 matching flood record');

    // 3.5 Pagination
    const pageRes = await request.get('/api/v1/incidents?page=1&limit=1');
    assert(pageRes.status === 200, 'GET /api/v1/incidents?page=1&limit=1 returns 200');
    assert(pageRes.body.pagination.page === 1, 'Pagination page is 1');
    assert(pageRes.body.pagination.limit === 1, 'Pagination limit is 1');
    assert(pageRes.body.pagination.total === 2, 'Pagination total is 2');
    assert(pageRes.body.pagination.totalPages === 2, 'Pagination totalPages is 2');

    // 3.6 Update Incident
    const updateIncRes = await request.put(`/api/v1/incidents/${incidentId}`).send({
      description: 'Water has subsided somewhat.',
      affectedPeople: 35,
    });
    assert(updateIncRes.status === 200, 'PUT /api/v1/incidents/:id returns 200');
    assert(updateIncRes.body.data.affectedPeople === 35, 'Incident affected count updated');

    // 3.7 Status Update (PATCH)
    const patchStatusRes = await request.patch(`/api/v1/incidents/${incidentId}/status`).send({
      status: 'contained',
    });
    assert(patchStatusRes.status === 200, 'PATCH /api/v1/incidents/:id/status returns 200');
    assert(patchStatusRes.body.data.status === 'contained', 'Incident status updated to contained');

    // 3.8 Authorization Check on Delete: Viewer token -> Forbidden (403)
    const forbiddenDelRes = await request
      .delete(`/api/v1/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    assert(forbiddenDelRes.status === 403, 'DELETE /api/v1/incidents/:id by viewer returns 403 Forbidden');
    assert(forbiddenDelRes.body.error.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

    // 3.9 Delete with Admin Token -> Success (200)
    const adminDelRes = await request
      .delete(`/api/v1/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDelRes.status === 200, 'DELETE /api/v1/incidents/:id by admin returns 200');

    // ----------------------------------------------------
    // TEST SUITE 4: RESOURCE API
    // ----------------------------------------------------
    console.log('\n--- Test Suite 4: Resource API ---');

    // 4.1 Create Resource
    const createResRes = await request.post('/api/v1/resources').send({
      name: 'Drinking Water Packs',
      type: 'Water',
      quantity: 1000,
      availableQuantity: 800,
      unit: 'L',
      location: 'Warehouse A',
      status: 'available',
    });
    assert(createResRes.status === 201, 'POST /api/v1/resources returns 201');
    const resourceId = createResRes.body.data._id || createResRes.body.data.id;

    // 4.2 Resource Validation (Negative quantity rejected)
    const negQtyRes = await request.post('/api/v1/resources').send({
      name: 'Invalid Resource',
      type: 'Food',
      quantity: -50,
      availableQuantity: -50,
      location: 'Depot',
    });
    assert(negQtyRes.status === 400, 'Negative quantity rejected with 400 Bad Request');

    // 4.3 Resource Validation (availableQuantity > quantity rejected)
    const overQtyRes = await request.post('/api/v1/resources').send({
      name: 'Invalid Resource 2',
      type: 'Food',
      quantity: 100,
      availableQuantity: 150,
      location: 'Depot',
    });
    assert(overQtyRes.status === 400, 'availableQuantity > quantity rejected with 400 Bad Request');

    // 4.4 Update Resource Status
    const updateResStatus = await request.patch(`/api/v1/resources/${resourceId}/status`).send({
      status: 'low',
    });
    assert(updateResStatus.status === 200, 'PATCH /api/v1/resources/:id/status returns 200');
    assert(updateResStatus.body.data.status === 'low', 'Resource status updated to low');

    // ----------------------------------------------------
    // TEST SUITE 5: HOSPITAL API
    // ----------------------------------------------------
    console.log('\n--- Test Suite 5: Hospital API ---');

    // 5.1 Create Hospital
    const createHospRes = await request.post('/api/v1/hospitals').send({
      name: 'City General Hospital',
      location: 'Central Medical District',
      latitude: 28.6328,
      longitude: 77.2197,
      contact: '+91 11 2323-4000',
      totalBeds: 100,
      availableBeds: 45,
      totalICUBeds: 10,
      availableICUBeds: 3,
      emergencyStatus: 'accepting',
      ambulances: 3,
    });
    assert(createHospRes.status === 201, 'POST /api/v1/hospitals returns 201');
    const hospId = createHospRes.body.data._id || createHospRes.body.data.id;

    // 5.2 Hospital Bed Validation (availableBeds > totalBeds rejected)
    const badBedHospRes = await request.post('/api/v1/hospitals').send({
      name: 'Bad Hospital',
      location: 'Nowhere',
      latitude: 28.0,
      longitude: 77.0,
      contact: '123',
      totalBeds: 50,
      availableBeds: 60, // Invalid!
      totalICUBeds: 5,
      availableICUBeds: 2,
    });
    assert(badBedHospRes.status === 400, 'availableBeds > totalBeds rejected with 400');
    assert(badBedHospRes.body.error.code === 'INVALID_BEDS_RANGE', 'Error code is INVALID_BEDS_RANGE');

    // 5.3 Update Hospital Emergency Status
    const patchHospRes = await request.patch(`/api/v1/hospitals/${hospId}/status`).send({
      status: 'limited',
    });
    assert(patchHospRes.status === 200, 'PATCH /api/v1/hospitals/:id/status returns 200');
    assert(patchHospRes.body.data.emergencyStatus === 'limited', 'Hospital status updated to limited');

    // ----------------------------------------------------
    // TEST SUITE 6: TEAM API
    // ----------------------------------------------------
    console.log('\n--- Test Suite 6: Team API ---');

    // 6.1 Create Team
    const createTeamRes = await request.post('/api/v1/teams').send({
      name: 'Rescue Team Alpha',
      type: 'Search & Rescue',
      location: 'Sector 14',
      availability: 'deployed',
      contact: '+1 555-TEAM',
      members: [{ name: 'Capt. Harris', role: 'Lead' }],
    });
    assert(createTeamRes.status === 201, 'POST /api/v1/teams returns 201');
    const teamId = createTeamRes.body.data._id || createTeamRes.body.data.id;

    // 6.2 Update Team Status
    const patchTeamRes = await request.patch(`/api/v1/teams/${teamId}/status`).send({
      status: 'available',
    });
    assert(patchTeamRes.status === 200, 'PATCH /api/v1/teams/:id/status returns 200');
    assert(patchTeamRes.body.data.availability === 'available', 'Team status updated to available');

    // ----------------------------------------------------
    // TEST SUITE 7: DASHBOARD API (Dynamic Calculation)
    // ----------------------------------------------------
    console.log('\n--- Test Suite 7: Dashboard Summary API ---');
    const dashRes = await request.get('/api/v1/dashboard/summary');
    assert(dashRes.status === 200, 'GET /api/v1/dashboard/summary returns 200');
    assert(dashRes.body.success === true, 'Dashboard response has success: true');
    assert(typeof dashRes.body.data.activeIncidents === 'number', 'activeIncidents is calculated number');
    assert(typeof dashRes.body.data.availableHospitalBeds === 'number', 'availableHospitalBeds is calculated number');
    assert(dashRes.body.data.availableHospitalBeds === 45, 'availableHospitalBeds correctly aggregated from DB (45)');
    assert(dashRes.body.data.activeTeams >= 1, 'activeTeams calculated from DB');

    // ----------------------------------------------------
    // TEST SUITE 8: CENTRALIZED ERROR & 404 HANDLING
    // ----------------------------------------------------
    console.log('\n--- Test Suite 8: Error Handling & 404 Contract ---');

    // 8.1 404 Handler
    const notFoundRes = await request.get('/api/v1/non-existent-route-endpoint');
    assert(notFoundRes.status === 404, 'Unknown route returns 404');
    assert(notFoundRes.body.success === false, '404 has success: false');
    assert(notFoundRes.body.error.code === 'ROUTE_NOT_FOUND', '404 has code ROUTE_NOT_FOUND');

    // 8.2 Invalid ObjectId
    const invalidIdRes = await request.get('/api/v1/incidents/not-a-valid-id-12345');
    assert(invalidIdRes.status === 404, 'Non-existent incident returns 404 Not Found');

    // 8.3 Missing Required Fields
    const missingFieldRes = await request.post('/api/v1/teams').send({});
    assert(missingFieldRes.status === 400, 'Missing fields in team creation returns 400 Bad Request');

    // ----------------------------------------------------
    // TEST SUITE 9: CORS & SECURITY HEADERS
    // ----------------------------------------------------
    console.log('\n--- Test Suite 9: CORS and Security Headers ---');
    const corsRes = await request
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    assert(corsRes.headers['access-control-allow-origin'] === 'http://localhost:5173', 'CORS allows configured React origin');
    assert(corsRes.headers['x-dns-prefetch-control'] !== undefined, 'Helmet security headers applied');

    console.log('\n====================================================');
    console.log(` Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    await disconnectDatabase();
    await mongod.stop();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

runAllTests();
