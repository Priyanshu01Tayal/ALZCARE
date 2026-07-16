import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, Check, X, Clipboard } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data } = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-clinical-600" />
          <span>Patient Appointment Planner</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Review scheduled appointments and mark slots as completed or cancelled</p>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-2">
            <Clock className="h-8 w-8 text-slate-300" />
            <span>No appointments recorded.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-6">Patient</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/50">
                    <td className="p-4 pl-6 font-semibold text-slate-800">
                      {a.patientId?.name || 'Deleted Patient'}
                    </td>
                    <td className="p-4">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4">{a.timeSlot}</td>
                    <td className="p-4 text-slate-500">{a.reason || 'Regular checkup'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          a.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                            : a.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-250'
                            : 'bg-amber-50 text-amber-700 border-amber-250'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right flex justify-end space-x-1.5">
                      {a.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(a._id, 'Completed')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200/50 transition duration-150"
                            title="Mark Completed"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(a._id, 'Cancelled')}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200/50 transition duration-150"
                            title="Cancel Appointment"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
