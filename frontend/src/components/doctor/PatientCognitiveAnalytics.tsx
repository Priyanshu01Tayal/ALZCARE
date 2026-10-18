'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BrainCircuit,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Trophy,
  Filter,
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface PatientCognitiveAnalyticsProps {
  patientId: string;
  patientName?: string;
  onRefresh?: () => void;
}

interface GameResultItem {
  _id: string;
  gameName: string;
  difficulty?: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  moves?: number;
  completionDate?: string;
  createdAt?: string;
}

interface GameWiseItem {
  gameName: string;
  category: string;
  difficulty: string;
  isAssigned: boolean;
  completedCount: number;
  attempts: number;
  bestScore: number;
  averageScore: number;
  averageAccuracy: number;
  lastScore: number;
  lastPlayed: string | null;
}

export function PatientCognitiveAnalytics({
  patientId,
  patientName,
  onRefresh,
}: PatientCognitiveAnalyticsProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [resultsList, setResultsList] = useState<GameResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGame, setSelectedGame] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all'); // 'all', '7d', '30d', '90d'

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    if (!patientId) return;
    try {
      setError(null);
      const [progRes, resRes] = await Promise.all([
        apiClient.get(`/api/games/progress/${patientId}`).catch(() => ({ data: null })),
        apiClient.get(`/api/games/results/${patientId}`).catch(() => ({ data: [] })),
      ]);

      setProgressData(progRes.data);
      setResultsList(Array.isArray(resRes.data) ? resRes.data : []);
    } catch (err: any) {
      console.error('Failed to fetch patient cognitive analytics:', err);
      setError(err.response?.data?.message || 'Could not load cognitive progress records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    if (onRefresh) onRefresh();
  };

  // Filtered Results
  const filteredResults = useMemo(() => {
    let list = [...resultsList];

    // Filter by Game Name
    if (selectedGame !== 'All') {
      list = list.filter(
        (r) => r.gameName?.toLowerCase() === selectedGame.toLowerCase()
      );
    }

    // Filter by Difficulty
    if (selectedDifficulty !== 'All') {
      list = list.filter(
        (r) => (r.difficulty || 'Medium').toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Filter by Time Range
    if (selectedTimeRange !== 'all') {
      const now = Date.now();
      const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      list = list.filter((r) => {
        const dateStr = r.completionDate || r.createdAt;
        return dateStr ? new Date(dateStr).getTime() >= cutoff : true;
      });
    }

    return list;
  }, [resultsList, selectedGame, selectedDifficulty, selectedTimeRange]);

  // Chronological data for Trend Line Charts (oldest to newest)
  const chronologicalData = useMemo(() => {
    return [...filteredResults].reverse().map((r, index) => {
      const dateObj = new Date(r.completionDate || r.createdAt || Date.now());
      return {
        session: `#${index + 1}`,
        rawDate: dateObj,
        date: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        dateTime: `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        game: r.gameName,
        difficulty: r.difficulty || 'Medium',
        score: r.score || 0,
        accuracy: r.accuracy || 0,
        timeTaken: r.timeTaken || 0,
        moves: r.moves || 0,
      };
    });
  }, [filteredResults]);

  // Daily Activity Bar Chart Data (grouped by date)
  const dailyActivityData = useMemo(() => {
    const countsByDate: { [key: string]: { date: string; count: number; avgScore: number; totalScore: number } } = {};
    
    // Sort chronological
    const sorted = [...filteredResults].reverse();
    sorted.forEach((r) => {
      const dateObj = new Date(r.completionDate || r.createdAt || Date.now());
      const key = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (!countsByDate[key]) {
        countsByDate[key] = { date: key, count: 0, avgScore: 0, totalScore: 0 };
      }
      countsByDate[key].count += 1;
      countsByDate[key].totalScore += (r.score || 0);
    });

    return Object.values(countsByDate).map((d) => ({
      ...d,
      avgScore: Math.round(d.totalScore / (d.count || 1)),
    }));
  }, [filteredResults]);

  // Game Comparison Data (Best vs Average per game domain)
  const gameComparisonData = useMemo(() => {
    const rawGameWise: GameWiseItem[] = progressData?.gameWise || [];
    if (rawGameWise.length > 0) {
      return rawGameWise.map((gw) => ({
        game: gw.gameName,
        bestScore: gw.bestScore || 0,
        avgScore: gw.averageScore || 0,
        accuracy: gw.averageAccuracy || 0,
        attempts: gw.attempts || 0,
      }));
    }

    // Fallback: aggregate from resultsList
    const catalog = ['Memory Match', 'Visual Search', 'Speed Tap', 'Pattern Sequence'];
    return catalog.map((gName) => {
      const matching = resultsList.filter((r) => r.gameName?.toLowerCase() === gName.toLowerCase());
      const best = matching.length > 0 ? Math.max(...matching.map((m) => m.score || 0)) : 0;
      const avg = matching.length > 0 ? Math.round(matching.reduce((acc, m) => acc + (m.score || 0), 0) / matching.length) : 0;
      const avgAcc = matching.length > 0 ? Math.round(matching.reduce((acc, m) => acc + (m.accuracy || 0), 0) / matching.length) : 0;
      return {
        game: gName,
        bestScore: best,
        avgScore: avg,
        accuracy: avgAcc,
        attempts: matching.length,
      };
    });
  }, [progressData, resultsList]);

  // Overall Metrics Summary
  const summaryMetrics = useMemo(() => {
    const totalSessions = filteredResults.length;
    const bestScore = totalSessions > 0 ? Math.max(...filteredResults.map((r) => r.score || 0)) : 0;
    const avgScore = totalSessions > 0 ? Math.round(filteredResults.reduce((acc, r) => acc + (r.score || 0), 0) / totalSessions) : 0;
    const avgAccuracy = totalSessions > 0 ? Math.round(filteredResults.reduce((acc, r) => acc + (r.accuracy || 0), 0) / totalSessions) : 0;
    const avgTime = totalSessions > 0 ? Math.round(filteredResults.reduce((acc, r) => acc + (r.timeTaken || 0), 0) / totalSessions) : 0;
    const latestSession = resultsList[0] || null;
    const completedAssignments = progressData?.summary?.completedAssignments || 0;
    const totalAssignments = progressData?.summary?.totalAssignments || 0;

    return {
      totalSessions,
      bestScore,
      avgScore,
      avgAccuracy,
      avgTime,
      latestSession,
      completedAssignments,
      totalAssignments,
    };
  }, [filteredResults, resultsList, progressData]);

  if (!mounted) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-white/5">
        Loading cognitive performance charts...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-950/50 rounded-2xl border border-white/5 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent" />
        <p className="text-xs text-slate-400">Loading patient cognitive telemetry & activity records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clinician Advisory Notice */}
      <div className="bg-slate-900/60 border border-clinical-500/20 rounded-2xl p-4 flex items-start space-x-3 shadow-lg">
        <AlertCircle className="h-5 w-5 text-clinical-450 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-white tracking-wide block uppercase text-[10px]">
            Activity & Rehabilitation Performance Analytics (Clinician Review)
          </span>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The scores, accuracy metrics, and reaction times displayed below reflect patient engagement with prescribed cognitive rehabilitation exercises. These metrics provide objective activity trends to assist clinical evaluation and multidisciplinary care planning. 
            <strong className="text-slate-300"> Cognitive game scores are activity-performance metrics and do not constitute an automated medical diagnosis of Alzheimer's Disease stage.</strong>
          </p>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-5 w-5 text-clinical-450" />
            <h3 className="font-bold text-white text-sm">
              Cognitive Trajectory & Rehabilitation Graphs
            </h3>
            {patientName && (
              <span className="text-xs text-slate-400 font-mono">
                • {patientName}
              </span>
            )}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-white/10 transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Records'}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Game Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
              Filter by Exercise
            </label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-clinical-500"
            >
              <option value="All">All Cognitive Exercises (Combined)</option>
              <option value="Memory Match">Memory Match (Visual Recall)</option>
              <option value="Visual Search">Visual Search (Attention & Focus)</option>
              <option value="Speed Tap">Speed Tap (Motor Processing Speed)</option>
              <option value="Pattern Sequence">Pattern Sequence (Working Memory)</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
              Difficulty Tier
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-clinical-500"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
              Time Horizon
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-clinical-500"
            >
              <option value="all">All-Time Cumulative</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed Sessions</span>
            <Activity className="h-4 w-4 text-clinical-400" />
          </div>
          <strong className="text-2xl font-extrabold text-white block">
            {summaryMetrics.totalSessions}
          </strong>
          <span className="text-[10px] text-slate-400">
            {summaryMetrics.completedAssignments} doctor assignments done
          </span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Score</span>
            <Trophy className="h-4 w-4 text-emerald-400" />
          </div>
          <strong className="text-2xl font-extrabold text-emerald-400 block">
            {summaryMetrics.avgScore}
          </strong>
          <span className="text-[10px] text-slate-400">
            Peak: <strong className="text-amber-400">{summaryMetrics.bestScore}</strong> pts
          </span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mean Accuracy</span>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <strong className="text-2xl font-extrabold text-blue-400 block">
            {summaryMetrics.avgAccuracy}%
          </strong>
          <span className="text-[10px] text-slate-400">
            Avg response: {summaryMetrics.avgTime}s
          </span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Last Activity</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <strong className="text-sm font-extrabold text-white block truncate pt-1">
            {summaryMetrics.latestSession?.gameName || 'None'}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {summaryMetrics.latestSession?.completionDate
              ? new Date(summaryMetrics.latestSession.completionDate).toLocaleDateString()
              : 'No sessions yet'}
          </span>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-slate-900/30 border border-white/5 rounded-2xl space-y-3">
          <BrainCircuit className="h-10 w-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Cognitive Session Records Match Filters</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {resultsList.length === 0
              ? 'This patient has not yet completed any cognitive exercises in the AlzCare mobile app. Once they log in and play an exercise, their scores and accuracy will sync here automatically.'
              : 'No exercise sessions found matching the selected game, difficulty, or date range filters. Try resetting the filters above.'}
          </p>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Cognitive Performance Trend (Line Chart) */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="h-4 w-4 text-clinical-400" />
                  <span>Cognitive Score Progression Over Time</span>
                </h4>
                <p className="text-[10px] text-slate-400">Sequential points achieved per exercise session</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chronologicalData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    domain={['dataMin - 50', 'dataMax + 50']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} pts (${item.payload.game} - ${item.payload.difficulty})`,
                      'Score',
                    ]}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return item ? `${item.dateTime}` : label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ fill: '#14b8a6', r: 4 }}
                    activeDot={{ r: 6, fill: '#2dd4bf' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Activity Frequency (Bar Chart) */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Daily Activity Volume & Completion</span>
                </h4>
                <p className="text-[10px] text-slate-400">Total exercise sessions completed per active day</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivityData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} session(s) (Avg Score: ${item.payload.avgScore})`,
                      'Activity',
                    ]}
                  />
                  <Bar dataKey="count" name="Sessions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Game Performance Comparison (Bar Chart) */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span>Cross-Activity Performance Comparison</span>
                </h4>
                <p className="text-[10px] text-slate-400">Best vs Average scores across cognitive domains</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gameComparisonData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="game" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                  <Bar dataKey="bestScore" name="Peak Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgScore" name="Average Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Accuracy Trajectory (Line Chart) */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <span>Accuracy Percentage (%) Trend</span>
                </h4>
                <p className="text-[10px] text-slate-400">Response accuracy rate over consecutive exercise trials</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chronologicalData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Accuracy']}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#34d399', r: 4 }}
                    activeDot={{ r: 6, fill: '#6ee7b7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Date-Wise Cognitive History Log Table */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Chronological Activity & Session History
            </h4>
            <p className="text-[10px] text-slate-400">Detailed clinical telemetry recorded by patient app</p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-white/5">
            {filteredResults.length} session(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No exercise session records to display.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 text-[9px]">
                  <th className="p-3.5 pl-6">Date & Time</th>
                  <th className="p-3.5">Cognitive Activity</th>
                  <th className="p-3.5">Difficulty</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Accuracy</th>
                  <th className="p-3.5">Time Taken</th>
                  <th className="p-3.5">Moves / Hits</th>
                  <th className="p-3.5 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 bg-slate-900/20">
                {filteredResults.map((r, i) => {
                  const d = new Date(r.completionDate || r.createdAt || Date.now());
                  return (
                    <tr key={r._id || i} className="hover:bg-white/5 transition">
                      <td className="p-3.5 pl-6 font-mono text-[11px] text-slate-400">
                        {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {r.gameName}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          r.difficulty === 'Hard'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : r.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {r.difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-teal-400">
                        {r.score}
                      </td>
                      <td className="p-3.5 font-bold text-slate-200">
                        {r.accuracy}%
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {r.timeTaken}s
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {r.moves !== undefined ? r.moves : '--'}
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          <span>Recorded</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
