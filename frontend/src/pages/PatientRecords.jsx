import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  FileText,
  Activity,
  CheckCircle,
  Clock,
  ClipboardList,
  BrainCircuit,
} from 'lucide-react';

const PatientRecords = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState(null);
  const [testingAi, setTestingAi] = useState(false);
  const [activeTab, setActiveTab] = useState('docs');

  // Timeline state
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getPatientById(user._id || user.user?._id);
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    if (!user) return;
    try {
      setLoadingTimeline(true);
      const patientId = user._id || user.user?._id;
      const res = await api.getPatientTimeline(patientId);
      setTimeline(res.data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTimeline();
  }, [user]);

  const handleTestAi = async () => {
    try {
      setTestingAi(true);
      setAiMessage(null);
      const patientId = user._id || user.user?._id;
      const res = await api.analyzeMri({ patientId });
      setAiMessage(res.data);
      fetchProfile();
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
      </div>
    );
  }

  const { patient, prescriptions, mris } = profile || {};

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-clinical-600" />
          <span>My Medical Records</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Access clinical prescriptions, diagnostic notes, and MRI statuses</p>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === 'docs'
              ? 'border-clinical-600 text-clinical-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Medical Documents & Reports
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === 'timeline'
              ? 'border-clinical-600 text-clinical-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          My Health Journey Timeline
        </button>
      </div>

      {activeTab === 'docs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Clinical History and Prescriptions */}
          <div className="lg:col-span-2 space-y-6">
            {/* History */}
            <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Clinical Background Notes
              </span>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-150">
                {patient?.medicalHistory || 'No historical medical notes logged by your physician.'}
              </p>
            </div>

            {/* Prescriptions */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Prescription Logs</h3>
              {prescriptions?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-white border border-slate-150 rounded-xl">
                  No clinical prescription notes on file yet.
                </div>
              ) : (
                prescriptions?.map((pr) => (
                  <div key={pr._id} id={`prescription-card-${pr._id}`} className="bg-white border border-slate-150 rounded-xl p-6 hover:shadow-sm transition">
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
                          Prescribed Medications
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
                            {pr.medications.map((m, idx) => (
                              <tr key={idx}>
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
                ))
              )}
            </div>
          </div>

          {/* Right Side: MRI upload status and AI testing */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>MRI Scan Reports</span>
              </h3>

              {mris?.length === 0 ? (
                <div className="p-8 text-center text-slate-455 text-xs bg-slate-50 border border-slate-100 rounded-xl">
                  No MRI scan reports uploaded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {mris?.map((m) => (
                    <div key={m._id} className="p-4 border border-slate-150 rounded-xl space-y-3 bg-slate-50/50">
                      <div className="overflow-hidden">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono bg-slate-100 border border-slate-200 text-slate-655 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {m.mriId || 'Pending ID'}
                          </span>
                          <span className="font-semibold text-slate-800 text-xs truncate">
                            {m.fileName}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1.5">
                          Uploaded on {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-150 w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" /> Upload Successful
                        </span>
                        {m.status === 'Completed' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-150 w-fit">
                            <BrainCircuit className="h-3 w-3 mr-1" /> {m.result}
                          </span>
                        )}
                        {m.status === 'Pending' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-150 w-fit">
                            <Clock className="h-3 w-3 mr-1 animate-pulse" /> AI Processing...
                          </span>
                        )}
                        {m.status === 'Error' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-150 w-fit">
                            ⚠️ {m.result || 'Analysis Failed'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-150 pt-4">
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
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-sm">Chronological Milestones</h3>
          
          {loadingTimeline ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
            </div>
          ) : timeline.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-xl">
              No milestones recorded yet.
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
  );
};

export default PatientRecords;
