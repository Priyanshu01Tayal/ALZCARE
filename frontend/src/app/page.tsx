'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { Activity } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, token, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!token || !user) {
        router.replace('/login');
      } else if (user.role === 'Doctor') {
        router.replace('/doctor/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [loading, token, user, router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-14 w-14 bg-gradient-to-tr from-clinical-600 to-clinical-500 rounded-2xl flex items-center justify-center shadow-xl shadow-clinical-600/20">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse"></div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-white tracking-tight">AlzCare</h1>
          <p className="text-xs text-slate-500 font-medium">Initializing clinical session...</p>
        </div>
        <div className="flex space-x-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-clinical-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
