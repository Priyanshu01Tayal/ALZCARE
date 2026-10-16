import axios, { AxiosError } from 'axios';
import { getToken, clearAuthStorage } from './authStorage';
import {
  Patient,
  Doctor,
  GameCatalogItem,
  PatientGameItem,
  GameAssignment,
  GameResult,
  Appointment,
  NotificationItem,
  GameProgressSummary,
} from '../types';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_RESULTS_KEY = '@alzcare_pending_game_results';

// Discover API base URL from Expo environment variable or use local machine IP fallback
const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.4:5000/api';
};

const BASE_URL = getBaseUrl();

console.log('[AlzCare Mobile] Connecting to backend at:', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Inject Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with user-friendly error formatting
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await clearAuthStorage();
    }

    const friendlyMessage =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Network request timed out. Please check your connection.'
        : error.message === 'Network Error'
        ? 'Cannot reach AlzCare medical server. Make sure your phone and computer are on the same Wi-Fi network.'
        : 'A clinical service error occurred. Please try again.');

    return Promise.reject(new Error(friendlyMessage));
  }
);

// ==========================================
// Authentication APIs
// ==========================================
export const loginApi = async (email: string, password: string) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data as {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
  };
};

export const getMeApi = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

// ==========================================
// Patient Profile APIs
// ==========================================
export const getPatientProfileApi = async () => {
  const res = await apiClient.get('/patients/me');
  return res.data as {
    patient: Patient;
    doctor: Doctor;
    prescriptions: any[];
    games: GameAssignment[];
    appointments: Appointment[];
  };
};

export const updatePatientProfileApi = async (data: Partial<Patient>) => {
  const res = await apiClient.put('/patients/me', data);
  return res.data as Patient;
};

export const getAssignedDoctorApi = async () => {
  const res = await apiClient.get('/patients/me/doctor');
  return res.data as Doctor;
};

// ==========================================
// Cognitive Games APIs
// ==========================================
export const getGameCatalogApi = async () => {
  const res = await apiClient.get('/games/catalog');
  return res.data as GameCatalogItem[];
};

export const getPatientGamesApi = async () => {
  const res = await apiClient.get('/patients/me/games');
  return res.data as {
    games: PatientGameItem[];
    assignments: GameAssignment[];
  };
};

export const getGameAssignmentsApi = async () => {
  const res = await apiClient.get('/patients/me/game-assignments');
  return res.data as GameAssignment[];
};

export const savePendingGameResult = async (data: any) => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
    const list = existing ? JSON.parse(existing) : [];
    list.push({ ...data, queuedAt: new Date().toISOString() });
    await AsyncStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(list));
    console.log('[Offline Queue] Saved pending game result locally:', data.gameName);
  } catch (e) {
    console.error('[Offline Queue] Error saving game result:', e);
  }
};

export const syncPendingGameResultsApi = async () => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
    if (!existing) return 0;
    const list = JSON.parse(existing);
    if (!Array.isArray(list) || list.length === 0) return 0;

    console.log(`[Offline Queue] Syncing ${list.length} pending game result(s)...`);
    const remaining: any[] = [];
    let syncedCount = 0;

    for (const item of list) {
      try {
        await apiClient.post('/games/result', item);
        syncedCount++;
      } catch (err) {
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      await AsyncStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(remaining));
    } else {
      await AsyncStorage.removeItem(PENDING_RESULTS_KEY);
    }

    console.log(`[Offline Queue] Successfully synced ${syncedCount} game result(s).`);
    return syncedCount;
  } catch (e) {
    console.error('[Offline Queue] Error syncing pending results:', e);
    return 0;
  }
};

export const submitGameResultApi = async (data: {
  assignmentId?: string;
  gameId?: string;
  gameName: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  duration?: number;
  moves?: number;
  difficulty?: string;
}) => {
  try {
    const res = await apiClient.post('/games/result', data);
    return res.data as {
      success: boolean;
      assignment: GameAssignment | null;
      result: GameResult;
    };
  } catch (error) {
    // If backend or network fails, queue result locally so progress is not lost
    await savePendingGameResult(data);
    throw error;
  }
};

export const getGameProgressApi = async () => {
  const res = await apiClient.get('/patients/me/game-progress');
  return res.data as GameProgressSummary;
};

// ==========================================
// Appointments APIs
// ==========================================
export const getAppointmentsApi = async () => {
  const res = await apiClient.get('/patients/me/appointments');
  return res.data as Appointment[];
};

export const bookAppointmentApi = async (data: {
  date: string;
  timeSlot: string;
  reason: string;
}) => {
  const res = await apiClient.post('/appointments', data);
  return res.data as Appointment;
};

export const updateAppointmentStatusApi = async (id: string, status: string) => {
  const res = await apiClient.put(`/appointments/${id}/status`, { status });
  return res.data as Appointment;
};

// ==========================================
// Notifications APIs
// ==========================================
export const getNotificationsApi = async () => {
  const res = await apiClient.get('/notifications');
  return res.data as NotificationItem[];
};

export const markNotificationReadApi = async (id: string) => {
  const res = await apiClient.put(`/notifications/${id}/read`);
  return res.data;
};
