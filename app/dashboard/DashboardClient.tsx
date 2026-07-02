'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  AudioLines, 
  Hourglass, 
  Mic, 
  VolumeX, 
  UploadCloud, 
  ArrowRight, 
  Calendar,
  Layers
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import { Analysis } from '@/lib/db';

interface DashboardClientProps {
  user: {
    name: string;
    email: string;
  };
  initialAnalyses: Analysis[];
}

export default function DashboardClient({ user, initialAnalyses }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format duration to human readable format
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins < 60) {
      return `${mins}m ${secs}s`;
    }
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const totalAnalyses = initialAnalyses.length;
  const totalDuration = initialAnalyses.reduce((acc, curr) => acc + curr.duration, 0);
  
  // Calculate average speech/silence
  const avgSpeechPct = totalAnalyses > 0 
    ? initialAnalyses.reduce((acc, curr) => acc + curr.speechPercentage, 0) / totalAnalyses
    : 0;
  const avgSilencePct = totalAnalyses > 0 
    ? initialAnalyses.reduce((acc, curr) => acc + curr.silencePercentage, 0) / totalAnalyses
    : 0;

  // Prepare chart data: recent 7 analyses chronologically (oldest to newest for line flow)
  const chartData = [...initialAnalyses]
    .slice(0, 7)
    .reverse()
    .map(a => ({
      name: a.filename.length > 12 ? a.filename.substring(0, 10) + '...' : a.filename,
      'Speech %': Math.round(a.speechPercentage),
      'Silence %': Math.round(a.silencePercentage),
      duration: Math.round(a.duration)
    }));

  // Pie chart data
  const pieData = [
    { name: 'Speech', value: avgSpeechPct },
    { name: 'Silence', value: avgSilencePct }
  ];
  const COLORS = ['#3b82f6', '#f1f5f9']; // Blue for speech, Light Grey for silence

  return (
    <DashboardLayout user={user}>
      {/* 1. Header welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome back, {user.name.split(' ')[0]}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Here is your speech analysis overview for today.
        </p>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total Analyses */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-blue-50/50 to-indigo-50/20 dark:from-slate-900 dark:to-slate-900 p-6 rounded-2xl border border-blue-100/40 dark:border-slate-800 shadow-md shadow-blue-500/8 dark:shadow-none flex items-center gap-5"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600/70 dark:text-slate-400 uppercase tracking-wider">Total Analyses</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-950 dark:text-white">{totalAnalyses}</h3>
          </div>
        </motion.div>

        {/* Card 2: Total Audio Processed */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-indigo-50/50 to-purple-50/20 dark:from-slate-900 dark:to-slate-900 p-6 rounded-2xl border border-indigo-100/40 dark:border-slate-800 shadow-md shadow-indigo-500/8 dark:shadow-none flex items-center gap-5"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 shrink-0">
            <Hourglass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-600/70 dark:text-slate-400 uppercase tracking-wider">Audio Processed</p>
            <h3 className="text-2xl font-bold mt-1 text-indigo-950 dark:text-white">{formatDuration(totalDuration)}</h3>
          </div>
        </motion.div>

        {/* Card 3: Avg Speech % */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-emerald-50/50 to-teal-50/20 dark:from-slate-900 dark:to-slate-900 p-6 rounded-2xl border border-emerald-100/40 dark:border-slate-800 shadow-md shadow-emerald-500/8 dark:shadow-none flex items-center gap-5"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600/70 dark:text-slate-400 uppercase tracking-wider">Avg Speech %</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-950 dark:text-white">{avgSpeechPct.toFixed(1)}%</h3>
          </div>
        </motion.div>

        {/* Card 4: Avg Silence % */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 dark:from-slate-900 dark:to-slate-900 p-6 rounded-2xl border border-amber-100/40 dark:border-slate-800 shadow-md shadow-amber-500/8 dark:shadow-none flex items-center gap-5"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 shrink-0">
            <VolumeX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600/70 dark:text-slate-400 uppercase tracking-wider">Avg Silence %</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-950 dark:text-white">{avgSilencePct.toFixed(1)}%</h3>
          </div>
        </motion.div>
      </div>

      {/* 3. Empty State or Dashboard Visuals */}
      {totalAnalyses === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100/30 dark:border-blue-900/30">
            <AudioLines className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No audios analyzed yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 text-sm">
            Upload your first WAV, MP3, or FLAC recording to evaluate speech duration, timelines, and download analytical documents.
          </p>
          <div className="mt-8">
            <Link href="/upload">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Audio</span>
              </span>
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trend Chart (Col Span 2) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2">
              <h3 className="text-md font-bold text-slate-800 dark:text-white mb-6">Recent VAD Density Trend</h3>
              <div className="h-72">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpeech" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #f1f5f9', 
                          borderRadius: '12px',
                          color: '#1e293b',
                          fontSize: '11px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                        }} 
                      />
                      <Area type="monotone" dataKey="Speech %" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeech)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-850 rounded-xl animate-pulse" />
                )}
              </div>
            </div>

            {/* Ratio Donut Chart (Col Span 1) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-white mb-2">Overall Acoustic Share</h3>
                <p className="text-xs text-slate-400">Average vocal activity share across all uploaded recordings.</p>
              </div>
              <div className="h-48 flex items-center justify-center relative my-4">
                {mounted ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} className={index === 1 ? 'dark:fill-slate-800' : ''} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Middle stats text */}
                    <div className="absolute text-center">
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{avgSpeechPct.toFixed(0)}%</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Vocal density</p>
                    </div>
                  </>
                ) : (
                  <div className="w-32 h-32 rounded-full border-8 border-slate-100 dark:border-slate-850 animate-pulse" />
                )}
              </div>
              <div className="flex justify-center gap-6 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-500 dark:text-slate-400">Speech ({avgSpeechPct.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <span className="text-slate-500 dark:text-slate-400">Silence ({avgSilencePct.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Analyses list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-md font-bold text-slate-800 dark:text-white">Recent Analysis Tasks</h3>
              <Link href="/history">
                <span className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
                  <span>View History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3.5 px-6">Audio Filename</th>
                    <th className="py-3.5 px-6">Duration</th>
                    <th className="py-3.5 px-6">Vocal Ratio</th>
                    <th className="py-3.5 px-6">Date Analyzed</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {initialAnalyses.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                      <td className="py-4 px-6 font-semibold text-slate-850 dark:text-slate-200 truncate max-w-[200px]">
                        {a.filename}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                        {formatDuration(a.duration)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{a.speechPercentage.toFixed(0)}%</span>
                          {/* Mini Progress Bar */}
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${a.speechPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link href={`/analysis/${a.id}`}>
                          <span className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition-all cursor-pointer">
                            View Report
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
