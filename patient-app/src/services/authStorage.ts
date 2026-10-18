import { Platform } from 'react-native';
import { Patient } from '../types';

let AsyncStorageModule: any = null;
try {
  const mod = require('@react-native-async-storage/async-storage');
  AsyncStorageModule = mod?.default || mod;
} catch (e) {
  // Module not found or unlinked
}

const TOKEN_KEY = '@alzcare_auth_token';
const USER_KEY = '@alzcare_user_data';

// Fast in-memory fallback store to guarantee zero crashes on Web or unlinked platforms
const memoryStore = new Map<string, string>();

const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    // 1. Web LocalStorage
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        // Fallback to memory
      }
    }

    // 2. React Native AsyncStorage
    if (AsyncStorageModule) {
      try {
        const val = await AsyncStorageModule.getItem(key);
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        // Fallback to memory
      }
    }

    // 3. In-memory store
    return memoryStore.get(key) || null;
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        // Memory fallback already set
      }
    }

    if (AsyncStorageModule) {
      try {
        await AsyncStorageModule.setItem(key, value);
      } catch (e) {
        // Memory fallback already set
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        // Memory fallback already removed
      }
    }

    if (AsyncStorageModule) {
      try {
        await AsyncStorageModule.removeItem(key);
      } catch (e) {
        // Memory fallback already removed
      }
    }
  },
};

export const saveToken = async (token: string): Promise<void> => {
  try {
    await safeStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    // Handled gracefully
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await safeStorage.getItem(TOKEN_KEY);
  } catch (error) {
    return memoryStore.get(TOKEN_KEY) || null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await safeStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    // Handled gracefully
  }
};

export const saveUser = async (user: Patient): Promise<void> => {
  try {
    await safeStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    // Handled gracefully
  }
};

export const getUser = async (): Promise<Patient | null> => {
  try {
    const raw = await safeStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    const raw = memoryStore.get(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    await safeStorage.removeItem(USER_KEY);
  } catch (error) {
    // Handled gracefully
  }
};

export const clearAuthStorage = async (): Promise<void> => {
  try {
    await Promise.all([
      safeStorage.removeItem(TOKEN_KEY),
      safeStorage.removeItem(USER_KEY),
    ]);
  } catch (error) {
    memoryStore.delete(TOKEN_KEY);
    memoryStore.delete(USER_KEY);
  }
};
