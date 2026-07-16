import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, CheckCircle, XCircle } from 'lucide-react';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data } = await api.getAllDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleToggle = async (id) => {
    if (window.confirm('Are you sure you want to change the status of this doctor account?')) {
      try {
        await api.toggleDoctorStatus(id);
        fetchDoctors();
      } catch (err) {
        console.error('Failed to toggle doctor status:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <Users className="h-5 w-5 text-clinical-600" />
          <span>Manage Specialist Directors</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Activate or deactivate accounts for medical practitioners and specialists
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-8 text-center text-slate-450 bg-white border border-slate-150 rounded-xl text-xs">
          No doctor accounts found.
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  <th className="py-4 px-6">Specialist Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Specialization</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {doctors.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/30 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">{d.name}</td>
                    <td className="py-4 px-6 text-slate-500">{d.email}</td>
                    <td className="py-4 px-6 text-slate-500">{d.specialization}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          d.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                            : 'bg-rose-50 text-rose-700 border-rose-150'
                        }`}
                      >
                        {d.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Deactivated</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggle(d._id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                          d.isActive
                            ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {d.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctors;
