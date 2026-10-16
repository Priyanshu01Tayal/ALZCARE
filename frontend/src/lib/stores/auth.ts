import { create } from 'zustand';
import Cookies from 'js-cookie';

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: 'Doctor' | 'Patient' | 'Admin';
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: UserInfo, token: string) => void;
  clearAuth: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,
  setAuth: (user, token) => {
    Cookies.set('token', token, { expires: 30 });
    Cookies.set('user', JSON.stringify(user), { expires: 30 });
    set({ user, token, loading: false });
  },
  clearAuth: () => {
    Cookies.remove('token');
    Cookies.remove('user');
    set({ user: null, token: null, loading: false });
  },
  initialize: () => {
    const token = Cookies.get('token') || null;
    const userStr = Cookies.get('user');
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user cookie:', e);
      }
    }
    set({ user, token, loading: false });
  },
}));
