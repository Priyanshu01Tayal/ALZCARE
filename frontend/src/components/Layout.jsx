import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  LogOut,
  Bell,
  BrainCircuit,
  FileText,
  Check,
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const doctorNav = [
    { name: 'Dashboard', path: '/doctor-dashboard', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
  ];

  const patientNav = [
    { name: 'Dashboard', path: '/patient-dashboard', icon: LayoutDashboard },
    { name: 'Appointments', path: '/patient-appointments', icon: Calendar },
    { name: 'Medical Records', path: '/patient-records', icon: FileText },
    { name: 'Cognitive Games', path: '/patient-games', icon: BrainCircuit },
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
    { name: 'Doctors', path: '/admin-doctors', icon: Users },
    { name: 'Patients', path: '/admin-patients', icon: FileText },
    { name: 'Activity Logs', path: '/admin-logs', icon: Activity },
  ];

  const navItems = role === 'Admin' ? adminNav : (role === 'Doctor' ? doctorNav : patientNav);


  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 shadow-xl z-20">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="h-9 w-9 bg-clinical-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-clinical-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">AlzCare</span>
              <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Cognitive Support</span>
            </div>
          </div>

          {/* User profile card */}
          <div className="p-4 mx-4 my-6 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="h-10 w-10 bg-clinical-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold text-clinical-400 bg-clinical-950/40 rounded-full border border-clinical-900/30">
                {role}
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="px-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/patients' && location.pathname.startsWith('/patient/'));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-clinical-600 text-white shadow-md shadow-clinical-600/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 bg-rose-950/20 border border-rose-900/20 hover:bg-rose-900/20 transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {location.pathname.includes('dashboard') ? 'Overview' : location.pathname.replace('/', '').split('/')[0].replace('-', ' ')}
          </h2>

          <div className="flex items-center space-x-4">
            {/* Notification bell dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150 focus:outline-none"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white animate-pulse">
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
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-150 overflow-hidden z-40">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-clinical-600 font-semibold bg-clinical-50 px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-4 flex items-start space-x-3 transition-colors duration-150 hover:bg-slate-50/50 ${
                              !n.isRead ? 'bg-clinical-50/20' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-xs text-slate-600 leading-normal">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(n._id, e)}
                                className="p-1 rounded bg-slate-100 hover:bg-clinical-100 hover:text-clinical-600 text-slate-400 transition-all duration-150 shrink-0"
                                title="Mark read"
                              >
                                <Check className="h-3 w-3" />
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

            <div className="h-8 w-px bg-slate-200"></div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 focus:outline-none bg-slate-50/40">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
