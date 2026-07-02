'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  Trash2, 
  Sun, 
  Moon, 
  AlertTriangle, 
  CheckCircle,
  Bell,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  updateProfileAction, 
  changePasswordAction, 
  deleteAccountAction 
} from '../actions/auth';

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  // Theme state local syncing
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Profile form states
  const [name, setName] = useState(user.name);
  const [profilePending, startProfileTransition] = useTransition();

  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordPending, startPasswordTransition] = useTransition();

  // Account deletion state
  const [deletePending, startDeleteTransition] = useTransition();

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Sync theme local state on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    setTheme(savedTheme || 'light');
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast('success', `${newTheme === 'dark' ? 'Dark' : 'Light'} Mode applied`);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      showToast('error', 'Name must be at least 2 characters.');
      return;
    }

    startProfileTransition(async () => {
      const formData = new FormData();
      formData.append('name', name);
      const res = await updateProfileAction(formData);
      
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast('error', 'All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('error', 'New passwords do not match.');
      return;
    }

    startPasswordTransition(async () => {
      const formData = new FormData();
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
      formData.append('confirmNewPassword', confirmNewPassword);
      
      const res = await changePasswordAction(formData);
      if (res.success) {
        showToast('success', res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        showToast('error', res.message);
      }
    });
  };

  const handleDeleteAccount = () => {
    const doubleCheck = confirm(
      "WARNING: This action is permanent! All your profile data, analysis history, and exported audio and report files on disk will be deleted forever. Do you wish to continue?"
    );
    if (!doubleCheck) return;

    const finalCheck = prompt("Type 'DELETE MY ACCOUNT' to confirm account deletion:");
    if (finalCheck !== 'DELETE MY ACCOUNT') {
      showToast('error', 'Confirmation string mismatched. Deletion cancelled.');
      return;
    }

    startDeleteTransition(async () => {
      const res = await deleteAccountAction();
      // If fails, show toast. If succeeds, Next.js redirect to login is thrown from action
      if (res && !res.success) {
        showToast('error', res.message);
      }
    });
  };

  return (
    <DashboardLayout user={user}>
      {/* Toast popup */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 right-4 z-50 px-4.5 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toast.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Platform Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Manage your personal profile details, account security, and themes.
          </p>
        </div>

        {/* 1. Theme Configuration Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Interface Theme</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Customize your layout aesthetics.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {/* Light Option */}
            <button 
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                theme === 'light' 
                  ? 'border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400' 
                  : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Sun className="w-4.5 h-4.5" />
              <span>Light Mode</span>
            </button>

            {/* Dark Option */}
            <button 
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'border-blue-500 bg-blue-950/20 text-blue-600 dark:text-blue-400' 
                  : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Moon className="w-4.5 h-4.5" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 2. User Profile Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4.5 h-4.5 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Profile Details</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address (Locked)</label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-400 select-none cursor-not-allowed"
                />
              </div>

              <button 
                type="submit" 
                disabled={profilePending}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                {profilePending ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Update Profile</span>}
              </button>
            </form>
          </div>

          {/* 3. Password Security Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4.5 h-4.5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Security & Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-700 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-700 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-700 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={passwordPending}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                {passwordPending ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Change Password</span>}
              </button>
            </form>
          </div>
        </div>

        {/* 4. Danger Zone */}
        <div className="bg-red-500/5 dark:bg-red-950/10 p-6 rounded-3xl border border-red-500/20 dark:border-red-900/30 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Delete Account Permanently</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 leading-relaxed">
                This action is immediate and irrevocable. Your profile details, password hashes, analysis task histories, Matplotlib timelines, ReportLab PDFs, Word DOCXs, and segmented WAV files will be scrubbed from the filesystem database.
              </p>
            </div>
            
            <button 
              onClick={handleDeleteAccount}
              disabled={deletePending}
              className="py-2.5 px-4.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 shrink-0 cursor-pointer"
            >
              {deletePending ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete My Account</span>
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
