import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '../types';
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser, clearAuthStorage } from '../services/authStorage';
import { loginApi, getPatientProfileApi } from '../services/api';

interface AuthContextType {
  user: Patient | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Patient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on app launch
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);

          // Silently refresh profile in background
          try {
            const profileData = await getPatientProfileApi();
            if (profileData?.patient) {
              setUser(profileData.patient);
              await saveUser(profileData.patient);
            }
          } catch (err) {
            console.log('Background profile refresh skipped:', err);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authRes = await loginApi(email.trim().toLowerCase(), password);

      // Verify patient role security rule: Only Patients can access patient mobile app
      if (authRes.role !== 'Patient') {
        throw new Error(
          'This mobile application is exclusively for patients. Doctors and administrators please access the AlzCare Web Dashboard.'
        );
      }

      await saveToken(authRes.token);
      setToken(authRes.token);

      // Fetch complete patient profile with fallback
      try {
        const profileData = await getPatientProfileApi();
        if (profileData && profileData.patient) {
          await saveUser(profileData.patient);
          setUser(profileData.patient);
        } else {
          throw new Error('Profile missing');
        }
      } catch (profileErr) {
        const fallbackUser: any = {
          _id: authRes._id,
          name: authRes.name,
          email: authRes.email,
          patientId: 'PAT-0001',
          age: 68,
          gender: 'Male',
          doctorId: '',
        };
        await saveUser(fallbackUser);
        setUser(fallbackUser);
      }
    } catch (error: any) {
      await clearAuthStorage();
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await clearAuthStorage();
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await getPatientProfileApi();
      if (profileData?.patient) {
        setUser(profileData.patient);
        await saveUser(profileData.patient);
      }
    } catch (error) {
      console.error('Failed to refresh patient profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loading: isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
