'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { usePatientQuery, useUploadMriMutation, useAnalyzeMriMutation } from '@/hooks/useApi';
import { UploadCloud, CheckCircle, Clock, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientUpload() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const { data: patientData, refetch } = usePatientQuery(user?._id || '');
  const uploadMriMutation = useUploadMriMutation();
  const analyzeMriMutation = useAnalyzeMriMutation();

  const [mriFile, setMriFile] = useState<File | null>(null);
  const [aiMessage, setAiMessage] = useState<any>(null);

  const handleMriUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mriFile || !user) return;

    const formData = new FormData();
    formData.append('mri', mriFile);
    formData.append('patientId', user._id);

    try {
      await uploadMriMutation.mutateAsync(formData);
      setMriFile(null);
      const input = document.getElementById('mri-file-input') as HTMLInputElement;
      if (input) input.value = '';
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestAi = async () => {
    if (!user) return;
    try {
      setAiMessage(null);
      const res = await analyzeMriMutation.mutateAsync({ patientId: user._id });
      setAiMessage(res);
      refetch();
    } catch (err) {
      console.error(err);
      setAiMessage({
        status: 'error',
        message: 'Failed to analyze MRI scan.'
      });
    }
  };

  const mris = patientData?.mris || [];

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-12">
      {/* Description Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">Diagnostic MRI Scanner</h1>
        <p className="text-xs text-slate-400">Upload your brain MRI scans to trigger stage classification predictions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload column */}
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-fit space-y-5 shadow-xl">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Upload New MRI Scan</h4>
          
          <form onSubmit={handleMriUpload} className="space-y-4">
            <div className="border border-dashed border-white/10 hover:border-emerald-500/50 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-950/20 transition duration-150 cursor-pointer relative group">
              <input
                type="file"
                id="mri-file-input"
                required
                onChange={(e) => setMriFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <UploadCloud className="h-10 w-10 text-slate-500 mb-2 group-hover:text-emerald-450 group-hover:scale-105 transition-all" />
              <span className="text-xs text-slate-350 font-semibold text-center truncate w-full px-4">
                {mriFile ? mriFile.name : 'Select MRI scan file'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">PNG, JPG, JPEG up to 10MB</span>
            </div>
            
            <button
              type="submit"
              disabled={uploadMriMutation.isPending || !mriFile}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-800 disabled:to-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg uppercase tracking-wider"
            >
              {uploadMriMutation.isPending ? 'Uploading...' : 'Submit Report'}
            </button>
          </form>

          <div className="border-t border-white/5 pt-4">
            <button
              onClick={handleTestAi}
              disabled={analyzeMriMutation.isPending}
              className="w-full bg-slate-900 hover:bg-slate-850 disabled:bg-slate-800 text-slate-300 border border-white/5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 uppercase tracking-wider"
            >
              {analyzeMriMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Executing Prediction...</span>
                </>
              ) : (
                <span>Analyze Scan Stage</span>
              )}
            </button>
            
            {aiMessage && (
              <div className={`mt-4 p-4 rounded-xl text-[11px] space-y-1.5 border ${
                aiMessage.status === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-350'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-350'
              }`}>
                <p className="font-bold uppercase tracking-wider text-[9px] flex justify-between">
                  <span>Engine status:</span>
                  <span>{aiMessage.status}</span>
                </p>
                {aiMessage.prediction && <p><strong>Result Prediction:</strong> <span className="text-white font-bold">{aiMessage.prediction}</span></p>}
                {aiMessage.confidence && <p><strong>Confidence Rating:</strong> <span className="text-white font-bold">{aiMessage.confidence}%</span></p>}
                {aiMessage.message && <p className="text-slate-400 leading-relaxed mt-1">{aiMessage.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Uploads list column */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-bold text-slate-350 text-xs uppercase tracking-wider">MRI Diagnosis History</h4>
          {mris.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/20 border border-white/10 rounded-xl">
              No MRI scan reports uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {mris.map((m: any) => (
                <div key={m._id} className="p-4 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between hover:border-white/15 transition">
                  <div className="space-y-1 overflow-hidden pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono bg-slate-950 border border-white/5 text-emerald-450 px-2 py-0.5 rounded text-[9px] font-bold">
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/10">
                        <CheckCircle className="h-2.5 w-2.5 mr-1" /> Upload Succeeded
                      </span>
                      {m.status === 'Completed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-350 text-[9px] font-bold border border-emerald-500/10">
                          {m.result || m.prediction}
                        </span>
                      )}
                      {m.status === 'Pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold border border-amber-500/10">
                          <Clock className="h-2.5 w-2.5 mr-1 animate-pulse" /> AI Modeling
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
                    className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-white/5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition"
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
  );
}
