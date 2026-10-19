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
  PrescriptionItem,
} from '../types';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_RESULTS_KEY = '@alzcare_pending_game_results';

export const SERVER_URL_KEY = '@alzcare_custom_server_url';
export const PROD_API_URL = 'https://alzcare1.onrender.com/api';
export const LOCAL_DEV_API_URL = 'http://192.168.1.5:5000/api';

// Discover API base URL: prioritized by explicit environment variable, then production cloud backend
export const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0) {
    return process.env.EXPO_PUBLIC_API_URL.trim();
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }
  return PROD_API_URL;
};

export const getStoredServerUrl = async (): Promise<string> => {
  try {
    const custom = await AsyncStorage.getItem(SERVER_URL_KEY);
    if (custom && custom.trim().length > 0) {
      const trimmed = custom.trim();
      // Auto-migrate obsolete legacy Wi-Fi IP defaults so devices automatically switch to production cloud backend
      if (trimmed === 'http://192.168.1.5:5000/api' || trimmed === 'http://192.168.1.4:5000/api') {
        await AsyncStorage.removeItem(SERVER_URL_KEY);
        return getDefaultBaseUrl();
      }
      return trimmed;
    }
  } catch (e) {
    // fallback
  }
  return getDefaultBaseUrl();
};

export const setCustomServerUrl = async (url: string): Promise<string> => {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  const finalUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  await AsyncStorage.setItem(SERVER_URL_KEY, finalUrl);
  apiClient.defaults.baseURL = finalUrl;
  return finalUrl;
};

export const resetCustomServerUrl = async (): Promise<string> => {
  await AsyncStorage.removeItem(SERVER_URL_KEY);
  const def = getDefaultBaseUrl();
  apiClient.defaults.baseURL = def;
  return def;
};

export interface HealthCheckResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
  url: string;
  timestamp?: string;
  details?: string;
}

export const checkBackendHealth = async (overrideUrl?: string): Promise<HealthCheckResult> => {
  const targetBaseUrl = overrideUrl ? overrideUrl.trim().replace(/\/+$/, '') : await getStoredServerUrl();
  const healthUrl = targetBaseUrl.endsWith('/api') ? `${targetBaseUrl}/health` : `${targetBaseUrl}/api/health`;

  const startTime = Date.now();
  try {
    const response = await axios.get(healthUrl, {
      timeout: 15000, // 15 second timeout to accommodate Render cloud cold-starts
      headers: {
        Accept: 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
    });
    const latencyMs = Date.now() - startTime;
    if (response.status === 200) {
      return {
        ok: true,
        message: response.data?.message || 'AlzCare API is reachable and healthy',
        latencyMs,
        url: targetBaseUrl,
        timestamp: response.data?.timestamp || new Date().toISOString(),
      };
    }
    return {
      ok: false,
      message: `Server returned status ${response.status}`,
      latencyMs,
      url: targetBaseUrl,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    let detail = 'Network request failed or timed out.';
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      detail = targetBaseUrl.includes('onrender.com')
        ? 'Connection timed out (15s). Cloud instance may be waking from sleep, please retry in a moment.'
        : 'Connection timed out (15s). Device cannot reach this IP/port.';
    } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
      detail = targetBaseUrl.includes('192.168.') || targetBaseUrl.includes('localhost')
        ? 'Network Error. Ensure phone and laptop are on same Wi-Fi, or switch to Production Cloud Server.'
        : 'Network Error. Cannot connect to ALZCARE Cloud Server. Please check your internet connection.';
    } else if (error.response?.data?.message) {
      detail = error.response.data.message;
    }
    return {
      ok: false,
      message: detail,
      latencyMs,
      url: targetBaseUrl,
      details: error.message,
    };
  }
};

const BASE_URL = getDefaultBaseUrl();

console.log('[AlzCare Mobile] Connecting to backend default at:', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Inject dynamic baseURL & Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const customUrl = await AsyncStorage.getItem(SERVER_URL_KEY);
      if (customUrl && customUrl.trim()) {
        config.baseURL = customUrl.trim();
      }
    } catch (e) {
      // ignore
    }

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
    // Only clear storage on 401 if it was an authenticated session call (not login attempt itself)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      await clearAuthStorage();
    }

    const activeUrl = error.config?.baseURL || BASE_URL;
    const isCloud = activeUrl.includes('onrender.com') || activeUrl.startsWith('https://');

    const friendlyMessage =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? `Request timed out connecting to ${activeUrl}. The server may be waking up from cold sleep, please retry.`
        : error.message === 'Network Error' || (error as any).code === 'ERR_NETWORK'
        ? isCloud
          ? `Cannot reach ALZCARE Cloud Server at ${activeUrl}. Please verify your phone has active internet access.`
          : `Cannot reach local development server at ${activeUrl}. Ensure your computer and phone are on the same Wi-Fi, or switch to Production.`
        : 'A clinical service error occurred. Please try again.');

    return Promise.reject(new Error(friendlyMessage));
  }
);

// ==========================================
// Authentication APIs
// ==========================================
export const loginApi = async (identifier: string, password: string) => {
  const res = await apiClient.post('/auth/login', {
    email: identifier,
    identifier,
    password,
  });
  return res.data as {
    _id: string;
    name: string;
    email: string;
    patientId?: string;
    role: string;
    token: string;
    status?: string;
    mustChangePassword?: boolean;
  };
};

export const changePasswordApi = async (data: { currentPassword?: string; newPassword: string }) => {
  const res = await apiClient.put('/patients/me/password', data);
  return res.data;
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
    prescriptions: PrescriptionItem[];
    games: GameAssignment[];
    appointments: Appointment[];
  };
};

export const getPatientPrescriptionsApi = async () => {
  const res = await apiClient.get('/patients/me/prescriptions');
  return res.data as PrescriptionItem[];
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
