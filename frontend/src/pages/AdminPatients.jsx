import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, FileText } from 'lucide-react';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await api.getAllPatientsAdmin();
        setPatients(data);
      } catch (err) {
        console.error('Failed to load system patients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-clinical-600" />
          <span>Patient Registry Directory</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review all patients registered across the AlzCare system and check assigned specialists
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="p-8 text-center text-slate-450 bg-white border border-slate-150 rounded-xl text-xs">
          No patients registered in the system yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  <th className="py-4 px-6">Patient ID</th>
                  <th className="py-4 px-6">Full Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Demographics</th>
                  <th className="py-4 px-6">Assigned Physician</th>
                  <th className="py-4 px-6">Medical History Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/30 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono bg-slate-100 border border-slate-200 text-slate-650 px-2 py-0.5 rounded text-[11px] font-bold">
                        {p.patientId || 'Pending ID'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">{p.name}</td>
                    <td className="py-4 px-6 text-slate-500">{p.email}</td>
                    <td className="py-4 px-6 text-slate-500">
                      {p.age} years | {p.gender}
                    </td>
                    <td className="py-4 px-6">
                      {p.doctorId ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-700 block">Dr. {p.doctorId.name}</span>
                          <span className="text-[10px] text-slate-400 block">{p.doctorId.specialization}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">None Assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-450 italic truncate max-w-xs" title={p.medicalHistory}>
                      {p.medicalHistory || 'No history provided'}
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

export default AdminPatients;
