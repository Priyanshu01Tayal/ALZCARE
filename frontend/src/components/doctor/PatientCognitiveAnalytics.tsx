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
      <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
        Loading cognitive performance graphs...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent shadow-lg shadow-clinical-600/20" />
        <p className="text-sm font-medium text-slate-400">Loading patient cognitive telemetry &amp; records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Clinician Advisory Notice */}
      <div className="bg-slate-900/80 border border-clinical-500/30 rounded-2xl p-5 lg:p-6 flex items-start space-x-4 shadow-xl">
        <AlertCircle className="h-6 w-6 text-clinical-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <span className="font-bold text-white text-sm tracking-wide block">
            Clinical Telemetry &amp; Cognitive Rehabilitation Record
          </span>
          <p className="text-slate-300 leading-relaxed text-sm">
            The scores, accuracy rates, and response latencies recorded below reflect patient engagement with prescribed cognitive rehabilitation exercises from the mobile application. These metrics provide objective activity trends to assist clinical evaluation and multidisciplinary care planning. 
            <strong className="text-white"> Cognitive scores reflect activity performance and do not substitute for formal clinical diagnostic staging.</strong>
          </p>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-6 lg:p-7 rounded-2xl space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-clinical-500/10 border border-clinical-500/20 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-clinical-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">
                Cognitive Performance &amp; Analytics
              </h3>
              {patientName && (
                <p className="text-sm text-slate-400 mt-0.5 font-medium">
                  Active Patient Record: <span className="text-white font-semibold">{patientName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 text-sm font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 px-4 py-2.5 rounded-xl border border-slate-700/80 transition-all self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh Records'}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Game Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Cognitive Exercise Domain
            </label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-100 focus:outline-none focus:border-clinical-500 shadow-inner"
            >
              <option value="All">All Exercises (Aggregated)</option>
              <option value="Memory Match">Memory Match (Visual Recall)</option>
              <option value="Visual Search">Visual Search (Selective Attention)</option>
              <option value="Speed Tap">Speed Tap (Motor Processing Speed)</option>
              <option value="Pattern Sequence">Pattern Sequence (Working Memory)</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Exercise Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-100 focus:outline-none focus:border-clinical-500 shadow-inner"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Time Horizon
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-100 focus:outline-none focus:border-clinical-500 shadow-inner"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Sessions</span>
            <div className="p-2 rounded-lg bg-clinical-500/10 text-clinical-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <strong className="text-3xl lg:text-4xl font-extrabold text-white block tracking-tight">
            {summaryMetrics.totalSessions}
          </strong>
          <span className="text-xs text-slate-400 mt-2 block">
            {summaryMetrics.completedAssignments} prescribed tasks completed
          </span>
        </div>

        <div className="p-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Score</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <strong className="text-3xl lg:text-4xl font-extrabold text-emerald-400 block tracking-tight">
            {summaryMetrics.avgScore}
          </strong>
          <span className="text-xs text-slate-400 mt-2 block">
            Peak Score: <strong className="text-amber-400 font-semibold">{summaryMetrics.bestScore}</strong> pts
          </span>
        </div>

        <div className="p-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mean Accuracy</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <strong className="text-3xl lg:text-4xl font-extrabold text-blue-400 block tracking-tight">
            {summaryMetrics.avgAccuracy}%
          </strong>
          <span className="text-xs text-slate-400 mt-2 block">
            Avg reaction duration: {summaryMetrics.avgTime}s
          </span>
        </div>

        <div className="p-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Activity</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <strong className="text-lg font-bold text-white block truncate pt-1">
            {summaryMetrics.latestSession?.gameName || 'None'}
          </strong>
          <span className="text-xs text-slate-400 block mt-1 font-mono">
            {summaryMetrics.latestSession?.completionDate
              ? new Date(summaryMetrics.latestSession.completionDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No sessions recorded yet'}
          </span>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl">
          <BrainCircuit className="h-12 w-12 text-slate-600 mx-auto" />
          <h4 className="text-lg font-bold text-white">No Cognitive Session Records Match Filters</h4>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            {resultsList.length === 0
              ? 'This patient has not yet completed any cognitive exercises in the AlzCare mobile app. Once they log in and complete an exercise, their scores, accuracy, and duration will automatically appear here.'
              : 'No exercise sessions found matching the selected game, difficulty, or date range filters. Try broadening the filters above.'}
          </p>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Cognitive Performance Trend (Line Chart) */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-6 lg:p-7 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-clinical-400" />
                  <span>Cognitive Score Progression Over Time</span>
                </h4>
                <p className="text-sm text-slate-400 mt-1">Sequential points achieved per cognitive exercise session</p>
              </div>
            </div>

            <div className="h-80 lg:h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chronologicalData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    domain={['dataMin - 50', 'dataMax + 50']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      fontSize: '13px',
                      color: '#ffffff',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} pts (${item.payload.game} • ${item.payload.difficulty})`,
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
                    strokeWidth={3}
                    dot={{ fill: '#14b8a6', r: 5 }}
                    activeDot={{ r: 7, fill: '#2dd4bf' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Activity Frequency (Bar Chart) */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-6 lg:p-7 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <span>Daily Activity Volume &amp; Completion</span>
                </h4>
                <p className="text-sm text-slate-400 mt-1">Total exercise sessions completed per active day</p>
              </div>
            </div>

            <div className="h-80 lg:h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivityData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} tickMargin={8} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      fontSize: '13px',
                      color: '#ffffff',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} session(s) (Avg Score: ${item.payload.avgScore})`,
                      'Activity',
                    ]}
                  />
                  <Bar dataKey="count" name="Sessions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Game Performance Comparison (Bar Chart) */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-6 lg:p-7 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span>Cross-Activity Performance Comparison</span>
                </h4>
                <p className="text-sm text-slate-400 mt-1">Peak vs Average points across cognitive domains</p>
              </div>
            </div>

            <div className="h-80 lg:h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gameComparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="game" stroke="#94a3b8" fontSize={11} tickLine={false} tickMargin={8} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      fontSize: '13px',
                      color: '#ffffff',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Bar dataKey="bestScore" name="Peak Score" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avgScore" name="Average Score" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Accuracy Trajectory (Line Chart) */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-6 lg:p-7 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white flex items-center space-x-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  <span>Accuracy Percentage (%) Trend</span>
                </h4>
                <p className="text-sm text-slate-400 mt-1">Response accuracy rate over consecutive exercise trials</p>
              </div>
            </div>

            <div className="h-80 lg:h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chronologicalData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} tickMargin={8} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      fontSize: '13px',
                      color: '#ffffff',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Accuracy']}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#34d399', r: 5 }}
                    activeDot={{ r: 7, fill: '#6ee7b7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Date-Wise Cognitive History Log Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 lg:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">
              Chronological Activity &amp; Session History
            </h4>
            <p className="text-sm text-slate-400 mt-0.5">Detailed clinical telemetry recorded by patient mobile app</p>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            {filteredResults.length} session(s) recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No exercise session records to display.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-xs">
                  <th className="py-4 px-6">Date &amp; Time</th>
                  <th className="py-4 px-4">Cognitive Activity</th>
                  <th className="py-4 px-4">Difficulty</th>
                  <th className="py-4 px-4">Score</th>
                  <th className="py-4 px-4">Accuracy</th>
                  <th className="py-4 px-4">Duration</th>
                  <th className="py-4 px-4">Moves / Hits</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 bg-slate-900/20">
                {filteredResults.map((r, i) => {
                  const d = new Date(r.completionDate || r.createdAt || Date.now());
                  return (
                    <tr key={r._id || i} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 font-semibold text-white">
                        {r.gameName}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold uppercase border ${
                          r.difficulty === 'Hard'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : r.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {r.difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-teal-400 font-mono text-base">
                        {r.score}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-100">
                        {r.accuracy}%
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-mono">
                        {r.timeTaken}s
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-mono">
                        {r.moves !== undefined ? r.moves : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-0.5" />
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
