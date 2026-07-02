'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  AudioLines, 
  ArrowRight, 
  Mic, 
  FileText, 
  Download, 
  Sliders, 
  CheckCircle2, 
  LayoutDashboard
} from 'lucide-react';

export default function LandingPageClient() {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Synchronize theme with local storage & document element
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listener for theme changes from other tabs or dashboard
    const handleStorageChange = () => {
      const updatedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (updatedTheme) {
        setTheme(updatedTheme);
        if (updatedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const features = [
    {
      icon: AudioLines,
      title: "Silero VAD Inference",
      desc: "Leverages a state-of-the-art pretrained PyTorch neural network for fast and precise speech vs. silence boundary mapping."
    },
    {
      icon: Sliders,
      title: "Interactive Customization",
      desc: "Adjust detection sensitivity thresholds in real-time to match quiet rooms, conference calls, or noisy field environments."
    },
    {
      icon: FileText,
      title: "Professional Report Exports",
      desc: "Instantly compile executive PDF summaries (with matplotlib graphics) and Microsoft Word docx logs for legal or corporate archives."
    },
    {
      icon: Download,
      title: "Isolated Audio Slices",
      desc: "Download speech-only or silence-only composite tracks, or download individual speech segment WAV files directly."
    }
  ];

  // Particle positions & animation parameters (defined statically to avoid hydration mismatches)
  const floatParticles = [
    { left: '8%', top: '25%', delay: 0, duration: 7, height: 35 },
    { left: '22%', top: '70%', delay: 1.5, duration: 9, height: 55 },
    { left: '38%', top: '18%', delay: 0.7, duration: 8, height: 28 },
    { left: '52%', top: '85%', delay: 2.2, duration: 10, height: 48 },
    { left: '68%', top: '40%', delay: 1.1, duration: 7.5, height: 65 },
    { left: '82%', top: '55%', delay: 3.1, duration: 9.5, height: 32 },
    { left: '93%', top: '28%', delay: 1.8, duration: 8.5, height: 42 },
    { left: '16%', top: '80%', delay: 2.7, duration: 9, height: 50 },
  ];

  const equalizerBars = [
    { delay: 0.1, duration: 1.2, maxH: 'h-12' },
    { delay: 0.3, duration: 0.8, maxH: 'h-20' },
    { delay: 0.0, duration: 1.5, maxH: 'h-10' },
    { delay: 0.5, duration: 1.0, maxH: 'h-16' },
    { delay: 0.2, duration: 0.7, maxH: 'h-24' },
    { delay: 0.4, duration: 1.3, maxH: 'h-14' },
    { delay: 0.1, duration: 0.9, maxH: 'h-18' },
    { delay: 0.6, duration: 1.1, maxH: 'h-12' },
  ];

  // Motion variants supporting prefers-reduced-motion
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0.02 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 20, 
      scale: shouldReduceMotion ? 1 : 0.98 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const cardHoverEffect = shouldReduceMotion 
    ? {} 
    : {
        y: -5,
        transition: { duration: 0.25, ease: 'easeOut' as const },
      };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* 1. Subtle Animated Aurora/Mesh Gradient Background (Low Opacity) */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ 
              x: [0, 45, -30, 0], 
              y: [0, -35, 25, 0],
              scale: [1, 1.15, 0.9, 1] 
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-15%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-500/10 dark:from-blue-600/10 dark:to-indigo-600/5 blur-[120px]"
          />
          <motion.div 
            animate={{ 
              x: [0, -35, 45, 0], 
              y: [0, 30, -25, 0],
              scale: [1, 0.9, 1.15, 1] 
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-20%] right-[-15%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-purple-400/10 to-cyan-400/10 dark:from-purple-600/10 dark:to-cyan-600/5 blur-[120px]"
          />
          <motion.div 
            animate={{ 
              x: [0, 20, -15, 0], 
              y: [0, 40, -30, 0],
              scale: [0.9, 1.1, 0.95, 0.9] 
            }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-emerald-400/5 to-blue-400/5 dark:from-emerald-600/5 dark:to-blue-600/5 blur-[100px]"
          />
        </div>
      )}

      {/* Legacy/Static Orbs (kept as fallback or dark overlays for design depth) */}
      <div className="absolute top-[-25%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-600/5 dark:bg-blue-500/5 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 blur-[130px] pointer-events-none z-0" />

      {/* 2. Floating Sound-wave Particles (Gently drift vertically) */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {floatParticles.map((particle, idx) => (
            <motion.div
              key={idx}
              style={{
                position: 'absolute',
                left: particle.left,
                top: particle.top,
                width: '2px',
                height: `${particle.height}px`,
              }}
              className="bg-gradient-to-b from-blue-500/20 via-indigo-500/15 to-transparent dark:from-blue-400/25 dark:via-indigo-500/15 dark:to-transparent rounded-full"
              animate={{
                y: [0, -40, 0],
                opacity: [0.15, 0.45, 0.15],
                scaleY: [1, 1.25, 1],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Top Header Navbar with Glassmorphism and Hover Underlines */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/50 shrink-0 z-20 backdrop-blur-md bg-white/40 dark:bg-slate-950/40 relative">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/40 transition-all duration-300">
            V
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 dark:group-hover:from-blue-400 dark:group-hover:to-indigo-400 transition-all duration-300">
            AcuVAD AI
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors relative py-1 group">
            Log In
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md dark:shadow-white/5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-transparent dark:border-slate-200"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* 4. Hero Section & Main content wrapping animations */}
      <main 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col justify-center py-12 md:py-20 z-10 relative"
      >
        {/* Soft cursor spotlight element (only on desktop/hover) */}
        {!shouldReduceMotion && isHovered && (
          <div 
            className="absolute pointer-events-none hidden lg:block rounded-full z-0 transition-opacity duration-300"
            style={{
              width: '600px',
              height: '600px',
              left: `${mousePos.x - 300}px`,
              top: `${mousePos.y - 300}px`,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 100%)',
            }}
          />
        )}

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10"
        >
          {/* Hero Left Content Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header Badge */}
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50/80 border border-blue-200/50 dark:bg-blue-950/30 dark:border-blue-900/40 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold shadow-sm hover:scale-[1.02] transition-transform duration-300 cursor-default"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>AI Voice Activity Detection Platform</span>
            </motion.div>

            {/* H1 Title with subtle underlying Waveform decoration */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight relative"
            >
              Segment Speech and Generate Report Logs <br/>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                With State-of-the-Art VAD
              </span>

              {/* Decorative background waveform underneath title */}
              <div className="absolute -bottom-4 left-0 w-48 h-3 opacity-30 dark:opacity-40 pointer-events-none hidden md:block overflow-hidden">
                <svg viewBox="0 0 100 20" className="w-full h-full stroke-blue-500 fill-none stroke-[2.5]" strokeLinecap="round">
                  <path d="M 0 10 Q 10 5, 20 15 T 40 10 T 60 5 T 80 15 T 100 10" className="animate-[dash_10s_linear_infinite]" style={{ strokeDasharray: '6, 6' }} />
                </svg>
              </div>
            </motion.h1>

            {/* Paragraph Text */}
            <motion.p 
              variants={itemVariants}
              className="text-slate-500 dark:text-slate-400 text-sm md:text-md leading-relaxed max-w-2xl"
            >
              Upload voice recordings in WAV, MP3, or FLAC. Our PyTorch engine filters background noise, maps speech intervals, calculates syllables rate, and compiles interactive dashboards, document logs, and isolated audio segment directories.
            </motion.p>

            {/* Button Actions */}
            <motion.div 
              variants={itemVariants}
              className="pt-4 flex flex-wrap gap-4"
            >
              {/* Primary Action with Animated Gradient Border Ring */}
              <div className="relative group rounded-xl p-[2px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 group-hover:opacity-100 transition-opacity duration-300 opacity-80" />
                <Link 
                  href="/register" 
                  className="relative px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 dark:from-slate-900 dark:to-slate-900 text-white dark:text-slate-100 font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Secondary Action */}
              <Link 
                href="/login" 
                className="px-6 py-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Sign In to Platform</span>
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Column (Premium Glowing Microphone and VAD Waveform Illustration) */}
          <div className="hidden lg:flex lg:col-span-5 items-center justify-center relative">
            
            {/* Pulsing Background Radial Gradients */}
            <div className="absolute w-72 h-72 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-3xl animate-pulse" />
            <div className="absolute w-56 h-56 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-2xl animate-pulse delay-500" />
            
            {/* High-Fidelity Glassmorphic Dashboard Panel Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 80 }}
              className="w-full max-w-sm rounded-3xl p-6 backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800/70 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              {/* Decorative Top Bezel light glow */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

              {/* Panel Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    VAD Engine Active
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
              </div>

              {/* Core Visualizer Area */}
              <div className="relative bg-slate-100/50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-900/60 flex flex-col items-center justify-center min-h-[160px] overflow-hidden">
                
                {/* Rotating ring glow effect in dark mode */}
                <div className="absolute inset-0 bg-radial-gradient from-blue-500/5 to-transparent opacity-60 pointer-events-none" />

                {/* Glowing Microphone Indicator in the center */}
                <motion.div 
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 relative z-10 group"
                >
                  <Mic className="w-6 h-6 animate-pulse" />
                  <div className="absolute -inset-2 rounded-full border border-blue-500/30 dark:border-blue-400/30 animate-ping opacity-40" />
                  <div className="absolute -inset-4 rounded-full border border-indigo-500/10 dark:border-indigo-400/10 animate-ping opacity-20 [animation-delay:0.8s]" />
                </motion.div>

                {/* Ambient Real-time Equalizer Bars */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-center gap-1.5 h-12 overflow-hidden pointer-events-none opacity-30 dark:opacity-40">
                  {equalizerBars.map((bar, idx) => (
                    <motion.div
                      key={idx}
                      className={`w-[3px] bg-gradient-to-t from-blue-500 to-indigo-500 rounded-full ${bar.maxH}`}
                      animate={shouldReduceMotion ? {} : { scaleY: [0.3, 1, 0.3] }}
                      transition={{
                        duration: bar.duration,
                        delay: bar.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ originY: 1 }}
                    />
                  ))}
                </div>
              </div>

              {/* High-Fidelity Skeleton Analysis Graph (Asynchronous demo visualizer) */}
              <div className="mt-4 space-y-3.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  <span>SEGMENT MAPPING</span>
                  <span className="font-mono text-blue-500 dark:text-blue-400">98.4% Confidence</span>
                </div>
                
                {/* Grid representing loaded graph skeletons */}
                <div className="space-y-2">
                  {/* Row 1 skeleton loader mimicking VAD timeline */}
                  <div className="h-6 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200/30 dark:border-slate-900/40 p-1 flex items-center gap-1">
                    <div className="w-[10%] h-full rounded bg-emerald-500/20 dark:bg-emerald-500/20 border border-emerald-500/30 animate-pulse flex items-center justify-center">
                      <span className="text-[6px] text-emerald-600 font-bold">V</span>
                    </div>
                    <div className="w-[45%] h-full rounded bg-slate-200/50 dark:bg-slate-800/40 animate-pulse" />
                    <div className="w-[30%] h-full rounded bg-emerald-500/20 dark:bg-emerald-500/20 border border-emerald-500/30 animate-pulse flex items-center justify-center">
                      <span className="text-[6px] text-emerald-600 font-bold">V</span>
                    </div>
                    <div className="w-[15%] h-full rounded bg-slate-200/50 dark:bg-slate-800/40 animate-pulse" />
                  </div>

                  {/* Row 2 skeleton loader mimicking metrics */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="h-3.5 rounded bg-slate-100 dark:bg-slate-950 w-24 animate-pulse" />
                    <div className="h-3.5 rounded bg-slate-100 dark:bg-slate-950 w-16 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* 5. Feature Card Grid section (reveal items staggered) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 md:mt-24 relative z-10">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            // Float parameters per card to break uniform pattern
            const floatOffset = idx % 2 === 0 ? [0, -6, 0] : [0, -4, 0];
            const floatDuration = idx % 2 === 0 ? 5 : 6;
            const floatDelay = idx * 0.3;

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
              >
                <motion.div
                  animate={shouldReduceMotion ? {} : { y: floatOffset }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "mirror",
                    duration: floatDuration,
                    delay: floatDelay,
                    ease: "easeInOut"
                  }}
                  whileHover={cardHoverEffect}
                  className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-slate-200/60 dark:border-slate-800/50 rounded-2xl p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-300 group cursor-default h-full"
                >
                  {/* Icon wrapper with glow on hover */}
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/60 dark:border-blue-900/30 group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white dark:group-hover:text-white transition-all duration-300 animate-duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 transition-colors duration-300">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </section>
      </main>

      {/* 6. Footer with subtle borders and glassmorphism styling */}
      <footer className="h-16 max-w-7xl w-full mx-auto px-6 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/50 text-xs text-slate-500 dark:text-slate-400 z-10 backdrop-blur-md bg-white/40 dark:bg-slate-950/40 relative">
        <div>© 2026 AcuVAD AI Platform. All rights reserved.</div>
        <div className="flex gap-4">
          <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors relative py-0.5 group">
            Privacy Policy
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-500 dark:bg-slate-400 transition-all duration-300 group-hover:w-full" />
          </span>
          <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors relative py-0.5 group">
            Terms of Service
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-500 dark:bg-slate-400 transition-all duration-300 group-hover:w-full" />
          </span>
        </div>
      </footer>
    </div>
  );
}
