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
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Restore session on app launch with minimum splash duration for brand stability
  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      const startTime = Date.now();
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        if (storedToken && storedUser) {
          if (isMounted) {
            setToken(storedToken);
            setUser(storedUser);
          }

          // Silently refresh profile in background
          try {
            const profileData = await getPatientProfileApi();
            if (profileData?.patient && isMounted) {
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
        // Enforce a smooth 1000ms minimum splash display to prevent jarring UI flicker
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 1000 - elapsed);
        setTimeout(() => {
          if (isMounted) {
            setIsInitializing(false);
          }
        }, remainingDelay);
      }
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const authRes = await loginApi(cleanEmail, password);

      // Verify patient role security rule: Only Patients can access patient mobile app
      if (authRes.role !== 'Patient') {
        throw new Error(
          'This mobile application is exclusively for patients. Doctors and administrators please access the AlzCare Web Dashboard.'
        );
      }

      if (authRes.status === 'Inactive') {
        throw new Error('Your patient account has been deactivated. Please contact your physician.');
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
          patientId: 'PAT-XXXX',
          age: 65,
          gender: 'Other',
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
        isLoading: isInitializing,
        loading: isInitializing,
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
