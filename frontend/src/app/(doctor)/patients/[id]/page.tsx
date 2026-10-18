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
  Plus,
  Activity,
  AlertCircle,
  User,
  ShieldCheck,
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
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', instructions: '', status: 'Active' });

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
      addToast('Scan Uploaded', 'MRI scan successfully registered for clinical analysis.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Upload Failed', 'Failed to upload MRI scan file.', 'error');
    }
  };

  const handleTestAi = async () => {
    try {
      setAiMessage(null);
      const res = await analyzeMriMutation.mutateAsync({ patientId: id });
      setAiMessage(res);
      refetch();
      refetchTimeline();
      addToast('AI Analysis Complete', 'Inference completed successfully.', 'success');
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
    setRxMeds([...rxMeds, { ...medForm, status: medForm.status || 'Active' }]);
    setMedForm({ name: '', dosage: '', frequency: '', instructions: '', status: 'Active' });
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
      addToast('Prescription Authorized', 'Prescription saved to patient profile and synchronized.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed', 'Could not save prescription.', 'error');
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
      addToast('Cognitive Task Dispatched', 'Exercise added to mobile app regimen.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed', 'Could not assign cognitive task.', 'error');
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
      addToast('Appointment Scheduled', 'Booking confirmed for patient.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Booking Failed', 'Could not schedule appointment slot.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
          <span className="text-sm font-medium text-slate-400">Loading patient dossier...</span>
        </div>
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="p-12 text-center text-slate-400 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-slate-600" />
        <p className="text-lg font-semibold text-white">Patient record not found</p>
        <Link
          href="/patients"
          className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold inline-flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Patient Directory</span>
        </Link>
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
    if (!dateString) return 'Never recorded';
    const d = new Date(dateString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today at ${timeStr}`;
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  const tabHeaders = [
    { id: 'mris', label: 'MRI Scans', icon: FileCode },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'games', label: 'Cognitive Support & Analytics', icon: BrainCircuit },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'timeline', label: 'Milestones Timeline', icon: ClipboardList },
  ];

  return (
    <div className="space-y-8 text-slate-100 pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition font-semibold group bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform text-teal-400" />
          <span>Back to Assigned Patients</span>
        </Link>
      </div>

      {/* Demographics header */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 p-6 lg:p-8 rounded-2xl shadow-xl grid grid-cols-1 lg:grid-cols-4 gap-6 relative overflow-hidden">
        <div className="flex items-start sm:items-center space-x-5 lg:col-span-1 lg:border-r border-slate-800 lg:pr-6 z-10">
          <div className="h-16 w-16 bg-gradient-to-tr from-teal-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg shadow-teal-500/20">
            {patient.name?.charAt(0) || 'P'}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {patient.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                {patient.patientId || 'PAT-XXXX'}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {patient.age} yrs • {patient.gender}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono block pt-0.5">{patient.email}</span>
          </div>
        </div>

        <div className="lg:col-span-3 z-10 flex flex-col justify-center space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Clinical Diagnostic &amp; Medical History
          </span>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-4 lg:p-5 rounded-xl border border-slate-800">
            {patient.medicalHistory || 'No previous clinical medical history recorded for this patient profile.'}
          </p>
        </div>
      </div>

      {/* Patient Mobile Activity Live Card */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-teal-500/30 p-6 lg:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Patient Mobile App Live Activity</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time patient telemetry from the AlzCare Mobile Patient Application
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              refetch();
              refetchResults();
              refetchTimeline();
              addToast('Synchronized', 'Fetched latest telemetry from mobile database.', 'info');
            }}
            className="inline-flex items-center space-x-2 h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Mobile Data</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Last Active</span>
            <strong className="text-sm lg:text-base font-bold text-white block mt-1.5 truncate">
              {formatLastActive(mobileActivity?.lastActive || patient.lastActive || patient.updatedAt)}
            </strong>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Last Game</span>
            <strong className="text-sm lg:text-base font-bold text-teal-400 block mt-1.5 truncate">
              {mobileActivity?.lastGame?.gameName || 'None yet'}
            </strong>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Recent Score</span>
            <strong className="text-xl font-extrabold text-emerald-400 block mt-1">
              {mobileActivity?.lastGame?.score ?? '--'}
            </strong>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Status</span>
            <strong className="text-sm lg:text-base font-bold text-white block mt-1.5">
              {mobileActivity?.lastGame ? 'Completed' : 'Pending'}
            </strong>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Attempts</span>
            <strong className="text-xl font-extrabold text-amber-400 block mt-1">
              {mobileActivity?.attempts ?? gameResults.length}
            </strong>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Phone Contact</span>
            <strong className="text-sm font-semibold text-slate-300 block mt-1.5 truncate">
              {patient.phone || 'Not set'}
            </strong>
          </div>
        </div>

        {patient.emergencyContact?.name && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400">
            <span>
              <strong className="text-slate-200">Emergency Contact:</strong> {patient.emergencyContact.name}{' '}
              ({patient.emergencyContact.relation || 'Caregiver'}) • {patient.emergencyContact.phone}
            </span>
            {patient.address && (
              <span>
                <strong className="text-slate-200">Address:</strong> {patient.address}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
        {tabHeaders.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2.5 px-6 py-4 text-sm font-semibold transition-all duration-200 relative whitespace-nowrap cursor-pointer ${
                isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderlineDetailsDoc"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Viewport */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-xl min-h-[420px]">
        <AnimatePresence mode="wait">
          
          {/* MRI Tab */}
          {activeTab === 'mris' && (
            <motion.div
              key="details-mri-doc"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Upload column */}
                <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 h-fit space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Upload New MRI Scan</h3>
                    <p className="text-xs text-slate-400 mt-1">Upload DICOM, PNG, or JPG brain slice for model evaluation</p>
                  </div>
                  
                  <form onSubmit={handleMriUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-900/40 transition duration-150 cursor-pointer relative group">
                      <input
                        type="file"
                        id="mri-file-input"
                        required
                        onChange={(e) => setMriFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <UploadCloud className="h-10 w-10 text-slate-400 mb-2 group-hover:text-teal-400 group-hover:scale-105 transition-all" />
                      <span className="text-sm text-slate-200 font-semibold text-center truncate w-full px-4">
                        {mriFile ? mriFile.name : 'Select MRI scan file'}
                      </span>
                      <span className="text-xs text-slate-500 mt-1 block">PNG, JPG, JPEG up to 10MB</span>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={uploadMriMutation.isPending || !mriFile}
                      className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-teal-500/20 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {uploadMriMutation.isPending ? 'Uploading Scan...' : 'Submit Report File'}
                    </button>
                  </form>

                  <div className="border-t border-slate-800 pt-5 space-y-3">
                    <button
                      onClick={handleTestAi}
                      disabled={analyzeMriMutation.isPending}
                      className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800 text-white border border-slate-700 rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {analyzeMriMutation.isPending ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-400 border-t-transparent mr-1" />
                          <span>Analyzing MRI Scan...</span>
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="h-4 w-4 text-teal-400" />
                          <span>Run Deep Learning Inference</span>
                        </>
                      )}
                    </button>
                    
                    {aiMessage && (
                      <div className={`p-4 rounded-xl text-sm space-y-2 border ${
                        aiMessage.status === 'error'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                      }`}>
                        <div className="font-bold uppercase tracking-wider text-xs flex justify-between">
                          <span>AI Engine status:</span>
                          <span>{aiMessage.status}</span>
                        </div>
                        {aiMessage.prediction && (
                          <p className="text-slate-200">
                            <strong>Diagnostic Class:</strong> <span className="text-white font-bold text-base">{aiMessage.prediction}</span>
                          </p>
                        )}
                        {aiMessage.confidence && (
                          <p className="text-slate-200">
                            <strong>Confidence:</strong> <span className="text-white font-bold text-base">{aiMessage.confidence}%</span>
                          </p>
                        )}
                        {aiMessage.message && <p className="text-slate-400 leading-relaxed text-xs">{aiMessage.message}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploads list column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white tracking-tight">MRI Diagnostic Scan Records</h3>
                  {mris.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm bg-slate-950/70 border border-slate-800 rounded-2xl">
                      No MRI scan records uploaded for this patient yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mris.map((m: any) => (
                        <div key={m._id} className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
                          <div className="space-y-1.5 overflow-hidden pr-4">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono bg-slate-900 border border-slate-700 text-teal-400 px-2 py-0.5 rounded text-xs font-bold">
                                {m.mriId || 'PENDING'}
                              </span>
                              <span className="font-semibold text-white text-sm truncate">
                                {m.fileName || m.filename}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 block">
                              Uploaded on {new Date(m.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                                <CheckCircle className="h-3 w-3 mr-1" /> Stored
                              </span>
                              {m.status === 'Completed' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-300 text-xs font-semibold border border-teal-500/20">
                                  <BrainCircuit className="h-3 w-3 mr-1" /> {m.result || m.prediction}
                                </span>
                              )}
                              {m.status === 'Pending' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                                  <Clock className="h-3 w-3 mr-1 animate-pulse" /> Pending Inference
                                </span>
                              )}
                              {m.status === 'Error' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20">
                                  ⚠️ {m.result || 'Analysis Failed'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <a
                            href={`http://localhost:5000${m.filePath || m.filepath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shrink-0 transition flex items-center justify-center cursor-pointer"
                          >
                            Inspect Image
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Creator Column */}
                <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 h-fit space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Authorize Clinical Prescription</h3>
                    <p className="text-xs text-slate-400 mt-1">Prescribe medications and care instructions</p>
                  </div>
                  
                  <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Clinical Assessment Notes *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={rxNotes}
                        onChange={(e) => setRxNotes(e.target.value)}
                        placeholder="Write dynamic evaluation comments, recommendations, dosage steps..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl p-3.5 text-sm placeholder-slate-500 focus:outline-none text-white resize-none"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-3">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                        Prescribed Medications
                      </span>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Medicine name (e.g. Donepezil, Memantine)"
                          value={medForm.name}
                          onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                          className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Dosage (e.g. 5mg, 10mg)"
                            value={medForm.dosage}
                            onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                            className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white"
                          />
                          <input
                            type="text"
                            placeholder="Freq (e.g. Once daily at bedtime)"
                            value={medForm.frequency}
                            onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                            className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Instructions (e.g. With meals)"
                            value={medForm.instructions}
                            onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
                            className="col-span-2 h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white"
                          />
                          <select
                            value={medForm.status}
                            onChange={(e) => setMedForm({ ...medForm, status: e.target.value })}
                            className="h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-2 text-sm text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="Discontinued">Discontinued</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={addMedication}
                          className="w-full h-10 border border-dashed border-slate-700 hover:border-teal-500/50 hover:bg-slate-800/40 text-xs text-slate-300 font-semibold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-teal-400" />
                          <span>Add Medicine Item to List</span>
                        </button>
                      </div>
                    </div>

                    {rxMeds.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                          Draft Medicines to Save ({rxMeds.length}):
                        </span>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {rxMeds.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm">
                              <div className="truncate pr-2">
                                <strong className="text-white font-semibold">{m.name}</strong> • {m.dosage} ({m.frequency})
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMedication(idx)}
                                className="text-rose-400 hover:text-rose-300 p-1 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!rxNotes}
                      className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-teal-500/20 cursor-pointer disabled:cursor-not-allowed mt-3"
                    >
                      Authorize &amp; Synchronize Prescription
                    </button>
                  </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white tracking-tight">Clinical Prescriptions Log</h3>
                  
                  {prescriptions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm bg-slate-950/70 border border-slate-800 rounded-2xl">
                      No prescription forms stored for this patient profile yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((pr: any) => (
                        <div key={pr._id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition space-y-3">
                          <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Record: {new Date(pr.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                              Dr. {pr.doctor?.name || 'Physician'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                            {pr.notes}
                          </p>

                          {pr.medications && pr.medications.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                Authorized Medications ({pr.medications.length})
                              </span>
                              <div className="border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-slate-900/80 font-semibold border-b border-slate-800 text-xs uppercase text-slate-400">
                                      <th className="py-3 px-4">Name</th>
                                      <th className="py-3 px-4">Dosage</th>
                                      <th className="py-3 px-4">Frequency</th>
                                      <th className="py-3 px-4">Instructions</th>
                                      <th className="py-3 px-4">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800 bg-slate-900/30 text-slate-300">
                                    {pr.medications.map((m: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="py-3 px-4 font-semibold text-white">{m.name}</td>
                                        <td className="py-3 px-4">{m.dosage}</td>
                                        <td className="py-3 px-4 text-slate-400">{m.frequency}</td>
                                        <td className="py-3 px-4 text-slate-400">{m.instructions || '—'}</td>
                                        <td className="py-3 px-4">
                                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            m.status === 'Discontinued'
                                              ? 'bg-slate-800 text-slate-400'
                                              : m.status === 'Completed'
                                              ? 'bg-blue-500/10 text-blue-400'
                                              : 'bg-emerald-500/10 text-emerald-400'
                                          }`}>
                                            {m.status || 'Active'}
                                          </span>
                                        </td>
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Assignment column */}
                <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 h-fit space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Assign Cognitive Exercise</h3>
                    <p className="text-xs text-slate-400 mt-1">Configure mobile cognitive tasks for patient</p>
                  </div>
                  
                  <form onSubmit={handleAssignGame} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Exercise Program
                      </label>
                      <select
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Memory Match">Memory Match (Visual Recall)</option>
                        <option value="Visual Search">Visual Search (Attention & Focus)</option>
                        <option value="Speed Tap">Speed Tap (Motor Reflex & Speed)</option>
                        <option value="Pattern Sequence">Pattern Sequence (Working Memory)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Difficulty
                        </label>
                        <select
                          value={gameDifficulty}
                          onChange={(e) => setGameDifficulty(e.target.value)}
                          className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none cursor-pointer"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Frequency
                        </label>
                        <select
                          value={gameFrequency}
                          onChange={(e) => setGameFrequency(e.target.value)}
                          className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none cursor-pointer"
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
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Repetitions
                        </label>
                        <select
                          value={gameRepetitions}
                          onChange={(e) => setGameRepetitions(e.target.value)}
                          className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none cursor-pointer"
                        >
                          <option value="1">1 time</option>
                          <option value="2">2 times</option>
                          <option value="3">3 times</option>
                          <option value="5">5 times</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={gameDueDate}
                          onChange={(e) => setGameDueDate(e.target.value)}
                          className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Clinical Guidance / Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Play after morning medication"
                        value={gameNotes}
                        onChange={(e) => setGameNotes(e.target.value)}
                        className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none placeholder-slate-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={assignGameMutation.isPending}
                      className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-teal-500/20 cursor-pointer"
                    >
                      {assignGameMutation.isPending ? 'Assigning...' : 'Dispatch Exercise Assignment'}
                    </button>
                  </form>
                </div>

                {/* Logs column */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight mb-4">Assigned Cognitive Exercises</h3>
                    
                    {games.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 text-sm bg-slate-950/70 border border-slate-800 rounded-2xl">
                        No cognitive support games assigned for this patient profile yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {games.map((g: any) => (
                          <div key={g._id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
                            <div className="space-y-1 pr-3 overflow-hidden">
                              <span className="font-semibold text-white text-sm block">
                                {g.gameName}
                              </span>
                              <span className="text-xs text-slate-400 block">
                                Difficulty: <strong className="text-teal-400 font-semibold">{g.difficulty || 'Medium'}</strong>
                                {g.dueDate && ` • Due by ${new Date(g.dueDate).toLocaleDateString()}`}
                              </span>
                              <span className="text-xs text-slate-500 block">
                                Assigned on {new Date(g.assignedAt || g.createdAt).toLocaleDateString()}
                                {g.completedAt && ` • Completed on ${new Date(g.completedAt).toLocaleDateString()}`}
                              </span>
                            </div>

                            <div>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                                  g.status === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
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
                  <div className="pt-6 border-t border-slate-800">
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Booking Column */}
                <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 h-fit space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Schedule Consultation Slot</h3>
                    <p className="text-xs text-slate-400 mt-1">Book an upcoming clinic review appointment</p>
                  </div>
                  
                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Appointment Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={appointmentForm.date}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                        className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Time Slot Selection
                      </label>
                      <select
                        value={appointmentForm.timeSlot}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, timeSlot: e.target.value })}
                        className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none cursor-pointer"
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
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Booking Purpose / Clinical Details *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={appointmentForm.reason}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                        placeholder="e.g. Cognitive status review or MRI report consultation"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl p-3.5 text-sm placeholder-slate-500 focus:outline-none text-white resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-teal-500/20 cursor-pointer"
                    >
                      Confirm Appointment Booking
                    </button>
                  </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white tracking-tight">Scheduled Appointments Directory</h3>
                  
                  {appointments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm bg-slate-950/70 border border-slate-800 rounded-2xl">
                      No appointment dates scheduled for this patient yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((appt: any) => (
                        <div key={appt._id} className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
                          <div className="space-y-1.5 overflow-hidden pr-3">
                            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                              Date: {new Date(appt.date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} at <strong className="text-white font-bold">{appt.timeSlot}</strong>
                            </span>
                            <span className="font-semibold text-white text-sm block leading-snug">
                              {appt.reason || 'General checkup consultation'}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              Booked on {new Date(appt.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              appt.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : appt.status === 'Cancelled'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-teal-500/10 text-teal-400 border-teal-500/30'
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <h3 className="text-base font-bold text-white tracking-tight">Patient Longitudinal Milestones</h3>
              
              {timeline.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm bg-slate-950/70 border border-slate-800 rounded-2xl">
                  No clinical milestones logged yet for this patient profile.
                </div>
              ) : (
                <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-8 py-2">
                  {timeline.map((item: any, idx: number) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="relative"
                    >
                      <span className="absolute -left-[31px] top-1.5 bg-slate-950 border-2 border-teal-500 rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                      </span>
                      
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-400 block">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <strong className="text-base font-bold text-white block">
                          {item.title}
                        </strong>
                        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl bg-slate-950/70 p-4 rounded-xl border border-slate-800">
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
