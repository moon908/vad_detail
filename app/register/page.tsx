'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, User, Mail, Lock, AlertCircle } from 'lucide-react';
import { registerAction } from '../actions/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    setTheme(savedTheme || 'light');
  }, []);

  // React 19 useActionState hook
  const [state, formAction, isPending] = useActionState(registerAction, null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const errors: Record<string, string> = {};
    if (!name || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setClientErrors(errors);
    } else {
      setClientErrors({});
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen flex items-center justify-center overflow-hidden px-4 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Background Gradients */}
      <div className={`absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none transition-all duration-300 ${
        isDark ? 'bg-indigo-600/10' : 'bg-indigo-600/5'
      }`} />
      <div className={`absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none transition-all duration-300 ${
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
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="mb-8 text-center">
            <h2 className={`text-3xl font-extrabold tracking-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Create Account
            </h2>
            <p className={`mt-2 text-sm transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Start parsing speech activity in seconds
            </p>
          </div>

          <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
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

            {/* Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="name" className={`text-xs font-semibold uppercase tracking-wider block transition-colors duration-300 ${
                isDark ? 'text-slate-350' : 'text-slate-500'
              }`}>
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition-all text-sm rounded-xl ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-slate-100 placeholder-slate-650' 
                      : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm'
                  }`}
                />
              </div>
              {(clientErrors.name || (state?.errors && state.errors.name)) && (
                <p className="text-red-500 text-xs mt-1 font-semibold">
                  {clientErrors.name || state?.errors?.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className={`text-xs font-semibold uppercase tracking-wider block transition-colors duration-300 ${
                isDark ? 'text-slate-350' : 'text-slate-500'
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
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition-all text-sm rounded-xl ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-slate-100 placeholder-slate-650' 
                      : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm'
                  }`}
                />
              </div>
              {(clientErrors.email || (state?.errors && state.errors.email)) && (
                <p className="text-red-500 text-xs mt-1 font-semibold">
                  {clientErrors.email || state?.errors?.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className={`text-xs font-semibold uppercase tracking-wider block transition-colors duration-300 ${
                isDark ? 'text-slate-350' : 'text-slate-500'
              }`}>
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition-all text-sm rounded-xl ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-slate-100 placeholder-slate-650' 
                      : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm'
                  }`}
                />
              </div>
              {(clientErrors.password || (state?.errors && state.errors.password)) && (
                <p className="text-red-500 text-xs mt-1 font-semibold">
                  {clientErrors.password || state?.errors?.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className={`text-xs font-semibold uppercase tracking-wider block transition-colors duration-300 ${
                isDark ? 'text-slate-350' : 'text-slate-500'
              }`}>
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition-all text-sm rounded-xl ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-slate-100 placeholder-slate-650' 
                      : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm'
                  }`}
                />
              </div>
              {clientErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 font-semibold">
                  {clientErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full relative group overflow-hidden py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Link */}
          <div className={`mt-8 text-center pt-6 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-100'
          }`}>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Already have an account?{' '}
              <Link 
                href="/login" 
                className={`font-bold transition-colors ${
                  isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'
                }`}
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
