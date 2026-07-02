'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  FileArchive, 
  Download, 
  Clock, 
  Mic, 
  VolumeX, 
  Activity, 
  Play, 
  Pause, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  FileAudio,
  BrainCircuit,
  MessageSquare,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid
} from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';
import { Analysis } from '@/lib/db';

interface AnalysisClientProps {
  user: {
    name: string;
    email: string;
  };
  analysis: Analysis;
}

export default function AnalysisClient({ user, analysis }: AnalysisClientProps) {
  const [mounted, setMounted] = useState(false);
  
  // Custom audio player state
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'id' | 'start' | 'duration'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Format seconds to MM:SS.ms
  const formatTimeDetail = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 100);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Play/Pause audio handler
  const handlePlayAudio = (url: string, trackName: string) => {
    if (playingTrack === trackName) {
      // Pause
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      // Stop previous
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      setAudioUrl(url);
      setPlayingTrack(trackName);

      // Play new
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch((err) => {
            console.error("Audio playback error:", err);
            setPlayingTrack(null);
          });
        }
      }, 50);
    }
  };

  // Handle audio track end
  const handleAudioEnded = () => {
    setPlayingTrack(null);
  };

  // Timeline segments generation (including speech and silence)
  const getTimelineBlocks = () => {
    const blocks: { type: 'speech' | 'silence'; start: number; end: number; duration: number; id?: number }[] = [];
    let lastEnd = 0;

    analysis.segments.forEach((seg) => {
      // Check for silence preceding speech
      if (seg.start > lastEnd + 0.01) {
        blocks.push({
          type: 'silence',
          start: lastEnd,
          end: seg.start,
          duration: seg.start - lastEnd
        });
      }
      blocks.push({
        type: 'speech',
        start: seg.start,
        end: seg.end,
        duration: seg.duration,
        id: seg.id
      });
      lastEnd = seg.end;
    });

    // Check for trailing silence
    if (lastEnd < analysis.duration - 0.01) {
      blocks.push({
        type: 'silence',
        start: lastEnd,
        end: analysis.duration,
        duration: analysis.duration - lastEnd
      });
    }

    return blocks;
  };

  const timelineBlocks = getTimelineBlocks();

  // Recharts Pie data
  const pieData = [
    { name: 'Speech', value: analysis.speechPercentage },
    { name: 'Silence', value: analysis.silencePercentage }
  ];
  const PIE_COLORS = ['#3b82f6', '#f1f5f9']; // Blue / Light Grey

  // Recharts Bar chart data
  const barData = analysis.segments.slice(0, 15).map(seg => ({
    name: `Seg ${seg.id}`,
    duration: seg.duration
  }));

  // Filtering, Sorting, Pagination for table
  const handleSort = (field: 'id' | 'start' | 'duration') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredSegments = analysis.segments.filter(seg => 
    seg.id.toString().includes(searchTerm) ||
    seg.start.toFixed(2).includes(searchTerm) ||
    seg.end.toFixed(2).includes(searchTerm) ||
    seg.duration.toFixed(2).includes(searchTerm)
  );

  const sortedSegments = [...filteredSegments].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedSegments.length / itemsPerPage);
  const paginatedSegments = sortedSegments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Client-side CSV Download
  const downloadCsvLocal = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Segment ID,Start Time (s),End Time (s),Duration (s)\r\n";
    analysis.segments.forEach(seg => {
      csvContent += `${seg.id},${seg.start},${seg.end},${seg.duration}\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `segments_${analysis.filename.split('.')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout user={user}>
      {/* Invisible HTML5 Audio Tag */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {/* 1. Header Information */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold uppercase tracking-wider">
              {analysis.format}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(analysis.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight truncate max-w-lg">
            {analysis.filename}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Analysis ID: <span className="font-mono text-slate-500">{analysis.id}</span>
          </p>
        </div>

        {/* Downloads Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* PDF Button */}
          <a 
            href={analysis.reportUrls.pdf} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-red-500" />
            <span>PDF Report</span>
          </a>

          {/* Word Button */}
          <a 
            href={analysis.reportUrls.docx} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            <span>Word DOCX</span>
          </a>

          {/* CSV Button */}
          <a 
            href={analysis.reportUrls.csv} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>CSV Data</span>
          </a>

          {/* JSON Button */}
          <a 
            href={analysis.reportUrls.json} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-purple-500" />
            <span>JSON Data</span>
          </a>

          {/* ZIP Button */}
          <a 
            href={analysis.reportUrls.zip} 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          >
            <FileArchive className="w-4 h-4" />
            <span>Download ZIP Bundle</span>
          </a>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/40 dark:from-slate-900 dark:to-slate-900 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-md shadow-slate-400/8 dark:shadow-none text-center">
          <Clock className="w-5 h-5 text-slate-555 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-slate-500/80 dark:text-slate-400 uppercase tracking-wider">Duration</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{formatDuration(analysis.duration)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/20 dark:from-slate-900 dark:to-slate-900 p-4.5 rounded-2xl border border-blue-100/40 dark:border-slate-800 shadow-md shadow-blue-500/8 dark:shadow-none text-center">
          <Mic className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-blue-600/70 dark:text-slate-400 uppercase tracking-wider">Speech Time</p>
          <p className="text-lg font-bold text-blue-950 dark:text-slate-200 mt-1">{analysis.totalSpeech.toFixed(1)}s</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 dark:from-slate-900 dark:to-slate-900 p-4.5 rounded-2xl border border-amber-100/40 dark:border-slate-800 shadow-md shadow-amber-500/8 dark:shadow-none text-center">
          <VolumeX className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-amber-600/70 dark:text-slate-400 uppercase tracking-wider">Silence Time</p>
          <p className="text-lg font-bold text-amber-950 dark:text-white mt-1">{analysis.totalSilence.toFixed(1)}s</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/20 dark:from-slate-900 dark:to-slate-900 p-4.5 rounded-2xl border border-emerald-100/40 dark:border-slate-800 shadow-md shadow-emerald-500/8 dark:shadow-none text-center">
          <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-emerald-600/70 dark:text-slate-400 uppercase tracking-wider">Speech Ratio</p>
          <p className="text-lg font-bold text-emerald-950 dark:text-white mt-1">{analysis.speechPercentage.toFixed(1)}%</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/20 dark:from-slate-900 dark:to-slate-900 p-4.5 rounded-2xl border border-indigo-100/40 dark:border-slate-800 shadow-md shadow-indigo-500/8 dark:shadow-none text-center">
          <Layers className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-indigo-600/70 dark:text-slate-400 uppercase tracking-wider">Speech Chunks</p>
          <p className="text-lg font-bold text-indigo-950 dark:text-slate-200 mt-1">{analysis.speechSegmentsCount}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/20 dark:from-slate-900 dark:to-slate-900 p-4.5 rounded-2xl border border-purple-100/40 dark:border-slate-800 shadow-md shadow-purple-500/8 dark:shadow-none text-center">
          <BrainCircuit className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-purple-600/70 dark:text-slate-400 uppercase tracking-wider">Speak Speed</p>
          <p className="text-lg font-bold text-purple-950 dark:text-white mt-1">{analysis.estimatedSpeakingSpeedWpm.toFixed(0)} WPM</p>
        </div>
      </div>

      {/* Fun Vibe Check Card */}
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl animate-bounce shrink-0">
            🎙️
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Acoustic Vibe Check</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Automated stylistic profile match based on tempo and density analytics.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {/* Badge 1: Speed Style */}
          <span className="px-3 py-1.5 bg-blue-50/60 dark:bg-slate-900 text-blue-700 dark:text-slate-350 border border-blue-100/50 dark:border-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm select-none">
            {analysis.estimatedSpeakingSpeedWpm > 150 ? "🚀 Rocket Talker" : analysis.estimatedSpeakingSpeedWpm < 100 ? "🧘 Zen Master" : "🎙️ TED Presenter"}
          </span>
          {/* Badge 2: Silence Quotient */}
          <span className="px-3 py-1.5 bg-amber-50/60 dark:bg-slate-900 text-amber-700 dark:text-slate-350 border border-amber-100/50 dark:border-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm select-none">
            {analysis.silencePercentage > 50 ? "🎭 Shakespearean Pauses" : analysis.silencePercentage < 15 ? "📢 Staccato Stream" : "⚖️ Speech Balance"}
          </span>
          {/* Badge 3: Award Badge */}
          <span className="px-3 py-1.5 bg-purple-50/60 dark:bg-slate-900 text-purple-700 dark:text-slate-350 border border-purple-100/50 dark:border-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm select-none">
            {analysis.duration < 5 ? "📱 Micro-Blogger" : analysis.duration > 180 ? "🎧 Podcast Star" : "🏃 Acoustic Athlete"}
          </span>
        </div>
      </div>

      {/* 3. Visual Acoustic Timeline (Horizontal Strip) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Acoustic Timeline Map</h3>
        
        {/* Horizontal bar */}
        <div className="h-8 w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex overflow-hidden border border-slate-100/50 dark:border-slate-700/50 relative">
          {timelineBlocks.map((block, idx) => {
            const widthPct = (block.duration / analysis.duration) * 100;
            return (
              <div 
                key={idx}
                className={`h-full relative group transition-all duration-200 ${
                  block.type === 'speech' 
                    ? 'bg-blue-500 hover:bg-blue-400 border-r border-blue-600/20 last:border-none' 
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-700 border-r border-slate-200/10 last:border-none'
                }`}
                style={{ width: `${widthPct}%` }}
                title={`${block.type.toUpperCase()}: ${block.start.toFixed(2)}s - ${block.end.toFixed(2)}s (${block.duration.toFixed(2)}s)`}
              >
                {/* Micro tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-250 text-[10px] font-semibold py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-md">
                  {block.type === 'speech' ? `Speech Segment #${block.id}` : 'Silence/Pause'}<br/>
                  {block.start.toFixed(2)}s - {block.end.toFixed(2)}s ({block.duration.toFixed(2)}s)
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs justify-end">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-slate-400">Speech ({analysis.speechPercentage.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
            <span className="text-slate-400">Silence/Pause ({analysis.silencePercentage.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Visualizations Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Overall Ratio (Col 1) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Speech density ratio</h3>
            <p className="text-[10px] text-slate-400">Comparison of vocal density against pauses.</p>
          </div>
          <div className="h-44 flex items-center justify-center relative my-4">
            {mounted ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} className={index === 1 ? 'dark:fill-slate-800' : ''} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{analysis.speechPercentage.toFixed(0)}%</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Acoustic share</p>
                </div>
              </>
            ) : (
              <div className="w-28 h-28 rounded-full border-8 border-slate-100 dark:border-slate-800" />
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-blue-500" />
              <span className="text-slate-400">Speech</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-slate-100 dark:bg-slate-850" />
              <span className="text-slate-400">Silence</span>
            </div>
          </div>
        </div>

        {/* Right: Durations Bar Chart (Col Span 2) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Speech segment durations (First 15)</h3>
          <div className="h-56">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #f1f5f9', 
                      borderRadius: '12px',
                      color: '#1e293b',
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }} 
                  />
                  <Bar dataKey="duration" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-850 rounded-xl animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* 5. Custom Isolated Audio Player & AI insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Isolated Audio Players */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Isolated Audio Channels</h3>
            <p className="text-[10px] text-slate-400">Play isolated speech segments or silence regions.</p>
          </div>

          <div className="space-y-3.5">
            {/* Speech Only Player block */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Speech Only track</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{analysis.totalSpeech.toFixed(1)} seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handlePlayAudio(analysis.reportUrls.speech_only, 'speech_only')}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                  title="Play speech track"
                >
                  {playingTrack === 'speech_only' ? <Pause className="w-4.5 h-4.5 fill-white" /> : <Play className="w-4.5 h-4.5 fill-white" />}
                </button>
                <a 
                  href={analysis.reportUrls.speech_only}
                  download="speech_only.wav"
                  className="p-2 text-slate-400 hover:text-slate-850 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                  title="Download track"
                >
                  <Download className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

            {/* Silence Only Player block */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
                  <VolumeX className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Silence Only track</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{analysis.totalSilence.toFixed(1)} seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handlePlayAudio(analysis.reportUrls.silence_only, 'silence_only')}
                  className="p-2 bg-slate-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                  title="Play silence track"
                >
                  {playingTrack === 'silence_only' ? <Pause className="w-4.5 h-4.5 fill-white" /> : <Play className="w-4.5 h-4.5 fill-white" />}
                </button>
                <a 
                  href={analysis.reportUrls.silence_only}
                  download="silence_only.wav"
                  className="p-2 text-slate-400 hover:text-slate-850 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                  title="Download track"
                >
                  <Download className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* AI observations Section (Col Span 2) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4.5 h-4.5 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">AI-Generated Observations</h3>
            </div>
            <p className="text-[10px] text-slate-400 mb-4">Rule-based analytical diagnostics mapped from the VAD metrics.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {analysis.aiInsights.map((insight, idx) => (
              <div 
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2"
              >
                <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Speech Timestamp Segments list table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Header toolbar */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Speech Segments List</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Found {filteredSegments.length} vocal segments</p>
          </div>

          {/* Search/Filter and Export */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search segments..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset page on filter
                }}
                className="w-full pl-8.5 pr-4 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-880 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>

            {/* Export CSV button */}
            <button 
              onClick={downloadCsvLocal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-400 uppercase text-[9px] font-bold tracking-wider select-none">
                <th 
                  className="py-3 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>Segment</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                  onClick={() => handleSort('start')}
                >
                  <div className="flex items-center gap-1">
                    <span>Start Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-6">End Time</th>
                <th 
                  className="py-3 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center gap-1">
                    <span>Duration</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
              {paginatedSegments.map((seg) => {
                const segUrl = analysis.reportUrls.segments[seg.id - 1] || "";
                const segName = `seg_${seg.id}`;
                
                return (
                  <tr key={seg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition-all">
                    <td className="py-3 px-6 font-bold text-slate-850 dark:text-slate-200">
                      Segment #{seg.id.toString().padStart(3, '0')}
                    </td>
                    <td className="py-3 px-6 text-slate-500 dark:text-slate-400 font-mono">
                      {formatTimeDetail(seg.start)}
                    </td>
                    <td className="py-3 px-6 text-slate-500 dark:text-slate-400 font-mono">
                      {formatTimeDetail(seg.end)}
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded font-semibold font-mono">
                        {seg.duration.toFixed(3)}s
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handlePlayAudio(segUrl, segName)}
                        className="p-1.5 bg-slate-100 hover:bg-blue-500 text-slate-600 dark:text-slate-400 hover:text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        title="Play segment"
                        disabled={!segUrl}
                      >
                        {playingTrack === segName ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                      <a 
                        href={segUrl}
                        download={`segment_${seg.id.toString().padStart(3, '0')}.wav`}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                        title="Download segment WAV"
                        onClick={(e) => {
                          if (!segUrl) e.preventDefault();
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })}

              {paginatedSegments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No segments match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 py-1.5 px-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <span>Page {currentPage} of {totalPages}</span>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 py-1.5 px-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
