import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
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

const JWT_SECRET = process.env.JWT_SECRET || 'secret-vad-analysis-platform-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export default async function LandingPage() {
  // Check if user is already authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  let authenticated = false;

  if (token) {
    try {
      await jwtVerify(token, secretKey);
      authenticated = true;
    } catch (err) {}
  }

  // If already logged in, redirect straight to dashboard
  if (authenticated) {
    redirect('/dashboard');
  }

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute top-[-25%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none" />

      {/* Top Header Navbar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between border-b border-slate-200/80 shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            V
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            AcuVAD AI
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            Log In
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col justify-center py-12 md:py-20 z-10">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200/60 rounded-full text-blue-600 text-xs font-bold shadow-sm">
            <Mic className="w-3.5 h-3.5" />
            <span>AI Voice Activity Detection Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Segment Speech and Generate Report Logs <br/>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              With State-of-the-Art VAD
            </span>
          </h1>

          <p className="text-slate-500 text-sm md:text-md leading-relaxed max-w-2xl">
            Upload voice recordings in WAV, MP3, or FLAC. Our PyTorch engine filters background noise, maps speech intervals, calculates syllables rate, and compiles interactive dashboards, document logs, and isolated audio segment directories.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link 
              href="/register" 
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-sm border border-slate-200 shadow-sm transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <span>Sign In to Platform</span>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 md:mt-24">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:shadow-md hover:border-slate-350 transition-all duration-200 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </section>
      </main>

      {/* Footer */}
      <footer className="h-16 max-w-7xl w-full mx-auto px-6 flex items-center justify-between border-t border-slate-200/80 text-xs text-slate-500 z-10">
        <div>© 2026 AcuVAD AI Platform. All rights reserved.</div>
        <div className="flex gap-4">
          <span className="hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-slate-800 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
