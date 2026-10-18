'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useAppointmentsQuery, useUpdateAppointmentStatusMutation } from '@/hooks/useApi';
import { Calendar, Clock, ArrowRight, User, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DoctorAppointments() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const { data: appointments = [], refetch, isLoading } = useAppointmentsQuery();
  const updateStatusMutation = useUpdateAppointmentStatusMutation();

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const upcomingAppointments = appointments.filter((a: any) => a.status === 'Scheduled');
  const pastAppointments = appointments.filter((a: any) => a.status !== 'Scheduled');

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-16 font-sans">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2.5 text-clinical-400">
          <div className="p-2 rounded-lg bg-clinical-500/10 border border-clinical-500/20">
            <Calendar className="h-5 w-5 text-clinical-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-clinical-400">Clinical Scheduling</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          Clinic Appointments &amp; Schedules
        </h1>
        <p className="text-sm lg:text-base text-slate-400 max-w-2xl leading-relaxed">
          Manage upcoming patient consultations, cognitive evaluations, and clinic review bookings.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">Scheduled Consultations</h3>
            <p className="text-sm text-slate-400 mt-0.5">Active upcoming appointments awaiting completion</p>
          </div>
          <span className="text-xs font-semibold text-clinical-400 bg-clinical-500/10 border border-clinical-500/20 px-3 py-1 rounded-full">
            {upcomingAppointments.length} scheduled
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent" />
              <span>Loading appointment schedules...</span>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
              <Calendar className="h-10 w-10 text-slate-600 animate-pulse" />
              <span className="font-semibold text-slate-300">No active appointment bookings found.</span>
              <p className="text-xs text-slate-500">Patients can book visits via their mobile application, or you can schedule checkups from their profile.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-xs">
                  <th className="py-4 px-6">Patient Name</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Time Slot</th>
                  <th className="py-4 px-4">Consultation Purpose</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 bg-slate-900/20">
                {upcomingAppointments.map((a: any) => (
                  <tr key={a._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">
                      <Link href={`/patients/${a.patientId?._id}`} className="hover:text-clinical-400 hover:underline">
                        {a.patientId?.name || 'Patient'}
                      </Link>
                      <span className="text-xs text-slate-400 block font-mono mt-0.5">
                        {a.patientId?.patientId || 'PAT-0001'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="py-4 px-4 font-semibold text-slate-200 font-mono">{a.timeSlot}</td>
                    <td className="py-4 px-4 text-slate-300">{a.reason || 'General Cognitive Review'}</td>
                    <td className="py-4 px-6 text-right flex justify-end space-x-2.5">
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Completed')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl font-semibold transition text-xs cursor-pointer flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Complete</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Cancelled')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl font-semibold transition text-xs cursor-pointer flex items-center space-x-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
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
