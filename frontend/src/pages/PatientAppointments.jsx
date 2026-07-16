import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

const PatientAppointments = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '09:00 AM',
    reason: '',
  });
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.bookAppointment({
        date: formData.date,
        timeSlot: formData.timeSlot,
        reason: formData.reason,
      });
      setFormData({ date: '', timeSlot: '09:00 AM', reason: '' });
      fetchAppointments();
      alert('Appointment booked successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule appointment');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.updateAppointmentStatus(id, 'Cancelled');
        fetchAppointments();
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-clinical-600" />
          <span>My Appointment Planner</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Book slots and review your upcoming diagnostic visits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Booking Form Card */}
        <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Schedule Visit</h3>
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Preferred Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Time Slot
              </label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Reason / Symptoms
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Routine follow-up or checkup"
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-clinical-600 hover:bg-clinical-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-clinical-600/10"
            >
              Confirm Appointment Request
            </button>
          </form>
        </div>

        {/* Scheduling logs */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>Appointment History</span>
          </h3>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white border border-slate-150 rounded-xl">
              No appointments scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a._id} className="bg-white border border-slate-150 p-4 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-sm block">
                      {new Date(a.date).toLocaleDateString()} at {a.timeSlot}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Physician: Dr. {a.doctorId?.name || 'Assigned Doctor'}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Agenda: {a.reason || 'General Follow-up'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
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
                    
                    {a.status === 'Scheduled' && (
                      <button
                        onClick={() => handleCancel(a._id)}
                        className="text-rose-605 hover:underline text-xs font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientAppointments;
