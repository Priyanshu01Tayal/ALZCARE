'use client';

import React, { useState, useEffect } from 'react';
import { usePatientsQuery } from '@/hooks/useApi';
import { PatientCognitiveAnalytics } from '@/components/doctor/PatientCognitiveAnalytics';
import { BrainCircuit, Users, User, Search, Activity, ChevronRight, Sparkles, Filter } from 'lucide-react';
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
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-16 font-sans">
      {/* Header bar */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-6 lg:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5 text-clinical-400">
            <div className="p-2 rounded-lg bg-clinical-500/10 border border-clinical-500/20">
              <BrainCircuit className="h-5 w-5 text-clinical-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-clinical-400">Clinical Neuroanalytics</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Cognitive Analytics
          </h1>
          <p className="text-sm lg:text-base text-slate-400 max-w-2xl leading-relaxed">
            Longitudinal evaluation of patient memory recall, motor processing speed, spatial awareness, and cognitive rehabilitation exercise engagement.
          </p>
        </div>

        {/* Patient quick selector */}
        {patients.length > 0 && (
          <div className="flex items-center space-x-3.5 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 shadow-inner shrink-0 self-start md:self-auto">
            <div className="h-10 w-10 rounded-full bg-clinical-500/15 border border-clinical-500/30 flex items-center justify-center text-clinical-400 shrink-0 font-bold">
              {activePatient?.name?.charAt(0) || <User className="h-5 w-5" />}
            </div>
            <div className="flex flex-col min-w-[180px]">
              <label htmlFor="patient-select" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Selected Patient
              </label>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-transparent text-white font-semibold text-sm focus:outline-none pr-4 cursor-pointer mt-0.5"
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
        <div className="flex flex-col h-96 items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent shadow-lg shadow-clinical-600/20"></div>
          <p className="text-sm font-medium text-slate-400">Loading patient cognitive records...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl">
          <BrainCircuit className="h-14 w-14 text-slate-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Enrolled Patients</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            You need to register patients before cognitive exercise telemetry and progress can be tracked.
          </p>
          <div className="pt-2">
            <Link
              href="/patients"
              className="inline-flex items-center space-x-2 bg-clinical-600 hover:bg-clinical-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-clinical-600/20"
            >
              <Users className="h-4 w-4" />
              <span>Go to Patient Directory</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left: Patient roster sidebar */}
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 lg:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Users className="h-5 w-5 text-clinical-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">Patient Roster</h2>
                </div>
                <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700/60">
                  {patients.length} enrolled
                </span>
              </div>

              {/* Patient search input */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient name or ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-clinical-500 transition shadow-inner"
                />
              </div>

              {/* Roster list */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredPatients.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No patients match "{searchFilter}"
                  </div>
                ) : (
                  filteredPatients.map((p: any) => {
                    const isSelected = p._id === selectedPatientId;
                    return (
                      <button
                        key={p._id}
                        onClick={() => setSelectedPatientId(p._id)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer border ${
                          isSelected
                            ? 'bg-clinical-600/15 border-clinical-500 text-white shadow-lg shadow-clinical-600/10'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 truncate">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isSelected
                                ? 'bg-clinical-600 text-white border-clinical-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {p.name?.charAt(0) || 'P'}
                          </div>
                          <div className="truncate min-w-0">
                            <div className="text-sm font-semibold truncate text-white">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {p.patientId || 'PAT-0001'} &bull; {p.age ? `${p.age}y` : 'Age N/A'}
                            </div>
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 shrink-0 transition-transform ${
                            isSelected ? 'text-clinical-400 translate-x-1' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Detailed Analytics component */}
          <div className="xl:col-span-8">
            {selectedPatientId ? (
              <PatientCognitiveAnalytics
                patientId={selectedPatientId}
                patientName={activePatient?.name || 'Selected Patient'}
              />
            ) : (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                Select a patient from the roster to view cognitive telemetry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
