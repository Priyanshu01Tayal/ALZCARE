const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const GameAssignment = require('./models/GameAssignment');
const GameResult = require('./models/GameResult');
const Appointment = require('./models/Appointment');

const express = require('express');
const cors = require('cors');

// Helper to make HTTP requests
const request = (appServer, method, reqPath, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const address = appServer.address();
    const port = address.port;

    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        host: '127.0.0.1',
        port: port,
        method: method,
        path: reqPath,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

async function runEcosystemVerification() {
  console.log('================================================================');
  console.log('ALZCARE REAL TWO-WAY INTEGRATION & SECURITY VERIFICATION SUITE');
  console.log('================================================================\n');

  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/patients', require('./routes/patientRoutes'));
  app.use('/api/appointments', require('./routes/appointmentRoutes'));
  app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
  app.use('/api/mri', require('./routes/mriRoutes'));
  app.use('/api/games', require('./routes/gameRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/timeline', require('./routes/timelineRoutes'));
  app.use('/api/doctors', require('./routes/doctorRoutes'));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const testPort = server.address().port;
  console.log(`[Ecosystem Server] Listening on port ${testPort}`);

  try {
    // Ensure primary doctor exists
    let doctor = await Doctor.findOne();
    if (!doctor) {
      doctor = await Doctor.create({
        name: 'Dr. Jane Foster',
        email: 'dr.foster@alzcare.com',
        password: 'password123',
        specialization: 'Cognitive Neurology',
        phone: '+1 555-0199',
      });
    }

    // Ensure Patient A exists and has known password
    let patientA = await Patient.findOne({ email: 'lucky123@gmail.com' });
    if (!patientA) {
      patientA = await Patient.create({
        name: 'Rahul Kumar',
        email: 'lucky123@gmail.com',
        password: 'password123',
        age: 68,
        gender: 'Male',
        patientId: 'PAT-0001',
        phone: '+1 555-0143',
        doctorId: doctor._id,
        emergencyContact: {
          name: 'Priya Kumar',
          phone: '+1 555-0144',
          relation: 'Daughter',
        },
      });
    } else {
      patientA.doctorId = doctor._id;
      patientA.phone = patientA.phone || '+1 555-0143';
      patientA.password = 'password123';
      patientA.emergencyContact = patientA.emergencyContact || {
        name: 'Priya Kumar',
        phone: '+1 555-0144',
        relation: 'Daughter',
      };
      await patientA.save();
    }

    // Ensure Patient B exists for Security Cross-Tenant testing
    let patientB = await Patient.findOne({ email: 'patient.b@alzcare.test' });
    if (!patientB) {
      patientB = await Patient.create({
        name: 'Anita Sharma',
        email: 'patient.b@alzcare.test',
        password: 'password123',
        age: 72,
        gender: 'Female',
        patientId: 'PAT-0002',
        phone: '+1 555-0198',
        doctorId: doctor._id,
      });
    }

    // Generate tokens
    const doctorToken = jwt.sign(
      { id: doctor._id, role: 'Doctor' },
      process.env.JWT_SECRET || 'alzcare_secret_key_2026',
      { expiresIn: '30d' }
    );

    const patientAToken = jwt.sign(
      { id: patientA._id, role: 'Patient' },
      process.env.JWT_SECRET || 'alzcare_secret_key_2026',
      { expiresIn: '30d' }
    );

    const patientBToken = jwt.sign(
      { id: patientB._id, role: 'Patient' },
      process.env.JWT_SECRET || 'alzcare_secret_key_2026',
      { expiresIn: '30d' }
    );

    // =====================================================================
    // TEST 1 — LOGIN: Patient logs into mobile app. Verify patient data loaded from backend.
    // =====================================================================
    console.log('\n--- TEST 1: PATIENT MOBILE LOGIN & PROFILE LOAD ---');
    const loginRes = await request(
      server,
      'POST',
      '/api/auth/login',
      {},
      { email: 'lucky123@gmail.com', password: 'password123' }
    );
    console.log(`[TEST 1] Auth endpoint status: ${loginRes.status}`);
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed with response: ${JSON.stringify(loginRes.data)}`);
    }

    const patientProfileRes = await request(
      server,
      'GET',
      '/api/patients/me',
      { Authorization: `Bearer ${loginRes.data.token}` }
    );
    console.log(`[TEST 1] Loaded Profile: ${patientProfileRes.data.patient.name}, ID: ${patientProfileRes.data.patient.patientId}, Doctor: ${patientProfileRes.data.patient.doctorId?.name || 'Assigned'}`);
    if (!patientProfileRes.data.patient.name || patientProfileRes.data.patient.email !== 'lucky123@gmail.com') {
      throw new Error('TEST 1 FAILED: Patient data not loaded accurately from backend.');
    }
    console.log('✓ TEST 1 PASSED: Patient logs in, token issued, profile correctly fetched from database.');

    // =====================================================================
    // TEST 2 — DOCTOR GAME ASSIGNMENT: Doctor assigns a game. Verify database. Open mobile app. Verify game appears.
    // =====================================================================
    console.log('\n--- TEST 2: DOCTOR GAME ASSIGNMENT -> BACKEND -> PATIENT MOBILE APP ---');
    const assignmentPayload = {
      gameName: 'Memory Match',
      difficulty: 'Medium',
      frequency: 'Daily',
      repetitions: 2,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Practice memory card pairs for 5 minutes each morning.',
    };

    const docAssignRes = await request(
      server,
      'POST',
      `/api/doctors/patients/${patientA._id}/games`,
      { Authorization: `Bearer ${doctorToken}` },
      assignmentPayload
    );
    console.log(`[TEST 2] Doctor assigned game status: ${docAssignRes.status}`);
    const assignmentId = docAssignRes.data._id || docAssignRes.data.assignment?._id;
    if (!assignmentId) throw new Error('TEST 2 FAILED: Assignment ID not returned.');

    // Verify directly in MongoDB
    const assignmentInDb = await GameAssignment.findById(assignmentId);
    if (!assignmentInDb || assignmentInDb.gameName !== 'Memory Match') {
      throw new Error('TEST 2 FAILED: Assignment record not present in MongoDB.');
    }
    console.log(`[TEST 2] MongoDB Record Verified: ID=${assignmentInDb._id}, Status=${assignmentInDb.status}`);

    // Mobile App fetches games
    const mobileGamesRes = await request(
      server,
      'GET',
      '/api/patients/me/games',
      { Authorization: `Bearer ${patientAToken}` }
    );
    const assignedMatch = mobileGamesRes.data.games.find(g => g.gameName === 'Memory Match');
    if (!assignedMatch || !assignedMatch.isAssigned) {
      throw new Error('TEST 2 FAILED: Assigned game does not appear in Mobile App list.');
    }
    console.log(`[TEST 2] Mobile App Verified: "${assignedMatch.gameName}" isAssigned=${assignedMatch.isAssigned}, Status=${assignedMatch.assignmentStatus}`);
    console.log('✓ TEST 2 PASSED: Doctor assigns game -> stored in DB -> Mobile app retrieves assigned game.');

    // =====================================================================
    // TEST 3 — GAME RESULT: Patient plays game. Submit result. Verify database. Open Doctor Dashboard. Verify doctor sees result.
    // =====================================================================
    console.log('\n--- TEST 3: PATIENT PLAYS GAME -> SUBMITS RESULT -> DOCTOR DASHBOARD SEES IT ---');
    const resultPayload = {
      assignmentId: assignmentId.toString(),
      gameName: 'Memory Match',
      score: 95,
      accuracy: 96,
      timeTaken: 38,
      moves: 10,
      difficulty: 'Medium',
    };

    const submitRes = await request(
      server,
      'POST',
      '/api/games/result',
      { Authorization: `Bearer ${patientAToken}` },
      resultPayload
    );
    console.log(`[TEST 3] Mobile submitted result status: ${submitRes.status}`);
    if (submitRes.status !== 201 && submitRes.status !== 200) {
      throw new Error(`TEST 3 FAILED: Game result submission failed with status ${submitRes.status}`);
    }

    // Verify MongoDB
    const resultInDb = await GameResult.findOne({
      patientId: patientA._id,
      gameName: 'Memory Match',
      score: 95,
    });
    if (!resultInDb) throw new Error('TEST 3 FAILED: GameResult record not found in MongoDB.');
    console.log(`[TEST 3] MongoDB Result Verified: Score=${resultInDb.score}, Accuracy=${resultInDb.accuracy}%`);

    // Doctor Dashboard fetches patient details & mobile activity
    const docPatientRes = await request(
      server,
      'GET',
      `/api/patients/${patientA._id}`,
      { Authorization: `Bearer ${doctorToken}` }
    );
    const mobileAct = docPatientRes.data.mobileActivity;
    console.log(`[TEST 3] Doctor Dashboard Patient Mobile Activity:`, mobileAct);
    const lastGameName = typeof mobileAct.lastGame === 'object' ? mobileAct.lastGame?.gameName : mobileAct.lastGame;
    if (!mobileAct || lastGameName !== 'Memory Match' || mobileAct.score !== 95) {
      throw new Error('TEST 3 FAILED: Doctor Dashboard mobile activity does not show latest score and game.');
    }

    // Doctor Dashboard live exercises stream
    const docActivityStream = await request(
      server,
      'GET',
      '/api/doctors/activity',
      { Authorization: `Bearer ${doctorToken}` }
    );
    const streamItem = docActivityStream.data.recentResults.find(r => r._id.toString() === resultInDb._id.toString());
    if (!streamItem) throw new Error('TEST 3 FAILED: Doctor activity stream did not contain the submitted result.');
    console.log(`[TEST 3] Doctor Live Stream Verified: Patient "${streamItem.patientId?.name}", Score=${streamItem.score}`);
    console.log('✓ TEST 3 PASSED: Patient completes game -> saved to DB -> Doctor Dashboard reflects score & activity.');

    // =====================================================================
    // TEST 4 — APPOINTMENT: Doctor creates appointment. Verify mobile shows it. Doctor changes appointment. Verify mobile updates.
    // =====================================================================
    console.log('\n--- TEST 4: DOCTOR APPOINTMENT CREATION & MODIFICATION SYNC ---');
    const newAppRes = await request(
      server,
      'POST',
      '/api/appointments',
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: patientA._id,
        doctorId: doctor._id,
        date: '2026-10-15',
        timeSlot: '11:00 AM',
        status: 'Scheduled',
        reason: 'Monthly Cognitive Health Evaluation',
        notes: 'Bring previous MRI scans and prescription logs.',
      }
    );
    console.log(`[TEST 4] Appointment created status: ${newAppRes.status}`);
    const createdAppId = newAppRes.data._id || newAppRes.data.appointment?._id;

    // Mobile app retrieves appointments
    let mobileAppsRes = await request(
      server,
      'GET',
      '/api/patients/me/appointments',
      { Authorization: `Bearer ${patientAToken}` }
    );
    let appInMobile = mobileAppsRes.data.find(a => a._id.toString() === createdAppId.toString());
    if (!appInMobile || appInMobile.timeSlot !== '11:00 AM' || appInMobile.reason !== 'Monthly Cognitive Health Evaluation') {
      throw new Error('TEST 4 FAILED: Appointment not visible in Patient Mobile App.');
    }
    console.log(`[TEST 4] Patient Mobile App received appointment: ${appInMobile.date} at ${appInMobile.timeSlot}`);

    // Doctor changes appointment (reschedule to 02:30 PM and change notes)
    const updateAppRes = await request(
      server,
      'PUT',
      `/api/appointments/${createdAppId}`,
      { Authorization: `Bearer ${doctorToken}` },
      {
        timeSlot: '02:30 PM',
        notes: 'Rescheduled to afternoon per patient request. Fasting not required.',
      }
    );
    console.log(`[TEST 4] Doctor updated appointment status: ${updateAppRes.status}`);

    // Mobile app refetches appointments
    mobileAppsRes = await request(
      server,
      'GET',
      '/api/patients/me/appointments',
      { Authorization: `Bearer ${patientAToken}` }
    );
    appInMobile = mobileAppsRes.data.find(a => a._id.toString() === createdAppId.toString());
    if (!appInMobile || appInMobile.timeSlot !== '02:30 PM' || !appInMobile.notes.includes('Rescheduled to afternoon')) {
      throw new Error('TEST 4 FAILED: Doctor modification not reflected in Mobile App.');
    }
    console.log(`[TEST 4] Patient Mobile App reflects updated appointment: TimeSlot=${appInMobile.timeSlot}, Notes="${appInMobile.notes}"`);
    console.log('✓ TEST 4 PASSED: Doctor creates & modifies appointment -> Mobile App reflects changes.');

    // =====================================================================
    // TEST 5 — PATIENT ACTION: Patient performs an allowed action. Verify backend/DB updated. Doctor dashboard shows update.
    // =====================================================================
    console.log('\n--- TEST 5: PATIENT ACTION (CANCELLATION & PROFILE EDIT) -> DOCTOR DASHBOARD ---');
    // Patient cancels the appointment from Mobile App
    const patientCancelRes = await request(
      server,
      'PATCH',
      `/api/appointments/${createdAppId}/status`,
      { Authorization: `Bearer ${patientAToken}` },
      { status: 'Cancelled' }
    );
    console.log(`[TEST 5] Patient cancelled appointment status: ${patientCancelRes.status}`);
    if (patientCancelRes.status !== 200) {
      throw new Error('TEST 5 FAILED: Patient appointment status update failed.');
    }

    // Verify Doctor fetches appointments and sees Cancelled status
    const docAppointmentsRes = await request(
      server,
      'GET',
      `/api/appointments/patient/${patientA._id}`,
      { Authorization: `Bearer ${doctorToken}` }
    );
    const docAppMatch = docAppointmentsRes.data.find(a => a._id.toString() === createdAppId.toString());
    if (!docAppMatch || docAppMatch.status !== 'Cancelled') {
      throw new Error('TEST 5 FAILED: Doctor does not see Cancelled appointment status.');
    }
    console.log(`[TEST 5] Doctor Dashboard confirmed appointment status is now: "${docAppMatch.status}"`);

    // Patient updates profile contact from Mobile App
    const profileUpdateRes = await request(
      server,
      'PUT',
      '/api/patients/me',
      { Authorization: `Bearer ${patientAToken}` },
      {
        phone: '+1 555-9988',
        emergencyContact: {
          name: 'Priya Kumar',
          phone: '+1 555-9977',
          relation: 'Daughter',
        },
      }
    );
    console.log(`[TEST 5] Patient profile update status: ${profileUpdateRes.status}`);

    // Verify Doctor Dashboard retrieves updated patient phone
    const docUpdatedPatientRes = await request(
      server,
      'GET',
      `/api/patients/${patientA._id}`,
      { Authorization: `Bearer ${doctorToken}` }
    );
    if (docUpdatedPatientRes.data.patient.phone !== '+1 555-9988') {
      throw new Error('TEST 5 FAILED: Doctor Dashboard did not receive updated patient contact info.');
    }
    console.log(`[TEST 5] Doctor Dashboard verified updated phone: ${docUpdatedPatientRes.data.patient.phone}`);
    console.log('✓ TEST 5 PASSED: Patient actions (appointment cancellation & profile update) synchronized to Doctor Dashboard.');

    // =====================================================================
    // TEST 6 — SECURITY: Attempt to access another patient's data. Verify rejection.
    // =====================================================================
    console.log('\n--- TEST 6: CROSS-PATIENT ACCESS SECURITY VERIFICATION ---');
    // Patient A attempts to view Patient B's data via doctor route
    const crossAccessDocRoute = await request(
      server,
      'GET',
      `/api/patients/${patientB._id}`,
      { Authorization: `Bearer ${patientAToken}` }
    );
    console.log(`[TEST 6] Patient A accessing Doctor route /api/patients/${patientB._id}: Status ${crossAccessDocRoute.status}`);
    if (crossAccessDocRoute.status !== 403 && crossAccessDocRoute.status !== 401) {
      throw new Error('TEST 6 FAILED: Patient was able to access doctor route!');
    }

    // Patient A attempts to view Doctor's patient list
    const patientDoctorListAccess = await request(
      server,
      'GET',
      '/api/patients',
      { Authorization: `Bearer ${patientAToken}` }
    );
    console.log(`[TEST 6] Patient A accessing /api/patients: Status ${patientDoctorListAccess.status}`);
    if (patientDoctorListAccess.status !== 403 && patientDoctorListAccess.status !== 401) {
      throw new Error('TEST 6 FAILED: Patient was able to list all patients!');
    }

    // Unauthenticated request to /api/patients/me
    const unauthenticatedRes = await request(server, 'GET', '/api/patients/me');
    console.log(`[TEST 6] Unauthenticated /api/patients/me: Status ${unauthenticatedRes.status}`);
    if (unauthenticatedRes.status !== 401) {
      throw new Error('TEST 6 FAILED: Unauthenticated request was not rejected with 401!');
    }

    console.log('✓ TEST 6 PASSED: Backend strictly enforces role-based access control and token-derived identities.');

    console.log('\n================================================================');
    console.log('ALL 6 ECOSYSTEM TESTS PASSED PERFECTLY AGAINST REAL DATABASE!');
    console.log('================================================================');
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runEcosystemVerification().catch((err) => {
  console.error('\nEcosystem Verification Failed:', err);
  process.exit(1);
});
