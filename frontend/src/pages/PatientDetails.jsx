import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  User,
  FileText,
  BrainCircuit,
  Calendar,
  Plus,
  ArrowLeft,
  UploadCloud,
  FileCode,
  CheckCircle,
  Clock,
  Trash,
  Play,
  ClipboardList,
} from 'lucide-react';

const PatientDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mris');

  // Input forms local state
  const [mriFile, setMriFile] = useState(null);
  const [uploadingMri, setUploadingMri] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);
  const [testingAi, setTestingAi] = useState(false);

  const [prescriptionForm, setPrescriptionForm] = useState({
    notes: '',
    medications: [{ name: '', dosage: '', frequency: '' }],
  });

  const [gameName, setGameName] = useState('Memory Match');
  const [gameDifficulty, setGameDifficulty] = useState('Medium');
  const [gameDueDate, setGameDueDate] = useState('');

  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    timeSlot: '10:00 AM',
    reason: '',
  });

  // Additional history state
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [gameResults, setGameResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await api.getPatientById(id);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load patient detail profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      setLoadingTimeline(true);
      const res = await api.getPatientTimeline(id);
      setTimeline(res.data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const fetchGameResults = async () => {
    try {
      setLoadingResults(true);
      const res = await api.getGameResults(id);
      setGameResults(res.data);
    } catch (err) {
      console.error('Failed to load game results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
    fetchTimeline();
    fetchGameResults();
  }, [id]);

  // MRI file submit
  const handleMriUpload = async (e) => {
    e.preventDefault();
    if (!mriFile) return;

    const formData = new FormData();
    formData.append('patientId', id);
    formData.append('mri', mriFile);

    try {
      setUploadingMri(true);
      await api.uploadMri(formData);
      setMriFile(null);
      // Reset input
      const input = document.getElementById('mri-file-input');
      if (input) input.value = '';
      
      fetchPatientData();
      fetchTimeline();
    } catch (err) {
      alert(err.response?.data?.message || 'MRI upload failed');
    } finally {
      setUploadingMri(false);
    }
  };

  // Run real AI analysis
  const handleTestAi = async () => {
    try {
      setTestingAi(true);
      setAiMessage(null);
      const res = await api.analyzeMri({ patientId: id });
      setAiMessage(res.data);
      fetchPatientData();
      fetchTimeline();
    } catch (err) {
      console.error(err);
      setAiMessage({
        status: 'error',
        message: err.response?.data?.message || 'Failed to analyze MRI scan.'
      });
    } finally {
      setTestingAi(false);
    }
  };

  // Prescription medicines builders
  const handleMedChange = (index, field, value) => {
    const updated = [...prescriptionForm.medications];
    updated[index][field] = value;
    setPrescriptionForm({ ...prescriptionForm, medications: updated });
  };

  const addMedField = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medications: [...prescriptionForm.medications, { name: '', dosage: '', frequency: '' }],
    });
  };

  const removeMedField = (index) => {
    const updated = prescriptionForm.medications.filter((_, i) => i !== index);
    setPrescriptionForm({ ...prescriptionForm, medications: updated });
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createPrescription({
        patientId: id,
        notes: prescriptionForm.notes,
        medications: prescriptionForm.medications.filter((m) => m.name),
      });
      setPrescriptionForm({
        notes: '',
        medications: [{ name: '', dosage: '', frequency: '' }],
      });
      fetchPatientData();
      fetchTimeline();
      alert('Prescription created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create prescription');
    }
  };

  // Assign Cognitive Game
  const handleAssignGame = async (e) => {
    e.preventDefault();
    try {
      await api.assignGame({
        patientId: id,
        gameName,
        difficulty: gameDifficulty,
        dueDate: gameDueDate || null
      });
      alert('Cognitive Game assigned successfully');
      setGameDueDate('');
      fetchPatientData();
      fetchTimeline();
      fetchGameResults();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign game');
    }
  };

  // Book appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.bookAppointment({
        patientId: id,
        date: appointmentForm.date,
        timeSlot: appointmentForm.timeSlot,
        reason: appointmentForm.reason,
      });
      setAppointmentForm({ date: '', timeSlot: '10:00 AM', reason: '' });
      fetchPatientData();
      fetchTimeline();
      alert('Appointment booked successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        Patient record not found.
      </div>
    );
  }

  const { patient, prescriptions, mris, games, appointments } = data;

  const tabHeaders = [
    { id: 'mris', label: 'MRI Scans', icon: FileCode },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'games', label: 'Cognitive Games', icon: BrainCircuit },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'timeline', label: 'Patient Timeline', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/patients"
        className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Patient Directory</span>
      </Link>

      {/* Patient demographics header card */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="flex items-center space-x-4 lg:col-span-1 lg:border-r border-slate-150 lg:pr-6">
          <div className="h-16 w-16 bg-clinical-100 text-clinical-700 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">{patient.name}</h2>
            <span className="text-xs text-slate-400 font-mono block mt-0.5">{patient.patientId || 'PAT-XXXX'}</span>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">{patient.email}</span>
            <div className="flex space-x-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                {patient.age} years
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                {patient.gender}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
            Clinical History & Diagnosis Summary
          </span>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-150">
            {patient.medicalHistory || 'No previous medical history recorded.'}
          </p>
        </div>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-200">
        {tabHeaders.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
                activeTab === t.id
                  ? 'border-clinical-600 text-clinical-600 bg-clinical-50/10'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Viewport */}
      <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm min-h-96">
        
        {/* MRI Tab */}
        {activeTab === 'mris' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Upload column */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-150 h-fit space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Upload MRI Scan</h4>
                <form onSubmit={handleMriUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-350 rounded-xl p-4 flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition duration-150 cursor-pointer relative">
                    <input
                      type="file"
                      id="mri-file-input"
                      required
                      onChange={(e) => setMriFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-600 font-semibold text-center truncate w-full">
                      {mriFile ? mriFile.name : 'Click to select MRI file'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">PDF, PNG, JPG, ZIP up to 10MB</span>
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingMri || !mriFile}
                    className="w-full bg-clinical-600 hover:bg-clinical-500 disabled:bg-slate-300 disabled:shadow-none text-white py-2 rounded-xl text-xs font-semibold shadow-md shadow-clinical-600/10 transition"
                  >
                    {uploadingMri ? 'Uploading...' : 'Submit Report'}
                  </button>
                </form>

                <div className="border-t border-slate-200 pt-4">
                  <button
                    onClick={handleTestAi}
                    disabled={testingAi}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1"
                  >
                    {testingAi ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1"></span>
                        <span>Analyzing Scan...</span>
                      </>
                    ) : (
                      <span>Run AI Analysis on Latest</span>
                    )}
                  </button>
                  {aiMessage && (
                    <div className={`mt-3 p-3 rounded-xl text-[11px] space-y-1 ${
                      aiMessage.status === 'error'
                        ? 'bg-rose-50 border border-rose-100 text-rose-700'
                        : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                    }`}>
                      <p><strong>Status:</strong> {aiMessage.status}</p>
                      {aiMessage.prediction && <p><strong>Prediction:</strong> {aiMessage.prediction}</p>}
                      {aiMessage.confidence && <p><strong>Confidence:</strong> {aiMessage.confidence}%</p>}
                      {aiMessage.message && <p><strong>Message:</strong> {aiMessage.message}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Uploads list column */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">MRI Scan Log</h4>
                {mris.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-xl">
                    No MRI scan reports uploaded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mris.map((m) => (
                      <div key={m._id} className="p-4 border border-slate-150 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition">
                        <div className="space-y-1 overflow-hidden pr-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono bg-slate-100 border border-slate-200 text-slate-655 px-2 py-0.5 rounded text-[10px] font-bold">
                              {m.mriId || 'Pending ID'}
                            </span>
                            <span className="font-semibold text-slate-800 text-sm truncate">
                              {m.fileName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Uploaded on {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                          
                          {/* Dynamic status badges and classification result */}
                          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-150">
                              <CheckCircle className="h-3 w-3 mr-1" /> Upload Successful
                            </span>
                            {m.status === 'Completed' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-150">
                                <BrainCircuit className="h-3 w-3 mr-1" /> {m.result}
                              </span>
                            )}
                            {m.status === 'Pending' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-150">
                                <Clock className="h-3 w-3 mr-1 animate-pulse" /> AI Processing...
                              </span>
                            )}
                            {m.status === 'Error' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-150">
                                ⚠️ {m.result || 'Analysis Failed'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <a
                          href={`http://localhost:5000${m.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-clinical-50 hover:bg-clinical-100 text-clinical-700 border border-clinical-200/50 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition"
                        >
                          View File
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Creator Column */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-150 h-fit space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Write Prescription & Diagnosis</h4>
                <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Clinical/Diagnosis Notes
                    </label>
                    <textarea
                      required
                      value={prescriptionForm.notes}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                      placeholder="Write notes regarding current progression, symptoms etc."
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs placeholder-slate-400 focus:outline-none focus:border-clinical-500"
                    ></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Prescribed Medications
                    </label>
                    
                    {prescriptionForm.medications.map((m, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white space-y-2 relative">
                        {prescriptionForm.medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedField(idx)}
                            className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        )}
                        <input
                          type="text"
                          placeholder="Medicine name (e.g. Donepezil)"
                          value={m.name}
                          onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                          className="w-full border-b border-slate-100 py-1 text-xs focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Dosage (5mg)"
                            value={m.dosage}
                            onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                            className="w-full border-b border-slate-100 py-1 text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Freq (Once daily)"
                            value={m.frequency}
                            onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                            className="w-full border-b border-slate-100 py-1 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addMedField}
                      className="w-full py-2 border border-dashed border-slate-300 hover:bg-white text-[11px] text-slate-500 font-semibold rounded-lg transition"
                    >
                      + Add Medicine Row
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-clinical-600 hover:bg-clinical-500 text-white py-2 rounded-xl text-xs font-semibold shadow-md shadow-clinical-600/10 transition"
                  >
                    Save Prescription
                  </button>
                </form>
              </div>

              {/* Log List Column */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Prescription Logs</h4>
                {prescriptions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-xl">
                    No clinical prescription logs written yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((pr) => (
                      <div key={pr._id} id={`prescription-card-${pr._id}`} className="border border-slate-150 rounded-xl p-5 hover:shadow-sm transition bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                          <div className="flex items-center space-x-2 text-slate-700">
                            <ClipboardList className="h-4 w-4 text-slate-400" />
                            <span className="font-bold text-sm">Clinical Note</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                const card = document.getElementById(`prescription-card-${pr._id}`);
                                card.setAttribute('id', 'print-area');
                                window.print();
                                card.setAttribute('id', `prescription-card-${pr._id}`);
                              }}
                              className="no-print text-[10px] font-bold px-2 py-0.5 rounded bg-clinical-50 hover:bg-clinical-100 text-clinical-700 transition"
                            >
                              Print / PDF
                            </button>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {new Date(pr.date || pr.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {pr.notes}
                        </p>

                        {pr.medications && pr.medications.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Medication Table
                            </span>
                            <table className="w-full text-left text-xs text-slate-600 border border-slate-100 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-slate-50 font-bold border-b border-slate-100 text-slate-500">
                                  <th className="p-2">Name</th>
                                  <th className="p-2">Dosage</th>
                                  <th className="p-2">Frequency</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {pr.medications.map((m, mIdx) => (
                                  <tr key={mIdx}>
                                    <td className="p-2 font-semibold text-slate-700">{m.name}</td>
                                    <td className="p-2">{m.dosage}</td>
                                    <td className="p-2">{m.frequency}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Cognitive Games Tab */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Assigner Column */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-150 h-fit space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Assign Cognitive Support Games</h4>
                <form onSubmit={handleAssignGame} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Cognitive Exercise
                    </label>
                    <select
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="Memory Match">Memory Match (Working Memory)</option>
                      <option value="Word Association Game">Word Association (Language Ability)</option>
                      <option value="Visual Search Puzzle">Visual Search (Attention and Focus)</option>
                      <option value="Spatial Match-up">Spatial Match-up (Visuospatial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={gameDifficulty}
                      onChange={(e) => setGameDifficulty(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={gameDueDate}
                      onChange={(e) => setGameDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-clinical-600 hover:bg-clinical-500 text-white py-2 rounded-xl text-xs font-semibold shadow-md shadow-clinical-600/10 transition"
                  >
                    Dispatch Assignment
                  </button>
                </form>
              </div>

              {/* Logs column */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Assigned Games Tracking</h4>
                  {games.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-xl">
                      No cognitive support games assigned yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {games.map((g) => (
                        <div key={g._id} className="p-4 border border-slate-150 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-800 text-sm block">
                              {g.gameName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Difficulty: <strong className="text-slate-655 font-semibold">{g.difficulty || 'Medium'}</strong>
                              {g.dueDate && ` • Due by ${new Date(g.dueDate).toLocaleDateString()}`}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Assigned on {new Date(g.assignedAt || g.createdAt).toLocaleDateString()}
                              {g.completedAt && ` • Completed on ${new Date(g.completedAt).toLocaleDateString()}`}
                            </span>
                          </div>

                          <div>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                g.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                  : 'bg-amber-50 text-amber-700 border-amber-250'
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

                <div className="pt-6 border-t border-slate-150">
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Game Performance Results History</h4>
                  {loadingResults ? (
                    <div className="flex h-16 items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-clinical-600 border-t-transparent"></div>
                    </div>
                  ) : gameResults.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-xl">
                      No cognitive performance metrics logged yet.
                    </div>
                  ) : (
                    <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                            <th className="py-2.5 px-4">Game</th>
                            <th className="py-2.5 px-4">Score</th>
                            <th className="py-2.5 px-4">Accuracy</th>
                            <th className="py-2.5 px-4">Time Taken</th>
                            <th className="py-2.5 px-4">Date Completed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {gameResults.map((r) => (
                            <tr key={r._id} className="hover:bg-slate-50/20">
                              <td className="py-2.5 px-4 font-bold text-slate-800">{r.gameName}</td>
                              <td className="py-2.5 px-4 font-mono font-bold text-clinical-600">{r.score}</td>
                              <td className="py-2.5 px-4 text-slate-650">{r.accuracy}%</td>
                              <td className="py-2.5 px-4 text-slate-500">{r.timeTaken}s</td>
                              <td className="py-2.5 px-4 text-slate-400">
                                {new Date(r.completionDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Booking Column */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-150 h-fit space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Schedule Appointment Slot</h4>
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Time Slot
                    </label>
                    <select
                      value={appointmentForm.timeSlot}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, timeSlot: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Reason / Agenda
                    </label>
                    <input
                      type="text"
                      required
                      value={appointmentForm.reason}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                      placeholder="e.g. MRI Review"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-clinical-600 hover:bg-clinical-500 text-white py-2 rounded-xl text-xs font-semibold shadow-md shadow-clinical-600/10 transition"
                  >
                    Confirm Booking
                  </button>
                </form>
              </div>

              {/* Log List Column */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Schedule Log</h4>
                {appointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-xl">
                    No appointments booked yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((a) => (
                      <div key={a._id} className="p-4 border border-slate-150 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-800 text-sm block">
                            {new Date(a.date).toLocaleDateString()} at {a.timeSlot}
                          </span>
                          <span className="text-xs text-slate-500 block">
                            {a.reason || 'General Health Check'}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                              a.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                : a.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-250'
                                : 'bg-amber-50 text-amber-700 border-amber-250'
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h4 className="font-bold text-slate-800 text-sm">Chronological Patient Milestones</h4>
            
            {loadingTimeline ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
              </div>
            ) : timeline.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-xl">
                No timeline events recorded yet.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8 py-2">
                {timeline.map((event) => (
                  <div key={event._id} className="relative">
                    {/* Circle marker */}
                    <span className="absolute -left-[32px] top-1.5 bg-white border-2 border-clinical-600 rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-clinical-600"></span>
                    </span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-clinical-50 text-clinical-700 border border-clinical-150">
                          {event.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-850 leading-tight">{event.title}</h5>
                      <p className="text-xs text-slate-500 font-medium">{event.details}</p>
                      {event.status && (
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            event.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              : event.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-150'
                              : 'bg-amber-50 text-amber-700 border-amber-150'
                          }`}
                        >
                          {event.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientDetails;
