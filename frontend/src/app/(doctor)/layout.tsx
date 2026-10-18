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
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/60 backdrop-blur-md border-r border-white/10 flex flex-col justify-between shrink-0 shadow-2xl z-20">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/10 flex items-center space-x-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-clinical-600 to-clinical-550 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-clinical-600/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">AlzCare</span>
              <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Practitioner Portal</span>
            </div>
          </div>

          {/* User profile card */}
          <div className="p-4 mx-4 my-6 bg-slate-950/40 rounded-xl border border-white/5 flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-clinical-600 to-clinical-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Practitioner'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold text-clinical-400 bg-clinical-950/40 rounded-full border border-clinical-900/20">
                Medical Staff
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path === '/patients' && pathname.startsWith('/patients/'));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider relative transition-all duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarLinkDoctor"
                      className="absolute inset-0 bg-gradient-to-r from-clinical-600/20 to-transparent border-l-2 border-clinical-500 rounded-lg -z-10"
                    />
                  )}
                  <Icon className={`h-5 w-5 ${isActive ? 'text-clinical-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/20 border border-rose-900/20 hover:bg-rose-900/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 z-10 shrink-0">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            {pathname.includes('dashboard') ? 'Practitioner Control Center' : pathname.replace('/doctor/', '').replace('/', '').split('/')[0].replace('-', ' ')}
          </h2>

          <div className="flex items-center space-x-4">
            {/* Notification bell dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full text-slate-450 hover:bg-white/5 hover:text-white transition-colors duration-150 focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
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
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
                      <span className="font-bold text-white text-xs uppercase tracking-wider">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-clinical-400 bg-clinical-950 px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-white/5 bg-slate-900/40 backdrop-blur-md">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-4 flex items-start space-x-3 transition-colors hover:bg-white/5 ${
                              !n.isRead ? 'bg-clinical-500/5' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-xs text-slate-300 leading-normal">{n.message}</p>
                              <span className="text-[9px] text-slate-500 mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(n._id, e)}
                                className="p-1 rounded bg-slate-800 hover:bg-clinical-500/20 text-slate-400 hover:text-clinical-400 transition"
                                title="Mark read"
                              >
                                <Check className="h-3.5 w-3.5" />
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

            <div className="h-8 w-px bg-white/10"></div>
            <span className="text-xs font-bold text-slate-300">Dr. {user?.name}</span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
