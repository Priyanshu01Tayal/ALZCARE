import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Calendar,
  BrainCircuit,
  FileText,
  User,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPatientProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getPatientById(user._id || user.user?._id);
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load patient profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
      </div>
    );
  }

  const { doctor, prescriptions, mris, games, appointments } = profile || {};

  const upcomingAppt = appointments?.find((a) => a.status === 'Scheduled');
  const pendingGames = games?.filter((g) => g.status === 'Assigned') || [];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Patient Health Portal</span>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {user?.name}</h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Access your doctor prescriptions, track cognitive game milestones, and view scheduled appointments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick metrics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <Link
              to="/patient-games"
              className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assigned Games</span>
                <p className="text-2xl font-extrabold text-slate-800">{pendingGames.length}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-50 text-violet-600 shrink-0">
                <BrainCircuit className="h-5 w-5" />
              </div>
            </Link>

            <Link
              to="/patient-records"
              className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Prescriptions</span>
                <p className="text-2xl font-extrabold text-slate-800">{prescriptions?.length || 0}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-clinical-50 text-clinical-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            </Link>

            <Link
              to="/patient-records"
              className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">MRI Uploads</span>
                <p className="text-2xl font-extrabold text-slate-800">{mris?.length || 0}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Activity className="h-5 w-5" />
              </div>
            </Link>

          </div>

          {/* Upcoming Appointment Info */}
          <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-clinical-600" />
              <span>Next Scheduled Appointment</span>
            </h3>

            {upcomingAppt ? (
              <div className="bg-clinical-50/20 border border-clinical-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-clinical-700 block">Date & Time</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {new Date(upcomingAppt.date).toLocaleDateString()} at {upcomingAppt.timeSlot}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Reason: {upcomingAppt.reason || 'General clinical inspection'}
                  </span>
                </div>
                <Link
                  to="/patient-appointments"
                  className="bg-clinical-600 hover:bg-clinical-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 self-start sm:self-auto shadow-md shadow-clinical-600/10"
                >
                  <span>Reschedule</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-450 text-xs bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <p>You do not have any pending appointments.</p>
                <Link
                  to="/patient-appointments"
                  className="inline-flex items-center space-x-1 text-clinical-600 font-bold hover:underline"
                >
                  <span>Book one now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Doctor card & daily cognitive tips */}
        <div className="space-y-6">
          {/* Doctor Details */}
          {doctor && (
            <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5 text-slate-400" />
                <span>Assigned Practitioner</span>
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center space-x-3">
                <div className="h-12 w-12 bg-clinical-600 text-white font-bold rounded-full flex items-center justify-center shrink-0 shadow-md">
                  {doctor.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-800 text-sm truncate">Dr. {doctor.name}</h4>
                  <span className="text-xs text-clinical-600 font-semibold bg-clinical-50 border border-clinical-150 px-2 py-0.5 rounded-full inline-block mt-1">
                    {doctor.specialization}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 truncate">{doctor.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Daily cognitive support tip card */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm flex items-center space-x-2 text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>Cognitive Fitness Tip</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Stimulating working memory regularly with puzzles, physical exercise, and consistent sleeping patterns preserves neural pathways and slows cognitive decline.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;
