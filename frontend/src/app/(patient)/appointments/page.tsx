'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useAppointmentsQuery, useBookAppointmentMutation } from '@/hooks/useApi';
import { Calendar, Clock, ClipboardList, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientAppointments() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const { data: appointments = [], refetch } = useAppointmentsQuery();
  const bookAppointmentMutation = useBookAppointmentMutation();

  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await bookAppointmentMutation.mutateAsync({
        patientId: user._id,
        date,
        timeSlot,
        reason,
      });
      setDate('');
      setReason('');
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const myAppointments = appointments.filter((a: any) => {
    const patientIdStr = typeof a.patientId === 'object' ? a.patientId?._id : a.patientId;
    return patientIdStr === user?._id;
  });

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-12">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">Clinic Appointments</h1>
        <p className="text-xs text-slate-400">Book diagnostic checkups or consulting sessions with your doctor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-fit space-y-5 shadow-xl">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Book Appointment Slot</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">
                Appointment Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 focus:border-emerald-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">
                Time Slot Selection
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 focus:border-emerald-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">
                Booking Purpose / Details
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Cognitive status review or MRI report consultation"
                className="w-full bg-slate-950/60 border border-white/5 focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-xs placeholder-slate-500 focus:outline-none text-slate-100 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={bookAppointmentMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg uppercase tracking-wider"
            >
              {bookAppointmentMutation.isPending ? 'Confirming...' : 'Book Slot'}
            </button>
          </form>
        </div>

        {/* Directory List */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-bold text-slate-350 text-xs uppercase tracking-wider">My Scheduled Bookings</h4>
          
          {myAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/20 border border-white/10 rounded-xl">
              No clinic dates scheduled yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myAppointments.map((appt: any) => (
                <div key={appt._id} className="p-4 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between hover:border-white/15 transition">
                  <div className="space-y-1.5 overflow-hidden pr-3">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Date: {new Date(appt.date).toLocaleDateString()} at <strong className="text-white">{appt.timeSlot}</strong>
                    </span>
                    <span className="font-bold text-white text-xs block leading-snug">
                      {appt.reason || 'General checkup consultation'}
                    </span>
                    <span className="text-[9px] font-bold block text-slate-650 uppercase">
                      Created on {new Date(appt.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                      appt.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : appt.status === 'Cancelled'
                        ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                        : 'bg-clinical-500/10 text-clinical-400 border-clinical-500/20'
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
