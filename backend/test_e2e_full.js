const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = data ? JSON.parse(data) : {};
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const results = [];
function recordTest(testName, passed, details = '') {
  results.push({ testName, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🚀 ALZCARE FULL SYSTEM END-TO-END VERIFICATION');
  console.log('======================================================\n');

  let doctorToken = null;
  let doctorUser = null;
  let existingPatientToken = null;
  let createdPatientId = null;
  let createdPatientPatientId = null;
  let createdPatientEmail = `test.e2e.${Date.now()}@alzcare.com`;
  let tempPassword = null;
  let newPatientToken = null;
  let assignmentId = null;

  // -------------------------------------------------------------------------
  // TEST A: AUTHENTICATION
  // -------------------------------------------------------------------------
  console.log('--- TEST A: AUTHENTICATION ---');

  // A1: Doctor login
  try {
    const res = await request('POST', '/api/auth/login', {
      email: 'jane.foster@alzcare.com',
      password: 'password123',
    });
    if (res.status === 200 && res.data.token && res.data.role === 'Doctor') {
      doctorToken = res.data.token;
      doctorUser = res.data;
      recordTest('Test A1: Doctor Login', true, `Dr. ${res.data.name}`);
    } else {
      recordTest('Test A1: Doctor Login', false, `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    recordTest('Test A1: Doctor Login', false, err.message);
  }

  // A2: Existing Patient login
  try {
    const res = await request('POST', '/api/auth/login', {
      email: 'lucky123@gmail.com',
      password: 'password123',
    });
    if (res.status === 200 && res.data.token && res.data.role === 'Patient') {
      existingPatientToken = res.data.token;
      recordTest('Test A2: Existing Patient Login', true, `Patient ${res.data.name}`);
    } else {
      recordTest('Test A2: Existing Patient Login', false, `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    recordTest('Test A2: Existing Patient Login', false, err.message);
  }

  // A3: Invalid credentials handling
  try {
    const res = await request('POST', '/api/auth/login', {
      email: 'lucky123@gmail.com',
      password: 'wrongpassword999',
    });
    if (res.status === 401 && res.data.message) {
      recordTest('Test A3: Invalid Credentials Rejection', true, `Status 401: ${res.data.message}`);
    } else {
      recordTest('Test A3: Invalid Credentials Rejection', false, `Expected 401, got ${res.status}`);
    }
  } catch (err) {
    recordTest('Test A3: Invalid Credentials Rejection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST B: PATIENT REGISTRATION WORKFLOW
  // -------------------------------------------------------------------------
  console.log('\n--- TEST B: PATIENT REGISTRATION WORKFLOW ---');

  try {
    const res = await request(
      'POST',
      '/api/patients',
      {
        name: 'Eleanor Vance',
        email: createdPatientEmail,
        age: 69,
        gender: 'Female',
        status: 'Active',
        phone: '+1 555-891-2345',
        emergencyContact: '+1 555-891-9999',
        medicalHistory: 'Early mild cognitive signs, hypertension',
      },
      doctorToken
    );

    if (
      (res.status === 200 || res.status === 201) &&
      res.data.patient &&
      res.data.initialCredentials &&
      res.data.initialCredentials.temporaryPassword
    ) {
      createdPatientId = res.data.patient._id;
      createdPatientPatientId = res.data.patient.patientId;
      tempPassword = res.data.initialCredentials.temporaryPassword;
      recordTest(
        'Test B1: Doctor Registers Patient & Generates Temp Password',
        true,
        `Patient ID: ${res.data.patient.patientId}, Temp Pwd: ${tempPassword}`
      );
    } else {
      recordTest('Test B1: Doctor Registers Patient & Generates Temp Password', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test B1: Doctor Registers Patient & Generates Temp Password', false, err.message);
  }

  // B2: Patient logs in with the generated temporary credentials using EMAIL
  try {
    const res = await request('POST', '/api/auth/login', {
      email: createdPatientEmail,
      password: tempPassword,
    });

    if (res.status === 200 && res.data.token && res.data.mustChangePassword === true) {
      newPatientToken = res.data.token;
      recordTest('Test B2: Patient Logs in with Temporary Credentials (Email)', true, 'Session token issued with mustChangePassword flag');
    } else {
      recordTest('Test B2: Patient Logs in with Temporary Credentials (Email)', false, `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    recordTest('Test B2: Patient Logs in with Temporary Credentials (Email)', false, err.message);
  }

  // B3: Patient logs in with the generated temporary credentials using PATIENT ID (e.g. PAT-XXXX)
  try {
    const res = await request('POST', '/api/auth/login', {
      patientId: createdPatientPatientId,
      password: tempPassword,
    });

    if (res.status === 200 && res.data.token && res.data.patientId === createdPatientPatientId) {
      recordTest('Test B3: Patient Logs in with Patient ID directly (PAT-XXXX)', true, `Authenticated via Patient ID: ${res.data.patientId}`);
    } else {
      recordTest('Test B3: Patient Logs in with Patient ID directly (PAT-XXXX)', false, `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    recordTest('Test B3: Patient Logs in with Patient ID directly (PAT-XXXX)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST C: COGNITIVE GAME SYNCHRONIZATION
  // -------------------------------------------------------------------------
  console.log('\n--- TEST C: COGNITIVE GAME SYNCHRONIZATION ---');

  // C1: Doctor assigns game
  try {
    const res = await request(
      'POST',
      '/api/games/assign',
      {
        patientId: createdPatientId,
        gameName: 'Memory Match',
        difficulty: 'Medium',
        frequency: 'Daily',
        repetitions: 1,
        notes: 'Target visual associative recall 1x daily',
      },
      doctorToken
    );

    if ((res.status === 200 || res.status === 201) && res.data._id) {
      assignmentId = res.data._id;
      recordTest('Test C1: Doctor Assigns Cognitive Game', true, `Assignment ID: ${assignmentId}`);
    } else {
      recordTest('Test C1: Doctor Assigns Cognitive Game', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test C1: Doctor Assigns Cognitive Game', false, err.message);
  }

  // C2: Patient fetches assigned games
  try {
    const res = await request('GET', '/api/patients/me/games', null, newPatientToken);
    const assignedItem = (res.data?.games || []).find((g) => g.gameName === 'Memory Match');

    if (res.status === 200 && assignedItem && assignedItem.isAssigned) {
      recordTest('Test C2: Patient App Synchronizes Assignment', true, `Memory Match status: ${assignedItem.assignmentStatus}`);
    } else {
      recordTest('Test C2: Patient App Synchronizes Assignment', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test C2: Patient App Synchronizes Assignment', false, err.message);
  }

  // C3: Patient submits real game result
  let submittedResultId = null;
  try {
    const res = await request(
      'POST',
      '/api/games/result',
      {
        assignmentId,
        gameName: 'Memory Match',
        difficulty: 'Medium',
        score: 95,
        accuracy: 94,
        timeTaken: 38,
        moves: 14,
      },
      newPatientToken
    );

    if ((res.status === 200 || res.status === 201) && res.data.result) {
      submittedResultId = res.data.result._id;
      recordTest('Test C3: Patient Submits Game Result', true, `Score: 95, Accuracy: 94%, Time: 38s`);
    } else {
      recordTest('Test C3: Patient Submits Game Result', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test C3: Patient Submits Game Result', false, err.message);
  }

  // C4: Deduplication test
  try {
    const res = await request(
      'POST',
      '/api/games/result',
      {
        assignmentId,
        gameName: 'Memory Match',
        difficulty: 'Medium',
        score: 95,
        accuracy: 94,
        timeTaken: 38,
        moves: 14,
      },
      newPatientToken
    );

    if (res.status === 200 && res.data.deduplicated === true) {
      recordTest('Test C4: Submission Deduplication Protection', true, 'Rapid duplicate request safely caught and returned existing record');
    } else {
      recordTest('Test C4: Submission Deduplication Protection', false, `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    recordTest('Test C4: Submission Deduplication Protection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST D: CHARTS & ANALYTICS SYNCHRONIZATION
  // -------------------------------------------------------------------------
  console.log('\n--- TEST D: CHARTS & ANALYTICS SYNCHRONIZATION ---');

  // D1: Doctor fetches progress analytics for the patient
  try {
    const res = await request('GET', `/api/games/progress/${createdPatientId}`, null, doctorToken);

    if (
      res.status === 200 &&
      res.data.summary?.totalPlayed >= 1 &&
      res.data.summary?.bestScore === 95 &&
      res.data.recentResults?.length >= 1
    ) {
      recordTest(
        'Test D1: Doctor Dashboard Progress Analytics Grounded in Real Data',
        true,
        `Total Played: ${res.data.summary.totalPlayed}, Best: ${res.data.summary.bestScore}, Avg Acc: ${res.data.summary.averageAccuracy}%`
      );
    } else {
      recordTest('Test D1: Doctor Dashboard Progress Analytics Grounded in Real Data', false, JSON.stringify(res.data?.summary));
    }
  } catch (err) {
    recordTest('Test D1: Doctor Dashboard Progress Analytics Grounded in Real Data', false, err.message);
  }

  // D2: Doctor activity feed
  try {
    const res = await request('GET', '/api/doctors/activity', null, doctorToken);
    const hasRecent = (res.data?.recentResults || []).some(
      (r) => r.gameName === 'Memory Match' && r.score === 95
    );

    if (res.status === 200 && hasRecent) {
      recordTest('Test D2: Doctor Activity Feed Reactivity', true, 'Doctor activity contains latest game submission');
    } else {
      recordTest('Test D2: Doctor Activity Feed Reactivity', false, JSON.stringify(res.data?.recentResults));
    }
  } catch (err) {
    recordTest('Test D2: Doctor Activity Feed Reactivity', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST E: SECURITY & PASSWORD LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n--- TEST E: SECURITY & PASSWORD LIFECYCLE ---');

  // E1: Unauthenticated rejection
  try {
    const res = await request('GET', '/api/patients/me');
    if (res.status === 401) {
      recordTest('Test E1: Unauthenticated Protected Endpoint Guard', true, 'Status 401 unauthorized');
    } else {
      recordTest('Test E1: Unauthenticated Protected Endpoint Guard', false, `Expected 401, got ${res.status}`);
    }
  } catch (err) {
    recordTest('Test E1: Unauthenticated Protected Endpoint Guard', false, err.message);
  }

  // E2: Patient cross-access protection (patient cannot view another patient's progress)
  try {
    const res = await request('GET', `/api/games/progress/${createdPatientId}`, null, existingPatientToken);
    if (res.status === 403) {
      recordTest('Test E2: Cross-Patient Authorization Enforcement', true, 'Status 403 forbidden');
    } else {
      recordTest('Test E2: Cross-Patient Authorization Enforcement', false, `Expected 403, got ${res.status}`);
    }
  } catch (err) {
    recordTest('Test E2: Cross-Patient Authorization Enforcement', false, err.message);
  }

  // E3: Password change workflow
  const permanentPassword = 'PermanentSecure#2026';
  try {
    const res = await request(
      'PUT',
      '/api/patients/me/password',
      {
        currentPassword: tempPassword,
        newPassword: permanentPassword,
      },
      newPatientToken
    );

    if (res.status === 200 && res.data.message) {
      recordTest('Test E3: Patient Password Change from Temporary to Permanent', true, res.data.message);
    } else {
      recordTest('Test E3: Patient Password Change from Temporary to Permanent', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test E3: Patient Password Change from Temporary to Permanent', false, err.message);
  }

  // E4: Login with permanent password
  try {
    const res = await request('POST', '/api/auth/login', {
      email: createdPatientEmail,
      password: permanentPassword,
    });

    if (res.status === 200 && res.data.mustChangePassword === false) {
      recordTest('Test E4: Login with Permanent Password (mustChangePassword cleared)', true, 'Patient verified');
    } else {
      recordTest('Test E4: Login with Permanent Password (mustChangePassword cleared)', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test E4: Login with Permanent Password (mustChangePassword cleared)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST F: REGRESSION CHECKS
  // -------------------------------------------------------------------------
  console.log('\n--- TEST F: REGRESSION CHECKS ---');

  // F1: Game catalog
  try {
    const res = await request('GET', '/api/games/catalog');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length === 4) {
      recordTest('Test F1: Game Catalog Intact', true, `${res.data.length} games available`);
    } else {
      recordTest('Test F1: Game Catalog Intact', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test F1: Game Catalog Intact', false, err.message);
  }

  // F2: Appointments API
  try {
    const res = await request('GET', '/api/appointments', null, doctorToken);
    if (res.status === 200 && Array.isArray(res.data)) {
      recordTest('Test F2: Appointments API Operational', true, `${res.data.length} appointments listed`);
    } else {
      recordTest('Test F2: Appointments API Operational', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test F2: Appointments API Operational', false, err.message);
  }

  // F3: Patient profile endpoint
  try {
    const res = await request('GET', '/api/patients/me', null, newPatientToken);
    if (res.status === 200 && res.data.patient && res.data.doctor) {
      recordTest('Test F3: Patient Profile & Doctor Association', true, `Associated Doctor: Dr. ${res.data.doctor.name}`);
    } else {
      recordTest('Test F3: Patient Profile & Doctor Association', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test F3: Patient Profile & Doctor Association', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST G: MEDICATION & APPOINTMENT SYNCHRONIZATION
  // -------------------------------------------------------------------------
  console.log('\n--- TEST G: MEDICATION & APPOINTMENT SYNCHRONIZATION ---');

  // G1: Doctor prescribes medication with instructions and status
  let createdPrescriptionId = null;
  try {
    const res = await request(
      'POST',
      '/api/prescriptions',
      {
        patientId: createdPatientId,
        medications: [
          {
            name: 'Donepezil',
            dosage: '10mg',
            frequency: 'Once daily at bedtime',
            duration: '90 days',
            instructions: 'Take with a glass of water before sleep. Monitor for gastrointestinal upset.',
            status: 'Active',
          },
          {
            name: 'Memantine HCl',
            dosage: '5mg',
            frequency: 'Twice daily',
            duration: '60 days',
            instructions: 'Take with or without food morning and evening.',
            status: 'Active',
          },
        ],
        notes: 'Target neurocognitive symptom stabilization. Re-evaluate in 30 days.',
      },
      doctorToken
    );

    if ((res.status === 200 || res.status === 201) && res.data._id && res.data.medications?.length === 2) {
      createdPrescriptionId = res.data._id;
      recordTest(
        'Test G1: Doctor Prescribes Medication with Instructions & Status',
        true,
        `Prescription ID: ${createdPrescriptionId}, Medications: Donepezil (10mg), Memantine (5mg)`
      );
    } else {
      recordTest('Test G1: Doctor Prescribes Medication with Instructions & Status', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test G1: Doctor Prescribes Medication with Instructions & Status', false, err.message);
  }

  // G2: Patient fetches their prescribed medication list
  try {
    const res = await request('GET', '/api/patients/me/prescriptions', null, newPatientToken);
    const hasMedication = Array.isArray(res.data) && res.data.some(
      (p) => p.medications && p.medications.some((m) => m.name === 'Donepezil' && m.instructions)
    );

    if (res.status === 200 && hasMedication) {
      const rx = res.data[0];
      recordTest(
        'Test G2: Patient Retrieves Prescribed Medication List',
        true,
        `Found ${res.data.length} prescription record(s). Meds: ${rx.medications.map((m) => m.name + ' (' + m.status + ')').join(', ')}`
      );
    } else {
      recordTest('Test G2: Patient Retrieves Prescribed Medication List', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test G2: Patient Retrieves Prescribed Medication List', false, err.message);
  }

  // G3: Patient books an appointment through backend
  let bookedApptId = null;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const appointmentDate = tomorrow.toISOString().split('T')[0];

  try {
    const res = await request(
      'POST',
      '/api/appointments',
      {
        date: appointmentDate,
        timeSlot: '10:30 AM',
        reason: 'Follow-up cognitive assessment & prescription review',
        notes: 'Patient reported mild fatigue in mornings',
      },
      newPatientToken
    );

    if ((res.status === 200 || res.status === 201) && res.data._id) {
      bookedApptId = res.data._id;
      recordTest('Test G3: Patient Books Appointment via Mobile API', true, `Appointment ID: ${bookedApptId}, Date: ${appointmentDate} at 10:30 AM`);
    } else {
      recordTest('Test G3: Patient Books Appointment via Mobile API', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test G3: Patient Books Appointment via Mobile API', false, err.message);
  }

  // G4: Patient retrieves their own appointments list
  try {
    const res = await request('GET', '/api/appointments', null, newPatientToken);
    const found = Array.isArray(res.data) && res.data.some((a) => a._id === bookedApptId);

    if (res.status === 200 && found) {
      recordTest('Test G4: Patient App Synchronizes Booked Appointment', true, `Found booked appointment with status: Pending`);
    } else {
      recordTest('Test G4: Patient App Synchronizes Booked Appointment', false, JSON.stringify(res.data));
    }
  } catch (err) {
    recordTest('Test G4: Patient App Synchronizes Booked Appointment', false, err.message);
  }

  // G5: Doctor views the newly booked appointment in their dashboard
  try {
    const res = await request('GET', '/api/appointments', null, doctorToken);
    const foundByDoctor = Array.isArray(res.data) && res.data.some((a) => a._id === bookedApptId);

    if (res.status === 200 && foundByDoctor) {
      recordTest('Test G5: Doctor Dashboard Synchronizes Patient-Booked Appointment', true, `Doctor sees appointment ID ${bookedApptId}`);
    } else {
      recordTest('Test G5: Doctor Dashboard Synchronizes Patient-Booked Appointment', false, `Status ${res.status}`);
    }
  } catch (err) {
    recordTest('Test G5: Doctor Dashboard Synchronizes Patient-Booked Appointment', false, err.message);
  }

  // G6: Cross-patient privacy guard (patient cannot access another patient's prescriptions)
  try {
    const res = await request('GET', `/api/prescriptions/patient/${createdPatientId}`, null, existingPatientToken);
    if (res.status === 403) {
      recordTest('Test G6: Cross-Patient Medication Privacy Guard Enforced', true, 'Status 403 Forbidden when unauthorized patient requests another patient prescriptions');
    } else {
      recordTest('Test G6: Cross-Patient Medication Privacy Guard Enforced', false, `Expected 403, got ${res.status}`);
    }
  } catch (err) {
    recordTest('Test G6: Cross-Patient Medication Privacy Guard Enforced', false, err.message);
  }

  // Summary
  console.log('\n======================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount === 0) {
    console.log('\n🎉 ALL END-TO-END TESTS PASSED PERFECTLY!\n');
  } else {
    console.log(`\n⚠️  ${failedCount} TESTS FAILED\n`);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite runner crashed:', err);
});
