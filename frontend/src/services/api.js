import axios from 'axios';

const api = {
  // Patients
  getPatients: () => axios.get('/api/patients'),
  getPatientById: (id) => axios.get(`/api/patients/${id}`),
  addPatient: (data) => axios.post('/api/patients', data),
  updatePatient: (id, data) => axios.put(`/api/patients/${id}`, data),
  deletePatient: (id) => axios.delete(`/api/patients/${id}`),

  // Appointments
  getAppointments: () => axios.get('/api/appointments'),
  bookAppointment: (data) => axios.post('/api/appointments', data),
  updateAppointmentStatus: (id, status) => axios.put(`/api/appointments/${id}/status`, { status }),

  // Prescriptions
  getPrescriptions: (patientId) => axios.get(`/api/prescriptions/patient/${patientId}`),
  createPrescription: (data) => axios.post('/api/prescriptions', data),

  // MRI
  uploadMri: (formData) => axios.post('/api/mri/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyzeMri: () => axios.post('/api/mri/analyze'),
  getMriReports: (patientId) => axios.get(`/api/mri/patient/${patientId}`),

  // Games
  assignGame: (data) => axios.post('/api/games/assign', data),
  getGames: (patientId) => axios.get(`/api/games/patient/${patientId}`),
  submitGameResult: (data) => axios.post('/api/games/result', data),
  getGameResults: (patientId) => axios.get(`/api/games/results/${patientId}`),

  // Notifications
  getNotifications: () => axios.get('/api/notifications'),
  markNotificationRead: (id) => axios.put(`/api/notifications/${id}/read`),

  // Timeline
  getPatientTimeline: (patientId) => axios.get(`/api/timeline/${patientId}`),

  // Admin
  registerAdmin: (data) => axios.post('/api/auth/register/admin', data),
  getAdminDashboard: () => axios.get('/api/admin/dashboard'),
  getAllDoctors: () => axios.get('/api/admin/doctors'),
  toggleDoctorStatus: (id) => axios.put(`/api/admin/doctors/${id}/toggle`),
  getAllPatientsAdmin: () => axios.get('/api/admin/patients'),
  getActivityLogs: () => axios.get('/api/admin/logs'),
};

export default api;
