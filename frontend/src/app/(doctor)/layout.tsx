'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth';
import { useToastStore } from '@/lib/stores/toast';
import { apiClient } from '@/lib/api/client';
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Bell,
  Activity,
  Check,
  BrainCircuit,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, initialize } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    initialize();
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleLogout = () => {
    clearAuth();
    addToast('Logged Out', 'Successfully signed out of portal.', 'info');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'Patient Directory', path: '/patients', icon: Users },
    { name: 'Cognitive Analytics', path: '/doctor/analytics', icon: BrainCircuit },
    { name: 'Clinic Appointments', path: '/doctor/appointments', icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl z-20">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3.5">
            <div className="h-10 w-10 bg-gradient-to-tr from-clinical-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-clinical-600/25">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">AlzCare</span>
              <span className="text-xs text-slate-400 font-medium">Clinical Dashboard</span>
            </div>
          </div>

          {/* User profile card */}
          <div className="p-4 mx-4 my-5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center space-x-3.5 shadow-sm">
            <div className="h-11 w-11 bg-gradient-to-tr from-clinical-600 to-teal-600 text-white rounded-full flex items-center justify-center text-base font-bold shadow-md shadow-clinical-600/20 shrink-0">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-semibold text-white truncate">Dr. {user?.name || 'Practitioner'}</p>
              <span className="inline-flex items-center px-2 py-0.5 mt-0.5 text-xs font-semibold text-clinical-400 bg-clinical-500/10 rounded-full border border-clinical-500/20">
                Neurologist / Physician
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="px-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path === '/patients' && pathname.startsWith('/patients/'));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'text-white font-semibold bg-clinical-600/15 border border-clinical-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-clinical-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-clinical-500 rounded-r-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-300 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/30 hover:text-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-18 bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="h-2 w-2 rounded-full bg-clinical-400"></span>
            <h2 className="text-sm font-semibold text-slate-300 capitalize tracking-wide">
              {pathname.includes('analytics')
                ? 'Cognitive Analytics & Trajectory'
                : pathname.includes('dashboard')
                ? 'Clinical Overview'
                : pathname.includes('appointments')
                ? 'Appointments & Clinic Visits'
                : pathname.includes('patients')
                ? 'Patient Roster & Medical Profiles'
                : 'Medical Management'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification bell dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors duration-150 focus:outline-none cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 rounded-full text-xs font-bold text-white flex items-center justify-center shadow-md shadow-rose-500/30">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-3 w-88 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-40">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                      <span className="font-semibold text-white text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs font-semibold text-clinical-400 bg-clinical-950/80 border border-clinical-800/40 px-2.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 bg-slate-900/60 backdrop-blur-md">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-4 flex items-start space-x-3 transition-colors hover:bg-slate-800/40 ${
                              !n.isRead ? 'bg-clinical-500/5' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
                              <span className="text-xs text-slate-400 mt-1 block font-mono">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(n._id, e)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-clinical-500/20 text-slate-400 hover:text-clinical-400 transition cursor-pointer"
                                title="Mark read"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-slate-800"></div>

            <div className="flex items-center space-x-3 pl-1">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-clinical-400">
                {user?.name?.charAt(0) || 'D'}
              </div>
              <span className="text-sm font-semibold text-slate-200">Dr. {user?.name || 'Jane Foster'}</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10 bg-slate-950">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
