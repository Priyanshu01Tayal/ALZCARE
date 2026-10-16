'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { usePatientsQuery, useAppointmentsQuery, useUpdateAppointmentStatusMutation } from '@/hooks/useApi';
import { Users, Calendar, BrainCircuit, FileText, Plus, Clock, ArrowRight, Smartphone, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

export default function DoctorDashboard() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const { data: patients = [], isLoading: loadingPatients } = usePatientsQuery();
  const { data: appointments = [], isLoading: loadingAppts, refetch } = useAppointmentsQuery();
  const updateStatusMutation = useUpdateAppointmentStatusMutation();

  const [stats, setStats] = useState({
    patientsCount: 0,
    appointmentsCount: 0,
    mrisPendingCount: 0,
    gamesAssignedCount: 0,
  });
  const [recentMobileActivity, setRecentMobileActivity] = useState<any[]>([]);

  const upcomingAppointments = appointments.filter((a: any) => a.status === 'Scheduled');

  const compileStats = async () => {
    if (patients.length === 0) return;

    let pendingMriTotal = 0;
    let activeGamesTotal = 0;

    await Promise.all(
      patients.map(async (p: any) => {
        try {
          const { data } = await apiClient.get(`/api/patients/${p._id}`);
          pendingMriTotal += (data.mris || []).filter((m: any) => m.status === 'Pending').length;
          activeGamesTotal += (data.games || []).filter((g: any) => g.status === 'Assigned').length;
        } catch (e) {
          console.error(e);
        }
      })
    );

    setStats({
      patientsCount: patients.length,
      appointmentsCount: upcomingAppointments.length,
      mrisPendingCount: pendingMriTotal,
      gamesAssignedCount: activeGamesTotal,
    });

    try {
      const { data: actData } = await apiClient.get('/api/doctors/activity');
      setRecentMobileActivity(actData.recentResults || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (patients.length > 0) {
      compileStats();
    } else {
      setStats((s) => ({ ...s, patientsCount: patients.length, appointmentsCount: upcomingAppointments.length }));
    }
  }, [patients, appointments]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingPatients || loadingAppts) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="h-10 w-10 rounded-full border-[3px] border-clinical-600 border-t-transparent"
        ></motion.div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Patients', value: stats.patientsCount, icon: Users, color: 'text-clinical-400', bg: 'bg-clinical-500/10 border-clinical-500/20', link: '/patients' },
    { title: 'Scheduled Appts', value: stats.appointmentsCount, icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', link: '/doctor/appointments' },
    { title: 'Pending MRI scans', value: stats.mrisPendingCount, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', link: '/patients' },
    { title: 'Active Game Prescriptions', value: stats.gamesAssignedCount, icon: BrainCircuit, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', link: '/patients' },
  ];

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-12">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-slate-900 to-clinical-950/40 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-white/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-clinical-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-bold text-clinical-400 uppercase tracking-widest">Medical Control Centre</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome back, Dr. {user?.name || 'Practitioner'}</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Monitor cognitive progress logs, evaluate patient MRI scans, dispatch cognitive exercise training, and adjust appointment lists.
          </p>
        </div>
      </motion.div>

      {/* Quick shortcuts bar */}
      <div className="flex justify-end space-x-3">
        <Link
          href="/patients"
          className="flex items-center space-x-2 bg-gradient-to-r from-clinical-600 to-clinical-550 hover:from-clinical-550 hover:to-clinical-450 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-clinical-600/10 transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Patient</span>
        </Link>
        <Link
          href="/doctor/appointments"
          className="flex items-center space-x-2 bg-slate-900 border border-white/10 text-slate-350 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
        >
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>Clinic Schedules</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              whileHover={{ y: -3 }}
              key={card.title}
            >
              <Link
                href={card.link}
                className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-white/15 transition-all duration-200 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{card.title}</span>
                  <p className="text-3xl font-extrabold text-white">{card.value}</p>
                </div>
                <div className={`p-4 rounded-xl shrink-0 ${card.bg} ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Upcoming appointments table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Scheduled Clinic Bookings</h3>
            <p className="text-[10px] text-slate-500">Manage and update active appointment lists</p>
          </div>
          <Link
            href="/doctor/appointments"
            className="text-xs font-bold text-clinical-400 hover:text-clinical-300 flex items-center space-x-1"
          >
            <span>All Bookings</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {upcomingAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Clock className="h-8 w-8 text-slate-600 animate-pulse" />
              <span>No clinic slots scheduled for today.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 text-[10px]">
                  <th className="p-4 pl-6">Patient Name</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-350 bg-slate-900/20">
                {upcomingAppointments.slice(0, 5).map((a: any) => (
                  <tr key={a._id} className="hover:bg-white/5 transition">
                    <td className="p-4 pl-6 font-bold text-white">
                      <Link href={`/patients/${a.patientId?._id}`} className="hover:text-clinical-400 hover:underline">
                        {a.patientId?.name || 'Deleted Patient'}
                      </Link>
                    </td>
                    <td className="p-4">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4 font-semibold text-slate-400">{a.timeSlot}</td>
                    <td className="p-4 text-slate-450">{a.reason || 'Routine checkup'}</td>
                    <td className="p-4 pr-6 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Completed')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg font-bold border border-emerald-500/20 transition text-[11px]"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Cancelled')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg font-bold border border-rose-500/20 transition text-[11px]"
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
      </motion.div>

      {/* Recent Patient Mobile Exercises Stream */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 backdrop-blur-md border border-clinical-500/20 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-clinical-500/10 border border-clinical-500/20 rounded-lg text-clinical-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Patient Mobile Exercises Stream</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 mr-1 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Live cognitive exercise results submitted from the mobile app</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {recentMobileActivity.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Activity className="h-8 w-8 text-slate-600 animate-pulse" />
              <span>No mobile exercise sessions submitted yet.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 text-[10px]">
                  <th className="p-4 pl-6">Patient</th>
                  <th className="p-4">Game Exercise</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Accuracy</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Completion Date</th>
                  <th className="p-4 pr-6 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-350 bg-slate-900/20">
                {recentMobileActivity.map((r: any) => (
                  <tr key={r._id} className="hover:bg-white/5 transition">
                    <td className="p-4 pl-6 font-bold text-white">
                      <Link href={`/patients/${r.patientId?._id}`} className="hover:text-clinical-400 hover:underline">
                        {r.patientId?.name || 'Patient'}
                      </Link>
                      <span className="text-[10px] text-slate-500 block">{r.patientId?.patientId}</span>
                    </td>
                    <td className="p-4 font-semibold text-clinical-400">{r.gameName}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{r.score}</td>
                    <td className="p-4 text-slate-300">{r.accuracy}%</td>
                    <td className="p-4 text-slate-400">{r.timeTaken}s</td>
                    <td className="p-4 text-slate-450">{new Date(r.completionDate || r.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 pr-6 text-right">
                      <Link
                        href={`/patients/${r.patientId?._id}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-clinical-400 hover:text-clinical-300"
                      >
                        <span>View Records</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
