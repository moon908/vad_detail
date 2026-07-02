'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { forgotPasswordAction } from '../actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [clientError, setClientError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    setTheme(savedTheme || 'light');
  }, []);

  // React 19 useActionState hook
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      e.preventDefault();
      setClientError('Please enter a valid email address.');
    } else {
      setClientError('');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen flex items-center justify-center overflow-hidden px-4 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Background Gradients */}
      <div className={`absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none transition-all duration-300 ${
        isDark ? 'bg-purple-600/10' : 'bg-purple-600/5'
      }`} />
      <div className={`absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none transition-all duration-300 ${
        isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
      }`} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className={`backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isDark 
            ? 'bg-slate-900/60 border-slate-800' 
            : 'bg-white/80 border-slate-200'
        }`}>
          {/* Top colored edge border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />

          {state && state.success ? (
            /* Success View */
            <div className="text-center py-4 space-y-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
                isDark 
                  ? 'bg-green-950/40 border-green-500/30 text-green-400' 
                  : 'bg-green-50 border-green-200 text-green-600'
              }`}>
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Reset Link Sent
                </h3>
                <p className={`text-sm mt-2 px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {state.message}
                </p>
              </div>
              <div className="pt-4">
                <Link 
                  href="/login" 
                  className={`inline-flex items-center gap-2 text-sm font-bold transition-colors ${
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Log In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Request Form View */
            <>
              <div className="mb-6 text-center">
                <h2 className={`text-3xl font-extrabold tracking-tight transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Reset Password
                </h2>
                <p className={`mt-2 text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  We'll send you instructions to reset your password
                </p>
              </div>

              <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
                {/* Global Error Banner */}
                {state && !state.success && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-3 border rounded-xl text-sm flex items-start gap-2.5 ${
                      isDark 
                        ? 'bg-red-950/50 border-red-800/60 text-red-200' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <span>{state.message}</span>
                  </motion.div>
                )}

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className={`text-xs font-semibold uppercase tracking-wider block transition-colors duration-300 ${
                    isDark ? 'text-slate-355' : 'text-slate-505'
                  }`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full pl-10 pr-4 py-3 focus:outline-none focus:ring-1 transition-all text-sm rounded-xl ${
                        isDark 
                          ? 'bg-slate-950/50 border-slate-800 focus:border-purple-500 focus:ring-purple-500 text-slate-100 placeholder-slate-600' 
                          : 'bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  {clientError && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">
                      {clientError}
                    </p>
                  )}
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full relative group overflow-hidden py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>
              </form>

              {/* Back Link */}
              <div className={`mt-8 text-center pt-6 border-t ${
                isDark ? 'border-slate-800/80' : 'border-slate-100'
              }`}>
                <Link 
                  href="/login" 
                  className={`inline-flex items-center gap-2 text-xs font-semibold transition-colors ${
                    isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Log In</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
