'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, Lock, Mail, User, Eye, EyeOff, UserCheck, BrainCircuit, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterDoctorMutation } from '@/hooks/useApi';

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerMutation = useRegisterDoctorMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Neurologist');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'Doctor' || roleParam === 'Patient') {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole !== 'Doctor') return;
    setError('');

    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
        specialization,
      });
      router.push('/doctor/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleBackToSelect = () => {
    setSelectedRole(null);
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial-glow pointer-events-none"></div>

      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-clinical-500/10 rounded-full blur-[100px] animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

      <AnimatePresence mode="wait">
        {!selectedRole ? (
          <motion.div
            key="signup-select"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 text-white relative z-10 text-center space-y-8"
          >
            <div className="space-y-3">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="h-16 w-16 bg-gradient-to-tr from-clinical-600 to-clinical-400 rounded-2xl flex items-center justify-center shadow-lg shadow-clinical-600/30 mx-auto mb-4"
              >
                <Activity className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Register for AlzCare
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Join our practitioner network or learn how to access patient diagnostic tracking tools.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole('Doctor')}
                className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:bg-slate-900/40 hover:border-clinical-500/50 hover:shadow-2xl hover:shadow-clinical-500/10 transition-all duration-300 group text-center space-y-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-clinical-500/5 rounded-full blur-2xl group-hover:bg-clinical-500/15 transition-all"></div>
                <div className="h-16 w-16 bg-clinical-500/15 text-clinical-400 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-clinical-500 group-hover:text-white transition-all duration-300 shadow-inner">
                  <UserCheck className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-clinical-450 transition-colors">Medical Practitioner</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Create a new doctor account to monitor patients, evaluate MRI scans, and track game logs.
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole('Patient')}
                className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:bg-slate-900/40 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group text-center space-y-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>
                <div className="h-16 w-16 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-inner">
                  <BrainCircuit className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-emerald-450 transition-colors">Patient Portal Access</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Patients cannot self-register. Learn how your neurologist or doctor registers your clinical account.
                  </p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        ) : selectedRole === 'Patient' ? (
          <motion.div
            key="patient-signup-info"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-white relative z-10 space-y-6"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={handleBackToSelect}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition font-semibold group"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to selection</span>
            </motion.button>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shadow-lg mb-3 text-emerald-450">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Patient Registration
              </h1>
              <p className="text-xs text-slate-400 mt-1">AlzCare Cognitive Support</p>
            </div>

            <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl text-xs text-slate-350 leading-relaxed space-y-3">
              <p className="font-bold text-slate-200">Patient account creation rule:</p>
              <p>
                To safeguard private health information (PHI) and coordinate treatment, patient profiles are managed strictly by licensed healthcare providers.
              </p>
              <p>
                Your doctor will create your profile from their secure panel and provide your sign in credentials. Please reach out to your neurologist to setup your health dashboard.
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Link
                href="/login?role=Patient"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all text-xs uppercase tracking-wider flex items-center justify-center text-white"
              >
                Go to Patient Sign In
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="doctor-signup-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-white relative z-10"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={handleBackToSelect}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition font-semibold mb-6 group"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to selection</span>
            </motion.button>

            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="h-14 w-14 bg-clinical-500/20 text-clinical-400 rounded-2xl flex items-center justify-center shadow-lg shadow-clinical-500/20 mb-3"
              >
                <UserCheck className="h-7 w-7" />
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Doctor Registration
              </h1>
              <p className="text-xs text-slate-400 mt-1">AlzCare Medical Practitioner Network</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-350 text-xs leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jane Taylor"
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 focus:ring-1 focus:ring-clinical-500/40 rounded-xl py-3 pl-10 pr-4 text-sm placeholder-slate-500 text-slate-100 focus:outline-none transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.taylor@gmail.com"
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 focus:ring-1 focus:ring-clinical-500/40 rounded-xl py-3 pl-10 pr-4 text-sm placeholder-slate-500 text-slate-100 focus:outline-none transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-slate-950/90 border border-white/5 focus:border-clinical-500/60 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none transition-all duration-150"
                >
                  <option value="Neurologist">Neurologist</option>
                  <option value="Psychiatrist">Psychiatrist</option>
                  <option value="Geriatrician">Geriatrician</option>
                  <option value="General Physician">General Physician</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 focus:ring-1 focus:ring-clinical-500/40 rounded-xl py-3 pl-10 pr-10 text-sm placeholder-slate-500 text-slate-100 focus:outline-none transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-500 hover:to-clinical-400 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-clinical-600/20 transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-2 mt-4"
              >
                {registerMutation.isPending ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Create Practitioner Account</span>
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
              <span>Already registered? </span>
              <Link href="/login?role=Doctor" className="text-clinical-400 font-bold hover:text-clinical-300 hover:underline">
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading Sign Up Entry...
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  );
}
