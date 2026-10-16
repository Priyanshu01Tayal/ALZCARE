'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useAppointmentsQuery, useUpdateAppointmentStatusMutation } from '@/hooks/useApi';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DoctorAppointments() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const { data: appointments = [], refetch } = useAppointmentsQuery();
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

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-12">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">Clinic Appointments Manager</h1>
        <p className="text-xs text-slate-400">View and update scheduling records for all registered patients.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">Scheduled Clinic Bookings</h3>
        </div>

        <div className="overflow-x-auto">
          {upcomingAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Calendar className="h-8 w-8 text-slate-600 animate-pulse" />
              <span>No active appointment bookings found.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 text-[10px]">
                  <th className="p-4 pl-6">Patient Name</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-350 bg-slate-900/20">
                {upcomingAppointments.map((a: any) => (
                  <tr key={a._id} className="hover:bg-white/5 transition">
                    <td className="p-4 pl-6 font-bold text-white">
                      <Link href={`/patients/${a.patientId?._id}`} className="hover:text-clinical-400 hover:underline">
                        {a.patientId?.name || 'Unknown Patient'}
                      </Link>
                    </td>
                    <td className="p-4">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4 font-semibold text-slate-400">{a.timeSlot}</td>
                    <td className="p-4 text-slate-450">{a.reason || 'General Checkup'}</td>
                    <td className="p-4 pr-6 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Completed')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg font-bold transition text-[11px]"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(a._id, 'Cancelled')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3.5 py-1.5 rounded-lg font-bold transition text-[11px]"
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
    </div>
  );
}
