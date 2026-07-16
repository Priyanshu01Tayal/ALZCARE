import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity, ShieldAlert } from 'lucide-react';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.getActivityLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-clinical-600" />
          <span>System Audit Activity Log</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete, tamper-evident chronological timeline of system events, registration actions, and record uploads
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-slate-450 bg-white border border-slate-150 rounded-xl text-xs">
          No audit logs recorded yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
          {logs.map((l) => (
            <div key={l._id} className="p-4 hover:bg-slate-50/40 transition flex items-start justify-between text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-slate-100">
                    {l.action}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Role: <strong className="text-slate-600">{l.userModel}</strong>
                  </span>
                </div>
                <p className="text-slate-700 font-medium">{l.details}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
