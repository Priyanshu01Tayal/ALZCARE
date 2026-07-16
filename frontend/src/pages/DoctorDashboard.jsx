import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Users,
  Calendar,
  BrainCircuit,
  FileText,
  Plus,
  Clock,
  ArrowRight,
} from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patientsCount: 0,
    appointmentsCount: 0,
    mrisPendingCount: 0,
    gamesAssignedCount: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [patientsRes, appointmentsRes] = await Promise.all([
        api.getPatients(),
        api.getAppointments(),
      ]);

      const patients = patientsRes.data;
      const allAppointments = appointmentsRes.data;

      const upcomingAppointments = allAppointments.filter((a) => a.status === 'Scheduled');

      let pendingMriTotal = 0;
      let activeGamesTotal = 0;

      await Promise.all(
        patients.map(async (p) => {
          try {
            const detailRes = await api.getPatientById(p._id);
            const detail = detailRes.data;
            pendingMriTotal += detail.mris.filter((m) => m.status === 'Pending').length;
            activeGamesTotal += detail.games.filter((g) => g.status === 'Assigned').length;
          } catch (e) {
            console.error('Error fetching details for patient', p._id, e);
          }
        })
      );

      setStats({
        patientsCount: patients.length,
        appointmentsCount: upcomingAppointments.length,
        mrisPendingCount: pendingMriTotal,
        gamesAssignedCount: activeGamesTotal,
      });

      setAppointments(upcomingAppointments.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Patients', value: stats.patientsCount, icon: Users, color: 'text-clinical-600', bg: 'bg-clinical-50', link: '/patients' },
    { title: 'Scheduled Appts', value: stats.appointmentsCount, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', link: '/appointments' },
    { title: 'Pending MRI Analysis', value: stats.mrisPendingCount, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/patients' },
    { title: 'Active Cognitive Games', value: stats.gamesAssignedCount, icon: BrainCircuit, color: 'text-violet-600', bg: 'bg-violet-50', link: '/patients' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-clinical-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-clinical-600/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold text-clinical-400 uppercase tracking-widest">Medical Control Centre</span>
          <h1 className="text-3xl font-bold tracking-tight">Good Day, Dr. {user?.name}</h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Monitor cognitive progress logs, analyze MRI file uploads, prescribe therapeutics, and manage scheduling slots.
          </p>
        </div>
      </div>

      {/* Quick shortcuts bar */}
      <div className="flex justify-end space-x-3">
        <Link
          to="/patients"
          className="flex items-center space-x-2 bg-clinical-600 hover:bg-clinical-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-clinical-600/10 transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          <span>Add Patient</span>
        </Link>
        <Link
          to="/appointments"
          className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-150"
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule Appointment</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{card.title}</span>
                <p className="text-3xl font-extrabold text-slate-800">{card.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${card.bg} ${card.color} shrink-0`}>
                <Icon className="h-6 w-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Upcoming appointments table */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800">Pending Clinic Appointments</h3>
            <p className="text-xs text-slate-400">View and update scheduling slots for today</p>
          </div>
          <Link
            to="/appointments"
            className="text-xs font-bold text-clinical-600 hover:text-clinical-500 flex items-center space-x-1"
          >
            <span>All Bookings</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-2">
              <Clock className="h-8 w-8 text-slate-300" />
              <span>No pending appointments scheduled.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-6">Patient Name</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/50">
                    <td className="p-4 pl-6 font-semibold text-slate-800">
                      <Link to={`/patient/${a.patientId?._id}`} className="hover:text-clinical-600 hover:underline">
                        {a.patientId?.name || 'Deleted Patient'}
                      </Link>
                    </td>
                    <td className="p-4">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4">{a.timeSlot}</td>
                    <td className="p-4 text-slate-500">{a.reason || 'Routine checkup'}</td>
                    <td className="p-4 pr-6 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Completed')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200/50 transition-all duration-150"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Cancelled')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200/50 transition-all duration-150"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
