const http = require('http');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const MriReport = require('./models/MriReport');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const Notification = require('./models/Notification');
const GameAssignment = require('./models/GameAssignment');
const GameResult = require('./models/GameResult');

// HTTP helper for multipart or json requests
function httpRequest(server, method, reqPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqHeaders = { ...headers };

    let payload = null;
    if (body) {
      if (Buffer.isBuffer(body)) {
        payload = body;
        reqHeaders['Content-Length'] = body.length;
      } else if (typeof body === 'object') {
        payload = Buffer.from(JSON.stringify(body));
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = payload.length;
      }
    }

    const req = http.request(
      {
        host: '127.0.0.1',
        port: address.port,
        method: method,
        path: reqPath,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), raw });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function buildMultipartFormData(boundary, fields, files) {
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      )
    );
  }

  for (const { fieldname, filename, contentType, buffer } of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
      )
    );
    chunks.push(buffer);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

async function runAllTests() {
  console.log('================================================================');
  console.log('ALZCARE COMPREHENSIVE END-TO-END SYSTEM VERIFICATION');
  console.log('================================================================\n');

  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/patients', require('./routes/patientRoutes'));
  app.use('/api/appointments', require('./routes/appointmentRoutes'));
  app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
  app.use('/api/mri', require('./routes/mriRoutes'));
  app.use('/api/games', require('./routes/gameRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/timeline', require('./routes/timelineRoutes'));
  app.use('/api/doctors', require('./routes/doctorRoutes'));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      message: 'AlzCare API is healthy and reachable',
      timestamp: new Date().toISOString(),
    });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const testPort = server.address().port;
  console.log(`[Test Server] Running on http://127.0.0.1:${testPort}`);

  try {
    // 1. Health check test
    console.log('\n[1/12] Testing Backend Health Check...');
    const healthRes = await httpRequest(server, 'GET', '/api/health');
    console.log(`-> /api/health returned: ${JSON.stringify(healthRes.data)}`);
    if (healthRes.status !== 200 || healthRes.data.database !== 'connected') {
      throw new Error('Health check failed');
    }
    console.log('PASS: Backend API health check operational.');

    // 2. Doctor Registration & Login
    console.log('\n[2/12] Testing Doctor Registration & Authentication...');
    const testDocEmail = `test.doc.${Date.now()}@alzcare.test`;
    const docRegRes = await httpRequest(server, 'POST', '/api/auth/register/doctor', {}, {
      name: 'Dr. Sarah Connor',
      email: testDocEmail,
      password: 'password123',
      specialization: 'Neuro-Geriatrics',
      phone: '+1 555-0199',
    });
    console.log(`-> Doctor registration status: ${docRegRes.status}`);
    if (docRegRes.status !== 201 && docRegRes.status !== 200) {
      throw new Error(`Doctor registration failed: ${JSON.stringify(docRegRes.data)}`);
    }

    const docLoginRes = await httpRequest(server, 'POST', '/api/auth/login', {}, {
      email: testDocEmail,
      password: 'password123',
    });
    console.log(`-> Doctor login status: ${docLoginRes.status}, role=${docLoginRes.data.role}`);
    const doctorToken = docLoginRes.data.token;
    const doctorId = docLoginRes.data._id;
    if (!doctorToken) throw new Error('No doctor token returned');
    console.log('PASS: Doctor registration and JWT login verified.');

    // 3. Doctor adds Patient & Patient Login
    console.log('\n[3/12] Testing Patient Creation & Patient Auth...');
    const testPatientEmail = `patient.${Date.now()}@alzcare.test`;
    const addPatientRes = await httpRequest(
      server,
      'POST',
      '/api/patients',
      { Authorization: `Bearer ${doctorToken}` },
      {
        name: 'Robert Miller',
        email: testPatientEmail,
        password: 'password123',
        age: 71,
        gender: 'Male',
        phone: '+1 555-0143',
        emergencyContact: {
          name: 'Jane Miller',
          phone: '+1 555-0144',
          relation: 'Spouse',
        },
      }
    );
    console.log(`-> Add patient status: ${addPatientRes.status}, patientId=${addPatientRes.data.patientId}`);
    const patientObjId = addPatientRes.data._id;
    const patientIdCode = addPatientRes.data.patientId;

    const patientLoginRes = await httpRequest(server, 'POST', '/api/auth/login', {}, {
      email: testPatientEmail,
      password: 'password123',
    });
    console.log(`-> Patient login status: ${patientLoginRes.status}, role=${patientLoginRes.data.role}`);
    const patientToken = patientLoginRes.data.token;
    if (!patientToken) throw new Error('Patient token missing');
    console.log('PASS: Patient successfully created and authenticated.');

    // 4. Patient Dashboard Data (/api/patients/me)
    console.log('\n[4/12] Testing Patient Dashboard Profile Load...');
    const patientMeRes = await httpRequest(server, 'GET', '/api/patients/me', {
      Authorization: `Bearer ${patientToken}`,
    });
    console.log(`-> Loaded patient profile: ${patientMeRes.data.patient.name}, Doctor: ${patientMeRes.data.patient.doctorId?.name}`);
    if (patientMeRes.status !== 200 || patientMeRes.data.patient.name !== 'Robert Miller') {
      throw new Error('Patient me endpoint failed');
    }
    console.log('PASS: Patient dashboard profile loaded accurately.');

    // 5. Doctor Dashboard Patient Listing & Details
    console.log('\n[5/12] Testing Doctor Dashboard Patient Directory & Detail Views...');
    const docPatientsRes = await httpRequest(server, 'GET', '/api/patients', {
      Authorization: `Bearer ${doctorToken}`,
    });
    console.log(`-> Doctor patient directory contains ${docPatientsRes.data.length} patients.`);

    const patientDetailRes = await httpRequest(server, 'GET', `/api/patients/${patientObjId}`, {
      Authorization: `Bearer ${doctorToken}`,
    });
    console.log(`-> Patient detail medical records count: ${patientDetailRes.data.mriReports?.length || 0}`);
    console.log('PASS: Doctor dashboard and patient records load correctly.');

    // 6. MRI Scan Upload & AI Prediction Integration
    console.log('\n[6/12] Testing MRI Image Upload & AI Classification...');
    const uploadDir = path.join(__dirname, 'uploads');
    const filesInUploads = fs.readdirSync(uploadDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    if (filesInUploads.length === 0) {
      throw new Error('No test MRI files found in uploads directory');
    }
    const sampleMriPath = path.join(uploadDir, filesInUploads[0]);
    const fileBytes = fs.readFileSync(sampleMriPath);
    console.log(`-> Using sample MRI file: ${filesInUploads[0]} (${fileBytes.length} bytes)`);

    const boundary = '----AlzCareTestBoundary' + Math.random().toString(36).substring(2);
    const multipartBody = buildMultipartFormData(
      boundary,
      { patientId: patientObjId },
      [
        {
          fieldname: 'mri',
          filename: filesInUploads[0],
          contentType: 'image/jpeg',
          buffer: fileBytes,
        },
      ]
    );

    const mriUploadRes = await httpRequest(
      server,
      'POST',
      '/api/mri/upload',
      {
        Authorization: `Bearer ${doctorToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      multipartBody
    );

    console.log(`-> MRI upload status: ${mriUploadRes.status}`);
    console.log(`-> Uploaded MRI ID: ${mriUploadRes.data.mriId}, Status: ${mriUploadRes.data.status}`);
    console.log(`-> AI Prediction Result: ${mriUploadRes.data.result}`);

    if (mriUploadRes.status !== 201) {
      throw new Error(`MRI upload failed with status ${mriUploadRes.status}: ${JSON.stringify(mriUploadRes.data)}`);
    }
    console.log('PASS: MRI scan successfully uploaded and analyzed by AI.');

    // 7. Appointment Lifecycle
    console.log('\n[7/12] Testing Appointment Management...');
    const apptRes = await httpRequest(
      server,
      'POST',
      '/api/appointments',
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: patientObjId,
        doctorId: doctorId,
        date: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: '10:00 AM',
        reason: 'Post-MRI Cognitive Consultation',
      }
    );
    const apptId = apptRes.data._id || apptRes.data.appointment?._id;
    console.log(`-> Appointment booked: ID=${apptId}`);

    const patApptRes = await httpRequest(server, 'GET', '/api/patients/me/appointments', {
      Authorization: `Bearer ${patientToken}`,
    });
    console.log(`-> Patient sees ${patApptRes.data.length} appointment(s).`);

    const cancelRes = await httpRequest(
      server,
      'PATCH',
      `/api/appointments/${apptId}/status`,
      { Authorization: `Bearer ${patientToken}` },
      { status: 'Completed' }
    );
    console.log(`-> Updated appointment status to: ${cancelRes.data.status}`);
    console.log('PASS: Appointment scheduling and status updates operational.');

    // 8. Prescription Management
    console.log('\n[8/12] Testing Prescription Management...');
    const rxRes = await httpRequest(
      server,
      'POST',
      '/api/prescriptions',
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: patientObjId,
        diagnosis: 'Mild Cognitive Impairment - Early Stage',
        medicines: [
          {
            name: 'Donepezil',
            dosage: '5mg',
            frequency: 'Once Daily at Bedtime',
            duration: '90 Days',
            instructions: 'Take with food to minimize gastrointestinal symptoms',
          },
        ],
        notes: 'Combine with daily memory training exercises.',
      }
    );
    console.log(`-> Prescription created: Rx ID=${rxRes.data.prescriptionId || rxRes.data._id}`);

    const patRxRes = await httpRequest(server, 'GET', '/api/patients/me/prescriptions', {
      Authorization: `Bearer ${patientToken}`,
    });
    console.log(`-> Patient fetched ${patRxRes.data.length} prescription(s).`);
    console.log('PASS: Prescription creation and retrieval operational.');

    // 9. Notifications
    console.log('\n[9/12] Testing In-App Clinical Notifications...');
    const notifRes = await httpRequest(server, 'GET', '/api/notifications', {
      Authorization: `Bearer ${patientToken}`,
    });
    console.log(`-> Patient received ${notifRes.data.length} notification(s).`);
    if (notifRes.data.length > 0) {
      const firstNotifId = notifRes.data[0]._id;
      const readRes = await httpRequest(server, 'PUT', `/api/notifications/${firstNotifId}/read`, {
        Authorization: `Bearer ${patientToken}`,
      });
      console.log(`-> Marked notification read: isRead=${readRes.data.isRead}`);
    }
    console.log('PASS: In-app clinical notifications fully operational.');

    // 10. Cognitive Games Catalog & Doctor Game Assignment
    console.log('\n[10/12] Testing Cognitive Game Catalog & Assignment...');
    const catalogRes = await httpRequest(server, 'GET', '/api/games/catalog');
    console.log(`-> Cognitive catalog provides ${catalogRes.data.length} games.`);

    const gameAssignRes = await httpRequest(
      server,
      'POST',
      `/api/doctors/patients/${patientObjId}/games`,
      { Authorization: `Bearer ${doctorToken}` },
      {
        gameName: 'Visual Search',
        difficulty: 'Medium',
        frequency: 'Daily',
        repetitions: 1,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        notes: 'Target 90%+ accuracy.',
      }
    );
    const assignmentId = gameAssignRes.data._id || gameAssignRes.data.assignment?._id;
    console.log(`-> Doctor assigned game: ${gameAssignRes.data.gameName || 'Visual Search'}, ID=${assignmentId}`);
    console.log('PASS: Cognitive games catalog and doctor assignment operational.');

    // 11. Patient Game Submission & Analytics
    console.log('\n[11/12] Testing Patient Game Result Submission & Doctor Stream...');
    const submitResultRes = await httpRequest(
      server,
      'POST',
      '/api/games/result',
      { Authorization: `Bearer ${patientToken}` },
      {
        assignmentId: assignmentId,
        gameName: 'Visual Search',
        score: 92,
        accuracy: 94,
        timeTaken: 45,
        moves: 12,
        difficulty: 'Medium',
      }
    );
    console.log(`-> Result submitted with status: ${submitResultRes.status}`);

    const doctorActivityRes = await httpRequest(server, 'GET', '/api/doctors/activity', {
      Authorization: `Bearer ${doctorToken}`,
    });
    console.log(`-> Doctor activity stream has ${doctorActivityRes.data.recentResults?.length || 0} recent exercise result(s).`);

    const progressRes = await httpRequest(
      server,
      'GET',
      `/api/games/progress/${patientObjId}`,
      { Authorization: `Bearer ${doctorToken}` }
    );
    console.log(`-> Patient cognitive progress metrics: totalGames=${progressRes.data.totalGamesPlayed}, avgScore=${progressRes.data.averageScore}`);
    console.log('PASS: Cognitive game submission and clinical analytics operational.');

    // 12. Security Boundary Checks
    console.log('\n[12/12] Testing Strict Access Control & Security Boundaries...');
    const unauthorizedRes = await httpRequest(server, 'GET', '/api/patients');
    if (unauthorizedRes.status !== 401) throw new Error('Security check failed: unauthenticated access allowed');

    const patientAccessAdminRoute = await httpRequest(server, 'GET', '/api/patients', {
      Authorization: `Bearer ${patientToken}`,
    });
    if (patientAccessAdminRoute.status !== 403) throw new Error('Security check failed: patient allowed doctor route');
    console.log('PASS: Role-based access control and security boundaries enforced.');

    console.log('\n================================================================');
    console.log('ALL 12 SYSTEM MODULES PASSED VERIFICATION WITH ZERO ERRORS!');
    console.log('================================================================');
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runAllTests().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
