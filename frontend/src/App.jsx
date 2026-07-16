import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientsList from './pages/PatientsList';
import PatientDetails from './pages/PatientDetails';
import Appointments from './pages/Appointments';
import PatientDashboard from './pages/PatientDashboard';
import PatientRecords from './pages/PatientRecords';
import PatientGames from './pages/PatientGames';
import PatientAppointments from './pages/PatientAppointments';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminDoctors from './pages/AdminDoctors';
import AdminPatients from './pages/AdminPatients';
import AdminLogs from './pages/AdminLogs';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-doctors"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Layout>
                  <AdminDoctors />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-patients"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Layout>
                  <AdminPatients />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-logs"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Layout>
                  <AdminLogs />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Doctor Protected Routes */}
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute allowedRoles={['Doctor']}>
                <Layout>
                  <DoctorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute allowedRoles={['Doctor']}>
                <Layout>
                  <PatientsList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/:id"
            element={
              <ProtectedRoute allowedRoles={['Doctor']}>
                <Layout>
                  <PatientDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={['Doctor']}>
                <Layout>
                  <Appointments />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Patient Protected Routes */}
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Layout>
                  <PatientDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-records"
            element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Layout>
                  <PatientRecords />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-games"
            element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Layout>
                  <PatientGames />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-appointments"
            element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Layout>
                  <PatientAppointments />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
