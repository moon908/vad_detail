'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileAudio, 
  Sliders, 
  HelpCircle, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Clock,
  HardDrive
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

interface UploadClientProps {
  user: {
    name: string;
    email: string;
  };
}

export default function UploadClient({ user }: UploadClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Audio metadata derived from browser decoding
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(0.5);
  
  // Upload and analysis states
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'saving' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  // Clean up states when file changes
  const handleRemoveFile = () => {
    setFile(null);
    setDuration(null);
    setError(null);
    setServerError(null);
    setStatus('idle');
    setProgress(0);
  };

  // Web Audio Synth Warm-up sound generator
  const playWarmUpSound = (type: 'synth' | 'pulse' | 'silence') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Draw simulated waveform bars on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = '#3b82f6';
          
          const barCount = 120;
          for (let i = 0; i < barCount; i++) {
            let maxVal = 0;
            if (type === 'synth') {
              maxVal = Math.abs(Math.sin(i * 0.15) * Math.cos(i * 0.05));
            } else if (type === 'pulse') {
              maxVal = (i % 8 === 0) ? 0.85 : (i % 4 === 0) ? 0.35 : 0.04;
            } else {
              maxVal = 0.01;
            }
            const barWidth = 3;
            const barGap = 2;
            const barHeight = Math.max(2, maxVal * height * 0.85);
            const x = i * (barWidth + barGap);
            const y = (height - barHeight) / 2;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 2);
            ctx.fill();
          }
        }
      }
      
      if (type === 'synth') {
        osc.type = 'sine';
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
        osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.24); // C5
        
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'pulse') {
        osc.type = 'triangle';
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(110, now);
        gainNode.gain.setValueAtTime(0.18, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.25);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.frequency.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      }

      setDuration(type === 'silence' ? 1.0 : type === 'synth' ? 0.45 : 0.35);
      const dummyFile = new File([""], `${type}_test_sound.wav`, { type: "audio/wav" });
      setFile(dummyFile);
      
    } catch (e) {
      console.warn("Sound generation failed:", e);
    }
  };

  // Convert bytes to human readable format
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Convert seconds to MM:SS
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Decode local audio file and draw waveform
  const decodeAndDrawWaveform = async (audioFile: File) => {
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      // AudioContext works on standard browsers
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      
      // Decode audio data (fails on unsupported formats natively like flac on some platforms, which is fine)
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer).catch(() => null);
      
      if (!audioBuffer) {
        // Safe fallback - don't crash, just show file details
        return;
      }

      setDuration(audioBuffer.duration);

      // Draw onto canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rawData = audioBuffer.getChannelData(0); // channel 1
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const barCount = 120;
      const barWidth = 3;
      const barGap = 2;
      const step = Math.floor(rawData.length / barCount);
      
      ctx.fillStyle = '#3b82f6'; // Blue primary color

      for (let i = 0; i < barCount; i++) {
        let maxVal = 0;
        let index = i * step;
        for (let j = 0; j < step; j++) {
          if (index + j < rawData.length) {
            const val = Math.abs(rawData[index + j]);
            if (val > maxVal) maxVal = val;
          }
        }
        
        // Scale bar height (min 2px)
        const barHeight = Math.max(2, maxVal * height * 0.95);
        const x = i * (barWidth + barGap);
        const y = (height - barHeight) / 2;
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      audioCtx.close();
    } catch (err) {
      console.warn('Local audio decoding failed:', err);
    }
  };

  // Handle file drop/selection
  const processFile = (selectedFile: File) => {
    setError(null);
    setServerError(null);
    
    // Check format
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowed = ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac'];
    
    if (!extension || !allowed.includes(extension)) {
      setError(`Unsupported file format. Please upload: ${allowed.join(', ').toUpperCase()}`);
      return;
    }

    // Check size (Max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError('File size exceeds the 50MB limit.');
      return;
    }

    setFile(selectedFile);
    setStatus('idle');
    
    // Try to decode and draw waveform
    decodeAndDrawWaveform(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Trigger file upload and processing
  const handleAnalyze = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(10);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('threshold', threshold.toString());

      // Create an XHR request to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/analyze', true);

      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          // Scale progress: upload is first 40% of the visual progress
          setProgress(Math.round(pct * 0.4));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resData = JSON.parse(xhr.responseText);
            setStatus('completed');
            setProgress(100);
            
            // Redirect to report detail page
            setTimeout(() => {
              router.push(`/analysis/${resData.id}`);
            }, 1000);
          } catch (e) {
            setServerError('Failed to parse backend response metadata.');
            setStatus('error');
          }
        } else {
          let errText = 'An error occurred during audio processing.';
          try {
            const errJson = JSON.parse(xhr.responseText);
            errText = errJson.error || errText;
          } catch (e) {}
          setServerError(errText);
          setStatus('error');
        }
      };

      xhr.onerror = () => {
        setServerError('Network error. Unable to connect to the analysis service.');
        setStatus('error');
      };

      // Start upload
      xhr.send(formData);

      // Simulate step progress while server is analyzing (from 40% to 90%)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          // Increment slowly
          if (prev < 40) return prev;
          if (prev < 70) {
            setStatus('analyzing');
            return prev + 2;
          }
          setStatus('saving');
          return prev + 1;
        });
      }, 800);

    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred.');
      setStatus('error');
    }
  };

  const isProcessing = ['uploading', 'analyzing', 'saving', 'completed'].includes(status);

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Analyze Audio</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Drag and drop a recording below to run local voice activity detection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main upload section (Col Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Uploader Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
              
              <AnimatePresence mode="wait">
                {/* 1. Upload Drag Drop State */}
                {!file && !isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      isDragActive 
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20' 
                        : 'border-slate-150 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-800'
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file"
                      accept=".wav,.mp3,.flac,.ogg,.m4a,.aac"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center text-blue-500 mb-4 border border-blue-100/30">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-md font-bold text-slate-850 dark:text-slate-200">Drag & Drop Audio</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                      Supports WAV, MP3, FLAC, OGG, or M4A (Max 50MB)
                    </p>
                  </motion.div>
                )}

                {/* 2. File Selected & Waveform State */}
                {file && !isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Audio Info Bar */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <FileAudio className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">{file.name}</h4>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {formatSize(file.size)}</span>
                            {duration !== null && (
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(duration)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleRemoveFile}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Pre-drawn Waveform Canvas */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Local Waveform Preview</p>
                      <div className="h-28 bg-slate-50/60 dark:bg-slate-950/80 rounded-2xl flex items-center justify-center p-4 border border-slate-100 dark:border-slate-800/80 relative overflow-hidden">
                        <canvas 
                          ref={canvasRef} 
                          width={600} 
                          height={80} 
                          className="w-full h-full max-w-full"
                        />
                        {duration === null && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-950/50 backdrop-blur-[1px] text-xs text-slate-500 dark:text-slate-400">
                            Reading audio signal...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                      <button 
                        onClick={handleAnalyze}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Analyze Audio Recording</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. Progress State */}
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center space-y-6"
                  >
                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                      {/* Circular spinner background */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="rgba(59, 130, 246, 0.1)" 
                          strokeWidth="6" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="#3b82f6" 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      </svg>
                      {/* Inner percentage */}
                      <div className="absolute text-xl font-bold text-slate-800 dark:text-white">
                        {progress}%
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        {status === 'uploading' && 'Uploading audio file...'}
                        {status === 'analyzing' && 'Running Silero VAD AI...'}
                        {status === 'saving' && 'Generating export documents...'}
                        {status === 'completed' && 'Analysis completed!'}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {status === 'uploading' && 'Transferring audio samples to backend engine.'}
                        {status === 'analyzing' && 'Calculating speech timestamps and acoustic statistics.'}
                        {status === 'saving' && 'Assembling PDF, Word DOCX, and WAV segments ZIP.'}
                        {status === 'completed' && 'Redirecting to your analysis dashboard.'}
                      </p>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Local File Validations Banner */}
              {error && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-xs flex gap-2 mt-4 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Server errors banner */}
              {serverError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-xs flex gap-2 mt-4 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

            </div>
          </div>

          {/* Settings / Explanatory sidebar (Col Span 1) */}
          <div className="space-y-6">
            
            {/* VAD Settings Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4.5 h-4.5 text-blue-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">Analysis Parameters</h3>
              </div>

              {/* Threshold Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">Detection Sensitivity</span>
                  <span className="font-bold text-blue-500 text-sm">{(threshold).toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.9" 
                  step="0.05" 
                  value={threshold} 
                  disabled={isProcessing}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                {/* Description helper */}
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-slate-500 dark:text-slate-300">Low (e.g. 0.3):</span>
                    <span>More sensitive. Detects quiet speech, but might include faint noises as speech.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-slate-500 dark:text-slate-300">High (e.g. 0.7):</span>
                    <span>Less sensitive. Captures only loud, clear voice, ignoring background chatter.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 🎤 Sound Check Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-pink-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">🎤 Sound Check & Synth</h3>
              </div>
              <p className="text-[10px] text-slate-400">
                Warm up your microphone and test the waveform renderer with browser-synthesized sounds.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => playWarmUpSound('synth')}
                  className="w-full py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-200/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  🎹 Retro Synth Chord
                </button>
                <button
                  onClick={() => playWarmUpSound('pulse')}
                  className="w-full py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-200/50 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  ⚡ Techno Dub Bass
                </button>
                <button
                  onClick={() => playWarmUpSound('silence')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-355 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  🤫 Flat Silence Line
                </button>
              </div>
            </div>

            {/* AI Insights Explanation */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm text-xs space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Generated Deliverables</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Once analyzed, the platform compiles:
              </p>
              <ul className="space-y-2 text-slate-400 pl-4 list-disc">
                <li>Dynamic interactive timelines.</li>
                <li>Downloadable executive PDF report.</li>
                <li>Microsoft Word DOCX report.</li>
                <li>Speech segments CSV / JSON data.</li>
                <li>Extracted speech-only and silence-only audio WAV tracks.</li>
                <li>ZIP bundle containing all results.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
