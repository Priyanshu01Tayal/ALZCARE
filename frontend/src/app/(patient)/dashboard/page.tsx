'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useGameResultsQuery } from '@/hooks/useApi';
import { BrainCircuit, Clock, TrendingUp, Award, Zap, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientDashboard() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const { data: results, isLoading } = useGameResultsQuery(user?._id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="h-10 w-10 rounded-full border-[3px] border-emerald-600 border-t-transparent"
        ></motion.div>
      </div>
    );
  }

  const hasResults = results && results.length > 0;

  const totalExercises = results?.length || 0;
  const avgAccuracy = totalExercises > 0
    ? Math.round(results!.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalExercises)
    : 0;
  const highestScore = totalExercises > 0
    ? Math.max(...results!.map((r) => r.score || 0))
    : 0;
  const avgSpeed = totalExercises > 0
    ? Math.round(results!.reduce((acc, curr) => acc + (curr.timeTakenSeconds || curr.timeTaken || 0), 0) / totalExercises)
    : 0;

  const recentResults = results ? [...results].reverse().slice(-7) : [];

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-12">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 rounded-2xl p-8 border border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cognitive Control Gate</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Hello, {user?.name || 'Patient'}</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Track your cognitive performance progression, view clinical feedback logs, and access assigned memory matched games.
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -3 }} className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Exercises Done</span>
            <p className="text-3xl font-extrabold text-white">{totalExercises}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Avg Accuracy</span>
            <p className="text-3xl font-extrabold text-emerald-450">{avgAccuracy}%</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">High Score</span>
            <p className="text-3xl font-extrabold text-white">{highestScore}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Award className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Average Speed</span>
            <p className="text-3xl font-extrabold text-white">{avgSpeed}s</p>
          </div>
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Clock className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {!hasResults ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 border border-white/10 bg-slate-900/40 backdrop-blur-md rounded-2xl text-center space-y-4 max-w-lg mx-auto flex flex-col items-center justify-center shadow-2xl"
        >
          <Smile className="h-12 w-12 text-emerald-450 animate-bounce" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Start Your Cognitive Rehabilitation Journey!</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Welcome to AlzCare. Once you play your assigned daily matching training games, your accuracy levels and score metrics will populate here.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Container */}
          <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-widest">Score progression (Last 7 sessions)</span>
            <div className="flex items-end justify-between h-48 px-2 border-b border-white/5 pb-1 pt-6">
              {recentResults.map((res: any, index: number) => {
                const heightPercent = highestScore > 0 ? ((res.score || 0) / highestScore) * 100 : 0;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group relative">
                    <div className="absolute bottom-full mb-2 bg-slate-950 border border-white/10 text-white text-[9px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-10">
                      Score: {res.score} • Acc: {res.accuracy}%
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPercent, 10)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
                      className="w-8 sm:w-12 bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-550 group-hover:to-teal-400 rounded-t-md transition-all duration-300 shadow-inner"
                    ></motion.div>
                    <span className="text-[8px] font-bold text-slate-500 mt-2.5 text-center w-full truncate px-0.5">
                      {res.gameName?.split(' ')[0] || 'Game'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Logs Table */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-widest">Exercise Completion Log</span>
            <div className="border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Game</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-350">
                  {results.slice(0, 5).map((r: any) => (
                    <tr key={r._id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-4 font-bold text-white">{r.gameName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{r.score}</td>
                      <td className="py-3 px-4">{r.accuracy}%</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(r.completionDate || r.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
