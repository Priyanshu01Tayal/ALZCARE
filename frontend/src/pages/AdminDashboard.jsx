import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, FileText, Calendar, Activity, ShieldAlert, Cpu } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.getAdminDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Doctors', value: stats?.totalDoctors || 0, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-150' },
    { title: 'Total Patients', value: stats?.totalPatients || 0, icon: FileText, color: 'text-emerald-600 bg-emerald-50 border-emerald-150' },
    { title: 'MRI Uploads', value: stats?.totalMris || 0, icon: Cpu, color: 'text-sky-600 bg-sky-50 border-sky-150' },
    { title: 'Appointments Scheduled', value: stats?.totalAppts || 0, icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-150' },
  ];

  return (
    <div className="space-y-8">
      {/* Brand Header */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-clinical-600" />
          <span>System Administration Dashboard</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor directory statuses, track clinical activities, and control specialist accounts
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="bg-white border border-slate-150 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold">{c.title}</span>
                <span className="block text-2xl font-bold text-slate-800">{c.value}</span>
              </div>
              <div className={`p-3 rounded-xl border ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Logs Section */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4 text-clinical-600 animate-pulse" />
            <span>Recent System Activities</span>
          </h3>
          <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
            Real-time Audit Trail
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {stats?.recentLogs?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recent logs found.
            </div>
          ) : (
            stats?.recentLogs?.map((l) => (
              <div key={l._id} className="p-4 hover:bg-slate-50/40 transition flex items-start justify-between">
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {l.action}
                  </span>
                  <p className="text-xs text-slate-700 font-medium mt-1">{l.details}</p>
                  <span className="block text-[10px] text-slate-400">
                    User Type: {l.userModel}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
