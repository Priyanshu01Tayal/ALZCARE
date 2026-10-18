'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  BrainCircuit,
  ClipboardList,
  ArrowLeft,
  UploadCloud,
  CheckCircle,
  Clock,
  Trash2,
  FileCode,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  usePatientQuery,
  useUploadMriMutation,
  useAnalyzeMriMutation,
  useCreatePrescriptionMutation,
  useAssignGameMutation,
  useBookAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useGameResultsQuery,
  usePatientTimelineQuery,
} from '@/hooks/useApi';
import { useToastStore } from '@/lib/stores/toast';
import { PatientCognitiveAnalytics } from '@/components/doctor/PatientCognitiveAnalytics';

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState('mris');

  // MRI state
  const [mriFile, setMriFile] = useState<File | null>(null);
  const [aiMessage, setAiMessage] = useState<any>(null);

  // Prescription Form state
  const [rxNotes, setRxNotes] = useState('');
  const [rxMeds, setRxMeds] = useState<any[]>([]);
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '' });

  // Game Form state
  const [gameName, setGameName] = useState('Memory Match');
  const [gameDifficulty, setGameDifficulty] = useState('Medium');
  const [gameDueDate, setGameDueDate] = useState('');
  const [gameFrequency, setGameFrequency] = useState('Daily');
  const [gameRepetitions, setGameRepetitions] = useState('1');
  const [gameNotes, setGameNotes] = useState('');

  // Appointment Form state
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    timeSlot: '10:00 AM',
    reason: '',
  });

  const { data: detailData, isLoading, refetch } = usePatientQuery(id);
  const { data: gameResults = [], refetch: refetchResults } = useGameResultsQuery(id);
  const { data: timeline = [], refetch: refetchTimeline } = usePatientTimelineQuery(id);

  const uploadMriMutation = useUploadMriMutation();
  const analyzeMriMutation = useAnalyzeMriMutation();
  const createPrescriptionMutation = useCreatePrescriptionMutation();
  const assignGameMutation = useAssignGameMutation();
  const bookAppointmentMutation = useBookAppointmentMutation();
  const updateAppointmentMutation = useUpdateAppointmentStatusMutation();

  const handleMriUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mriFile) return;

    const formData = new FormData();
    formData.append('mri', mriFile);
    formData.append('patientId', id);

    try {
      await uploadMriMutation.mutateAsync(formData);
      setMriFile(null);
      const input = document.getElementById('mri-file-input') as HTMLInputElement;
      if (input) input.value = '';
      refetch();
      refetchTimeline();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestAi = async () => {
    try {
      setAiMessage(null);
      const res = await analyzeMriMutation.mutateAsync({ patientId: id });
      setAiMessage(res);
      refetch();
      refetchTimeline();
    } catch (err) {
      console.error(err);
      setAiMessage({
        status: 'error',
        message: 'Failed to analyze MRI scan.'
      });
    }
  };

  const addMedication = () => {
    if (!medForm.name || !medForm.dosage || !medForm.frequency) return;
    setRxMeds([...rxMeds, medForm]);
    setMedForm({ name: '', dosage: '', frequency: '' });
  };

  const removeMedication = (idx: number) => {
    setRxMeds(rxMeds.filter((_, i) => i !== idx));
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxNotes) return;

    try {
      await createPrescriptionMutation.mutateAsync({
        patientId: id,
        notes: rxNotes,
        medications: rxMeds,
      });
      setRxNotes('');
      setRxMeds([]);
      refetch();
      refetchTimeline();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignGameMutation.mutateAsync({
        patientId: id,
        gameName,
        difficulty: gameDifficulty,
        dueDate: gameDueDate || undefined,
        frequency: gameFrequency,
        repetitions: Number(gameRepetitions),
        notes: gameNotes,
      });
      setGameDueDate('');
      setGameNotes('');
      refetch();
      refetchResults();
      refetchTimeline();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookAppointmentMutation.mutateAsync({
        patientId: id,
        date: appointmentForm.date,
        timeSlot: appointmentForm.timeSlot,
        reason: appointmentForm.reason,
      });
      setAppointmentForm({ date: '', timeSlot: '10:00 AM', reason: '' });
      refetch();
      refetchTimeline();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
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

  if (!detailData) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-950 min-h-screen flex items-center justify-center">
        Patient record not found.
      </div>
    );
  }

  const {
    patient,
    prescriptions = [],
    mris = [],
    games = [],
    appointments = [],
    mobileActivity,
    recentActivity = [],
  } = detailData;

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    return `${d.toLocaleDateString()} ${timeStr}`;
  };

  const tabHeaders = [
    { id: 'mris', label: 'MRI Scans', icon: FileCode },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'games', label: 'Cognitive Support', icon: BrainCircuit },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'timeline', label: 'Milestones Timeline', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6 bg-slate-950 text-slate-100 pb-12">
      {/* Back button */}
      <Link
        href="/patients"
        className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition font-bold group"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Patient Directory</span>
      </Link>

      {/* Demographics header */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl grid grid-cols-1 lg:grid-cols-4 gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-clinical-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center space-x-4 lg:col-span-1 lg:border-r border-white/10 lg:pr-6 z-10">
          <div className="h-16 w-16 bg-gradient-to-tr from-clinical-600 to-clinical-550 text-white rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg">
            {patient.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{patient.name}</h2>
            <span className="text-xs text-slate-400 font-mono block mt-1">{patient.patientId || 'PAT-XXXX'}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{patient.email}</span>
            <div className="flex space-x-2 mt-2.5">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 border border-white/5 rounded-full text-slate-350">
                {patient.age} years
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 border border-white/5 rounded-full text-slate-350">
                {patient.gender}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 z-10 flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Clinical History Summary
          </span>
          <p className="text-xs text-slate-350 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/5">
            {patient.medicalHistory || 'No previous medical history recorded.'}
          </p>
        </div>
      </div>

      {/* Patient Mobile Activity Live Card */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-clinical-500/20 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-clinical-500/10 border border-clinical-500/20 rounded-xl text-clinical-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm">Patient Mobile App Activity</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 mr-1.5 animate-pulse"></span>
                  Live Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time synchronization with AlzCare Patient Mobile App (Expo)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              refetch();
              refetchResults();
              refetchTimeline();
            }}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-white/10 transition self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Mobile Data</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-450 uppercase block">Last Active</span>
            <strong className="text-sm font-extrabold text-white block mt-1">
              {formatLastActive(mobileActivity?.lastActive || patient.lastActive || patient.updatedAt)}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-450 uppercase block">Last Game</span>
            <strong className="text-sm font-extrabold text-clinical-400 block mt-1 truncate">
              {mobileActivity?.lastGame?.gameName || 'None yet'}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-450 uppercase block">Score</span>
            <strong className="text-sm font-extrabold text-emerald-400 block mt-1">
              {mobileActivity?.lastGame?.score ?? '--'}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-450 uppercase block">Completed</span>
            <strong className="text-sm font-extrabold text-white block mt-1">
              {mobileActivity?.lastGame ? 'Yes' : 'No'}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-450 uppercase block">Attempts</span>
            <strong className="text-sm font-extrabold text-amber-400 block mt-1">
              {mobileActivity?.attempts ?? gameResults.length}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-450 uppercase block">Contact</span>
            <strong className="text-xs font-semibold text-slate-300 block mt-1 truncate">
              {patient.phone || 'No phone set'}
            </strong>
          </div>
        </div>

        {patient.emergencyContact?.name && (
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-x-4 text-[11px] text-slate-400">
            <span>
              <strong className="text-slate-300">Emergency Contact:</strong> {patient.emergencyContact.name}{' '}
              ({patient.emergencyContact.relation || 'Caregiver'}) • {patient.emergencyContact.phone}
            </span>
            {patient.address && (
              <span>
                <strong className="text-slate-300">Address:</strong> {patient.address}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-white/10 space-x-2">
        {tabHeaders.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider relative transition-all duration-300 ${
                isActive ? 'text-clinical-450 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderlineDetailsDoc"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-clinical-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Viewport */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl min-h-96">
        <AnimatePresence mode="wait">
          
          {/* MRI Tab */}
          {activeTab === 'mris' && (
            <motion.div
              key="details-mri-doc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Upload column */}
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 h-fit space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Upload MRI Scan</h4>
                  
                  <form onSubmit={handleMriUpload} className="space-y-4">
                    <div className="border border-dashed border-white/10 hover:border-clinical-500/50 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-900/20 transition duration-150 cursor-pointer relative group">
                      <input
                        type="file"
                        id="mri-file-input"
                        required
                        onChange={(e) => setMriFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <UploadCloud className="h-8 w-8 text-slate-500 mb-2 group-hover:text-clinical-400 group-hover:scale-105 transition-all" />
                      <span className="text-xs text-slate-300 font-semibold text-center truncate w-full px-4">
                        {mriFile ? mriFile.name : 'Select MRI scan file'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">PNG, JPG, JPEG up to 10MB</span>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={uploadMriMutation.isPending || !mriFile}
                      className="w-full bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 disabled:from-slate-800 disabled:to-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg"
                    >
                      {uploadMriMutation.isPending ? 'Uploading...' : 'Submit Report'}
                    </button>
                  </form>

                  <div className="border-t border-white/5 pt-4">
                    <button
                      onClick={handleTestAi}
                      disabled={analyzeMriMutation.isPending}
                      className="w-full bg-slate-850 hover:bg-slate-800 disabled:bg-slate-800 text-white border border-white/10 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      {analyzeMriMutation.isPending ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1"></span>
                          <span>Analyzing scan...</span>
                        </>
                      ) : (
                        <span>Run Model Prediction</span>
                      )}
                    </button>
                    
                    {aiMessage && (
                      <div className={`mt-4 p-4 rounded-xl text-[11px] space-y-1.5 border ${
                        aiMessage.status === 'error'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-350'
                          : 'bg-clinical-500/10 border-clinical-500/20 text-clinical-350'
                      }`}>
                        <p className="font-bold uppercase tracking-wider text-[9px] flex justify-between">
                          <span>AI Engine status:</span>
                          <span>{aiMessage.status}</span>
                        </p>
                        {aiMessage.prediction && <p><strong>Prediction:</strong> <span className="text-white font-bold">{aiMessage.prediction}</span></p>}
                        {aiMessage.confidence && <p><strong>Confidence:</strong> <span className="text-white font-bold">{aiMessage.confidence}%</span></p>}
                        {aiMessage.message && <p className="text-slate-400 leading-relaxed mt-1">{aiMessage.message}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploads list column */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-350 text-xs uppercase tracking-wider">MRI Diagnosis History</h4>
                  {mris.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 border border-white/5 rounded-xl">
                      No MRI scan reports uploaded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mris.map((m: any) => (
                        <div key={m._id} className="p-4 bg-slate-950/50 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition">
                          <div className="space-y-1 overflow-hidden pr-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono bg-slate-900 border border-white/5 text-slate-450 px-2 py-0.5 rounded text-[9px] font-bold">
                                {m.mriId || 'PENDING'}
                              </span>
                              <span className="font-bold text-white text-xs truncate">
                                {m.fileName || m.filename}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 block mt-1">
                              Uploaded on {new Date(m.createdAt).toLocaleDateString()}
                            </span>
                            
                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-450 text-[9px] font-bold border border-emerald-500/10">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" /> Upload Successful
                              </span>
                              {m.status === 'Completed' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-clinical-500/10 text-clinical-400 text-[9px] font-bold border border-clinical-500/10">
                                  <BrainCircuit className="h-2.5 w-2.5 mr-1 animate-pulse" /> {m.result || m.prediction}
                                </span>
                              )}
                              {m.status === 'Pending' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold border border-amber-500/10">
                                  <Clock className="h-2.5 w-2.5 mr-1 animate-pulse" /> AI Processing
                                </span>
                              )}
                              {m.status === 'Error' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-bold border border-rose-500/10">
                                  ⚠️ {m.result || 'Analysis Failed'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <a
                            href={`http://localhost:5000${m.filePath || m.filepath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition"
                          >
                            View File
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <motion.div
              key="details-prescriptions-doc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Creator Column */}
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 h-fit space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Write Prescription</h4>
                  
                  <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">
                        Clinical Assessment Notes
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={rxNotes}
                        onChange={(e) => setRxNotes(e.target.value)}
                        placeholder="Write dynamic evaluation comments, recommendations, dosage steps..."
                        className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-slate-100 resize-none animate-none"
                      />
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Add Prescribed Medications
                      </span>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Medicine name (e.g. Donepezil)"
                          value={medForm.name}
                          onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                          className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Dosage (e.g. 5mg)"
                            value={medForm.dosage}
                            onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                            className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Freq (e.g. Once daily)"
                            value={medForm.frequency}
                            onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                            className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addMedication}
                          className="w-full py-2 border border-dashed border-white/10 hover:bg-white/5 hover:border-white/20 text-[10px] text-slate-400 font-bold rounded-lg transition uppercase tracking-wider"
                        >
                          + Add Medicine
                        </button>
                      </div>
                    </div>

                    {rxMeds.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">Pending items to save:</span>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {rxMeds.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 border border-white/5 rounded-lg text-xs">
                              <div className="truncate pr-2">
                                <strong className="text-white">{m.name}</strong> • {m.dosage} ({m.frequency})
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMedication(idx)}
                                className="text-rose-500 hover:text-rose-455 p-1 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!rxNotes}
                      className="w-full bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 disabled:from-slate-800 disabled:to-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg mt-3"
                    >
                      Authorize Prescription
                    </button>
                  </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-350 text-xs uppercase tracking-wider">Clinical Prescriptions Log</h4>
                  
                  {prescriptions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 border border-white/5 rounded-xl">
                      No prescription forms stored for this patient profile.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((pr: any) => (
                        <div key={pr._id} className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition">
                          <div className="flex justify-between items-start pb-3 border-b border-white/5 mb-3">
                            <span className="text-[10px] font-bold text-slate-450 uppercase">
                              Rx Record: {new Date(pr.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold text-clinical-400">
                              By Dr. {pr.doctor?.name || 'Physician'}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-white/5">
                            {pr.notes}
                          </p>

                          {pr.medications && pr.medications.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Authorized Meds</span>
                              <div className="border border-white/5 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-900/60 font-bold border-b border-white/5 text-[9px] uppercase text-slate-400">
                                      <th className="p-2">Name</th>
                                      <th className="p-2">Dosage</th>
                                      <th className="p-2">Frequency</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 text-slate-300 bg-slate-900/20">
                                    {pr.medications.map((m: any, idx: number) => (
                                      <tr key={idx}>
                                        <td className="p-2 font-bold text-clinical-400">{m.name}</td>
                                        <td className="p-2">{m.dosage}</td>
                                        <td className="p-2 text-slate-450">{m.frequency}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* Cognitive Support Tab */}
          {activeTab === 'games' && (
            <motion.div
              key="details-games-doc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Assignment column */}
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 h-fit space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Assign Game Exercise</h4>
                  
                  <form onSubmit={handleAssignGame} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">
                        Exercise Program
                      </label>
                      <select
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                      >
                        <option value="Memory Match">Memory Match (Visual Recall)</option>
                        <option value="Visual Search">Visual Search (Attention & Focus)</option>
                        <option value="Speed Tap">Speed Tap (Motor Reflex & Speed)</option>
                        <option value="Pattern Sequence">Pattern Sequence (Working Memory)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">
                          Difficulty
                        </label>
                        <select
                          value={gameDifficulty}
                          onChange={(e) => setGameDifficulty(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">
                          Frequency
                        </label>
                        <select
                          value={gameFrequency}
                          onChange={(e) => setGameFrequency(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Twice a week">Twice a week</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Once">Once</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">
                          Repetitions
                        </label>
                        <select
                          value={gameRepetitions}
                          onChange={(e) => setGameRepetitions(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                        >
                          <option value="1">1 time</option>
                          <option value="2">2 times</option>
                          <option value="3">3 times</option>
                          <option value="5">5 times</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={gameDueDate}
                          onChange={(e) => setGameDueDate(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">
                        Clinical Notes / Guidance
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Play after morning medication"
                        value={gameNotes}
                        onChange={(e) => setGameNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={assignGameMutation.isPending}
                      className="w-full bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 disabled:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg uppercase tracking-wider"
                    >
                      {assignGameMutation.isPending ? 'Assigning...' : 'Dispatch Assignment'}
                    </button>
                  </form>
                </div>

                {/* Logs column */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-350 text-xs uppercase tracking-wider mb-4">Assigned Games Tracking</h4>
                    
                    {games.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 border border-white/5 rounded-xl">
                        No cognitive support games assigned yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {games.map((g: any) => (
                          <div key={g._id} className="p-4 bg-slate-950/50 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition">
                            <div className="space-y-1 pr-3 overflow-hidden">
                              <span className="font-bold text-white text-xs block">
                                {g.gameName}
                              </span>
                              <span className="text-[10px] text-slate-450 block">
                                Difficulty: <strong className="text-clinical-400 font-semibold">{g.difficulty || 'Medium'}</strong>
                                {g.dueDate && ` • Due by ${new Date(g.dueDate).toLocaleDateString()}`}
                              </span>
                              <span className="text-[9px] text-slate-550 block">
                                Assigned on {new Date(g.assignedAt || g.createdAt).toLocaleDateString()}
                                {g.completedAt && ` • Completed on ${new Date(g.completedAt).toLocaleDateString()}`}
                              </span>
                            </div>

                            <div>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                                  g.status === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {g.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comprehensive Cognitive Analytics Section */}
                  <div className="pt-6 border-t border-white/5 space-y-6">
                    <PatientCognitiveAnalytics
                      patientId={id}
                      patientName={patient?.name}
                      onRefresh={() => {
                        refetch();
                        refetchResults();
                      }}
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <motion.div
              key="details-appointments-doc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Booking Column */}
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 h-fit space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Schedule Appointment Slot</h4>
                  
                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        required
                        value={appointmentForm.date}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                        className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">
                        Time Slot Selection
                      </label>
                      <select
                        value={appointmentForm.timeSlot}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, timeSlot: e.target.value })}
                        className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
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
                        value={appointmentForm.reason}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                        placeholder="e.g. Cognitive status review or MRI report consultation"
                        className="w-full bg-slate-900 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-slate-100 resize-none animate-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg uppercase tracking-wider"
                    >
                      Confirm Appointment slot
                    </button>
                  </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-350 text-xs uppercase tracking-wider">Scheduled Bookings Directory</h4>
                  
                  {appointments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 border border-white/5 rounded-xl">
                      No appointment dates scheduled yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((appt: any) => (
                        <div key={appt._id} className="p-4 bg-slate-950/50 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition">
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
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
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
            </motion.div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <motion.div
              key="details-timeline-doc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h4 className="font-bold text-slate-350 text-xs uppercase tracking-wider">Patient History Milestones</h4>
              
              {timeline.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 border border-white/5 rounded-xl">
                  No clinical milestones logged yet.
                </div>
              ) : (
                <div className="relative border-l border-white/10 ml-4 pl-6 space-y-8 py-2">
                  {timeline.map((item: any, idx: number) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="relative"
                    >
                      <span className="absolute -left-[31px] top-1.5 bg-slate-950 border border-clinical-600 rounded-full h-3.5 w-3.5 flex items-center justify-center shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-clinical-500"></span>
                      </span>
                      
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        <strong className="text-sm font-bold text-white block">
                          {item.title}
                        </strong>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl bg-white/5 p-3 rounded-lg border border-white/5">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
