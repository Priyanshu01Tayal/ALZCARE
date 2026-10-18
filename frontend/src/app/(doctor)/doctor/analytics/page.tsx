'use client';

import React, { useState, useEffect } from 'react';
import { usePatientsQuery } from '@/hooks/useApi';
import { PatientCognitiveAnalytics } from '@/components/doctor/PatientCognitiveAnalytics';
import { BrainCircuit, Users, User, Search, Activity, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DoctorCognitiveAnalyticsPage() {
  const { data: patients = [], isLoading } = usePatientsQuery();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');

  // Default to first patient when loaded
  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId && patients[0]?._id) {
      setSelectedPatientId(patients[0]._id);
    }
  }, [patients, selectedPatientId]);

  const activePatient = patients.find((p: any) => p._id === selectedPatientId);

  const filteredPatients = patients.filter(
    (p: any) =>
      p.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-16">
      {/* Header bar */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-clinical-400">
            <BrainCircuit className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-widest text-clinical-400">Clinical Neuroanalytics</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cognitive Performance &amp; Progress Tracking
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time longitudinal evaluation of patient memory retention, processing speed, spatial awareness, and cognitive exercise adherence.
          </p>
        </div>

        {/* Patient quick selector */}
        {patients.length > 0 && (
          <div className="flex items-center space-x-3 bg-slate-950/70 p-3 rounded-xl border border-white/10">
            <User className="h-4 w-4 text-clinical-400 shrink-0" />
            <div className="flex flex-col">
              <label htmlFor="patient-select" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Active Patient
              </label>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none pr-6 cursor-pointer"
              >
                {patients.map((p: any) => (
                  <option key={p._id} value={p._id} className="bg-slate-900 text-white">
                    {p.name} ({p.patientId || 'PAT'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center bg-slate-950">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-white/10 rounded-2xl space-y-4">
          <BrainCircuit className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Enrolled Patients</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You need to register patients before cognitive exercise results can be tracked.
          </p>
          <Link
            href="/patients"
            className="inline-flex items-center space-x-2 bg-clinical-600 hover:bg-clinical-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            <Users className="h-4 w-4" />
            <span>Go to Patient Directory</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Patient roster sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Users className="h-3.5 w-3.5 text-clinical-400" />
                  <span>Patient Roster</span>
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {patients.length}
                </span>
              </div>

              {/* Patient search input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter roster..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-clinical-500/50"
                />
              </div>

              {/* Roster list */}
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredPatients.map((p: any) => {
                  const isSelected = p._id === selectedPatientId;
                  return (
                    <button
                      key={p._id}
                      onClick={() => setSelectedPatientId(p._id)}
                      className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-clinical-600/20 border-clinical-500/50 text-white shadow-md shadow-clinical-600/10'
                          : 'bg-slate-950/40 border-white/5 text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold truncate flex items-center space-x-1.5">
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.patientId || 'PAT'} &bull; {p.age || '—'}y
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition ${isSelected ? 'text-clinical-400 translate-x-0.5' : 'text-slate-600'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Detailed Analytics component */}
          <div className="lg:col-span-3">
            {selectedPatientId && (
              <PatientCognitiveAnalytics
                patientId={selectedPatientId}
                patientName={activePatient?.name || 'Selected Patient'}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
