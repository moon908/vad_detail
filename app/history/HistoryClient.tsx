'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Trash2, 
  Download, 
  Calendar, 
  Clock, 
  FileText, 
  FileArchive,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Loader2,
  Bell,
  AudioLines,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Analysis } from '@/lib/db';
import { deleteAnalysisAction } from '../actions/analysis';

interface HistoryClientProps {
  user: {
    name: string;
    email: string;
  };
  initialAnalyses: Analysis[];
}

export default function HistoryClient({ user, initialAnalyses }: HistoryClientProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>(initialAnalyses);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<'createdAt' | 'duration' | 'speechPercentage'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // React 19 transition hook for deletions
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleSort = (field: 'createdAt' | 'duration' | 'speechPercentage') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  const handleDelete = (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete the analysis for "${filename}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAnalysisAction(id);
      if (result.success) {
        setAnalyses(prev => prev.filter(a => a.id !== id));
        showToast('success', `Deleted analysis for "${filename}"`);
      } else {
        showToast('error', result.message || 'Failed to delete analysis');
      }
    });
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Filter and sort analyses
  const filteredAnalyses = analyses.filter(a => 
    a.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAnalyses = [...filteredAnalyses].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'createdAt') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedAnalyses.length / itemsPerPage);
  const paginatedAnalyses = sortedAnalyses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout user={user}>
      {/* Toast Alert */}
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
            <Bell className="w-4 h-4" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Analysis History</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Manage and download your completed Voice Activity Detection tasks.
            </p>
          </div>
        </div>

        {/* Filters and search card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>

          <div className="text-xs text-slate-400 font-semibold self-end sm:self-center">
            Showing {filteredAnalyses.length} of {analyses.length} recordings
          </div>
        </div>

        {/* History table */}
        {filteredAnalyses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <AudioLines className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-200">No records found</h3>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
              {searchTerm 
                ? "No matching filenames found. Try checking the spelling or adjusting your keywords." 
                : "You haven't run any analysis tasks yet. Head over to the Upload page to process your first audio."}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link href="/upload">
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Audio</span>
                  </span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-850 text-slate-400 uppercase text-[9px] font-bold tracking-wider select-none">
                    <th className="py-3.5 px-6">Filename</th>
                    
                    <th 
                      className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    
                    <th 
                      className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors"
                      onClick={() => handleSort('duration')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Duration</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th 
                      className="py-3.5 px-6 cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors"
                      onClick={() => handleSort('speechPercentage')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Speech share</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th className="py-3.5 px-6">Downloads</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                  <AnimatePresence initial={false}>
                    {paginatedAnalyses.map((a) => (
                      <motion.tr 
                        key={a.id}
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all"
                      >
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={a.filename}>
                          {a.filename}
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDuration(a.duration)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{a.speechPercentage.toFixed(0)}%</span>
                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${a.speechPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {/* PDF icon link */}
                            <a 
                              href={a.reportUrls.pdf} 
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                            {/* CSV icon link */}
                            <a 
                              href={a.reportUrls.csv} 
                              className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Download CSV"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </a>
                            {/* ZIP icon link */}
                            <a 
                              href={a.reportUrls.zip} 
                              className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Download ZIP Archive"
                            >
                              <FileArchive className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/analysis/${a.id}`}>
                              <span className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all inline-flex items-center justify-center cursor-pointer" title="Open Dashboard">
                                <ExternalLink className="w-4 h-4" />
                              </span>
                            </Link>
                            <button 
                              onClick={() => handleDelete(a.id, a.filename)}
                              disabled={isPending}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all inline-flex items-center justify-center cursor-pointer" 
                              title="Delete task"
                            >
                              {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 py-1.5 px-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <span>Page {currentPage} of {totalPages}</span>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 py-1.5 px-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
