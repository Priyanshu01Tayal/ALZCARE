import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const { registerDoctor } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Neurologist');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerDoctor(name, email, password, specialization);
      navigate('/doctor-dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-clinical-950 p-6">
      {/* Background blobs for premium glassmorphism vibe */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-clinical-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8 text-white relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-clinical-500 rounded-xl flex items-center justify-center shadow-lg shadow-clinical-500/30 mb-3">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Doctor Registration</h1>
          <p className="text-xs text-slate-300 mt-1">AlzCare Medical Practitioner Network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 transition-all duration-150"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@alzcare.com"
                className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 transition-all duration-150"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Specialization
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 transition-all duration-150"
            >
              <option value="Neurologist">Neurologist</option>
              <option value="Psychiatrist">Psychiatrist</option>
              <option value="Geriatrician">Geriatrician</option>
              <option value="General Physician">General Physician</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
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
                className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-clinical-600 hover:bg-clinical-500 active:scale-[0.98] py-3 rounded-xl font-semibold shadow-lg shadow-clinical-600/20 transition-all duration-150 text-sm flex items-center justify-center space-x-2 mt-4"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-slate-300">
          <span>Already have an account? </span>
          <Link to="/login" className="text-clinical-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
