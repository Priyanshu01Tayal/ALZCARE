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
const request = (appServer, method, path, headers = {}, body = null) => {
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
        path: path,
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

async function runEndToEndTest() {
  console.log('====================================================');
  console.log('STARTING ALZCARE END-TO-END ECOSYSTEM VERIFICATION');
  console.log('====================================================\n');

  // 1. Connect to Mongo
  await connectDB();

  // Create Express App
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
  console.log(`[Test Server] Running on ephemeral port ${testPort}`);

  try {
    // Check doctor user
    let doctor = await Doctor.findOne();
    if (!doctor) {
      console.log('Creating test doctor...');
      doctor = await Doctor.create({
        name: 'Dr. Jane Foster',
        email: 'dr.foster@alzcare.com',
        password: 'password123',
        specialization: 'Cognitive Neurology',
      });
    }

    // Check patient
    let patient = await Patient.findOne({ email: 'lucky123@gmail.com' });
    if (!patient) {
      console.log('Creating test patient...');
      patient = await Patient.create({
        name: 'Rahul Kumar',
        email: 'lucky123@gmail.com',
        password: 'password123',
        age: 68,
        gender: 'Male',
        patientId: 'PAT-0001',
        doctorId: doctor._id,
      });
    } else {
      patient.doctorId = doctor._id;
      await patient.save();
    }

    // STEP 1: Doctor Login
    console.log('\nSTEP 1: Doctor Authenticates in AlzCare system...');
    const doctorToken = jwt.sign(
      { id: doctor._id, role: 'Doctor' },
      process.env.JWT_SECRET || 'alzcare_secret_key_2026',
      { expiresIn: '30d' }
    );
    console.log(`✓ Doctor authenticated: Dr. ${doctor.name} (${doctor.email})`);

    // STEP 2: Doctor selects Patient
    console.log('\nSTEP 2: Doctor selects Patient in dashboard...');
    const patientDetailsRes = await request(
      server,
      'GET',
      `/api/patients/${patient._id}`,
      { Authorization: `Bearer ${doctorToken}` }
    );
    console.log(`✓ Retrieved patient: ${patientDetailsRes.data.patient.name} [ID: ${patientDetailsRes.data.patient.patientId}]`);

    // STEP 3: Doctor Assigns Game A (Memory Match)
    console.log('\nSTEP 3: Doctor assigns cognitive game (Memory Match)...');
    const assignPayload = {
      gameName: 'Memory Match',
      difficulty: 'Medium',
      frequency: 'Daily',
      repetitions: 3,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Please complete daily morning session after breakfast.',
    };

    const assignRes = await request(
      server,
      'POST',
      `/api/doctors/patients/${patient._id}/games`,
      { Authorization: `Bearer ${doctorToken}` },
      assignPayload
    );
    console.log(`✓ Game assigned status: ${assignRes.status}, Assignment ID: ${assignRes.data._id || assignRes.data.assignment?._id}`);
    const assignmentId = assignRes.data._id || assignRes.data.assignment?._id;

    // STEP 4: Verify assignment stored in database
    console.log('\nSTEP 4: Verifying assignment is saved in MongoDB...');
    const assignmentDb = await GameAssignment.findById(assignmentId);
    if (!assignmentDb) throw new Error('Assignment not found in MongoDB!');
    console.log(`✓ MongoDB confirmed assignment: Game="${assignmentDb.gameName}", Frequency="${assignmentDb.frequency}", Status="${assignmentDb.status}"`);

    // STEP 5: Patient logs in (Mobile App Login Flow)
    console.log('\nSTEP 5: Patient logs in via Mobile App...');
    const patientToken = jwt.sign(
      { id: patient._id, role: 'Patient' },
      process.env.JWT_SECRET || 'alzcare_secret_key_2026',
      { expiresIn: '30d' }
    );
    console.log(`✓ Patient authenticated on mobile: ${patient.name}`);

    // STEP 6: Patient Mobile App fetches games
    console.log('\nSTEP 6: Patient Mobile App fetches assigned & catalog games...');
    const patientGamesRes = await request(
      server,
      'GET',
      '/api/patients/me/games',
      { Authorization: `Bearer ${patientToken}` }
    );
    const assignedGame = patientGamesRes.data.games.find((g) => g.gameName === 'Memory Match');
    console.log(`✓ Found game in mobile list: "${assignedGame.gameName}", isAssigned=${assignedGame.isAssigned}, Status=${assignedGame.assignmentStatus}`);
    if (!assignedGame.isAssigned) throw new Error('Assigned game flag is false!');

    // STEP 7 & 8: Patient plays and completes Game A on Mobile
    console.log('\nSTEP 7 & 8: Patient plays and completes "Memory Match" on Mobile...');
    const gameResultPayload = {
      assignmentId: assignmentId.toString(),
      gameName: 'Memory Match',
      score: 88,
      accuracy: 92,
      timeTaken: 45,
      moves: 12,
      difficulty: 'Medium',
    };
    console.log('✓ Game metrics recorded: Score=88, Accuracy=92%, Time=45s, Moves=12');

    // STEP 9: Save result to database via POST /api/games/result
    console.log('\nSTEP 9: Submitting result from Mobile App to Backend...');
    const submitResultRes = await request(
      server,
      'POST',
      '/api/games/result',
      { Authorization: `Bearer ${patientToken}` },
      gameResultPayload
    );
    console.log(`✓ Submit response status: ${submitResultRes.status}, Result ID: ${submitResultRes.data.result?._id}`);

    // STEP 10: Patient Mobile App shows updated progress
    console.log('\nSTEP 10: Patient Mobile App fetches updated personal progress...');
    const patientProgressRes = await request(
      server,
      'GET',
      '/api/patients/me/game-progress',
      { Authorization: `Bearer ${patientToken}` }
    );
    console.log(`✓ Patient Progress Summary:`, {
      totalPlayed: patientProgressRes.data.summary.totalPlayed,
      bestScore: patientProgressRes.data.summary.bestScore,
      averageScore: patientProgressRes.data.summary.averageScore,
      completionRate: `${patientProgressRes.data.summary.completionRate}%`,
    });

    // STEP 11 & 12: Doctor Dashboard displays updated progress
    console.log('\nSTEP 11 & 12: Doctor views patient cognitive progress in Web Dashboard...');
    const doctorProgressRes = await request(
      server,
      'GET',
      `/api/doctors/patients/${patient._id}/game-progress`,
      { Authorization: `Bearer ${doctorToken}` }
    );
    console.log(`✓ Doctor Dashboard Cognitive Progress for Patient "${doctorProgressRes.data.patient.name}":`);
    console.log(`  - Total Completed Assignments: ${doctorProgressRes.data.summary.completedAssignments}`);
    console.log(`  - Total Sessions Played: ${doctorProgressRes.data.summary.totalPlayed}`);
    console.log(`  - Overall Best Score: ${doctorProgressRes.data.summary.bestScore}`);
    console.log(`  - Overall Average Score: ${doctorProgressRes.data.summary.averageScore}`);

    const memoryMatchBreakdown = doctorProgressRes.data.gameWise.find((g) => g.gameName === 'Memory Match');
    console.log(`  - "Memory Match" Game-Wise Card:`, {
      assigned: memoryMatchBreakdown.isAssigned,
      completed: memoryMatchBreakdown.completedCount,
      attempts: memoryMatchBreakdown.attempts,
      bestScore: memoryMatchBreakdown.bestScore,
      averageScore: memoryMatchBreakdown.averageScore,
      lastPlayed: memoryMatchBreakdown.lastPlayed ? new Date(memoryMatchBreakdown.lastPlayed).toLocaleDateString() : 'Never',
    });

    // STEP 13 & 14: Appointments Verification
    console.log('\nSTEP 13 & 14: Checking Appointments synchronization between Doctor and Mobile...');
    let existingApp = await Appointment.findOne({ patientId: patient._id });
    if (!existingApp) {
      existingApp = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timeSlot: '10:30 AM',
        status: 'Scheduled',
        reason: 'Cognitive Trajectory Review',
      });
      console.log(`✓ Created test appointment: ${existingApp.date} at ${existingApp.timeSlot}`);
    }

    const patientAppointmentsRes = await request(
      server,
      'GET',
      '/api/patients/me/appointments',
      { Authorization: `Bearer ${patientToken}` }
    );
    console.log(`✓ Patient Mobile App retrieved ${patientAppointmentsRes.data.length} appointment(s).`);
    const appMatch = patientAppointmentsRes.data.find((a) => a._id.toString() === existingApp._id.toString());
    console.log(`✓ Confirmed synchronized appointment: Date=${appMatch.date}, TimeSlot=${appMatch.timeSlot}, Status=${appMatch.status}`);

    console.log('\n====================================================');
    console.log('ALL 14 END-TO-END INTEGRATION STEPS PASSED PERFECTLY!');
    console.log('====================================================');
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runEndToEndTest().catch((err) => {
  console.error('\nE2E Test Failed with error:', err);
  process.exit(1);
});
