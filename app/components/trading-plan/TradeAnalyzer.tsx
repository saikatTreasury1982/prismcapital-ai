'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { TradeAnalysis } from '@/app/lib/types/tradeAnalysis';
import { getTradeAnalyses, deleteTradeAnalysis } from '@/app/services/tradeAnalysisServiceClient';
import { TradeAnalysisCard } from './TradeAnalysisCard';
import { TradeAnalysisForm } from './TradeAnalysisForm';

export function TradeAnalyzer() {
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<TradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<TradeAnalysis | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'flagged' | 'archived'>('all');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [analyses, filterStatus]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const data = await getTradeAnalyses();
      setAnalyses(data);
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = analyses;

    if (filterStatus === 'flagged') {
      filtered = filtered.filter(a => a.is_flagged === 1);
    } else if (filterStatus === 'archived') {
      filtered = filtered.filter(a => a.status === 'ARCHIVED');
    } else {
      // 'all' - exclude archived
      filtered = filtered.filter(a => a.status !== 'ARCHIVED');
    }

    setFilteredAnalyses(filtered);
  };

  const handleDelete = async (analysisId: number) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      await deleteTradeAnalysis(analysisId);
      await fetchAnalyses();
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const handleEdit = (analysis: TradeAnalysis) => {
    setEditingAnalysis(analysis);
    setShowForm(true);
  };

  const handleSuccess = async () => {
    setShowForm(false);
    setEditingAnalysis(null);
    await fetchAnalyses();
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading analyses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setEditingAnalysis(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Analysis
        </button>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-300" />
          <div className="backdrop-blur-xl bg-white/5 rounded-xl p-1 border border-white/10 inline-flex gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-200 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('flagged')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'flagged'
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-200 hover:bg-white/10'
              }`}
            >
              Flagged
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'archived'
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-200 hover:bg-white/10'
              }`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <TradeAnalysisForm
              editingAnalysis={editingAnalysis}
              onSuccess={handleSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingAnalysis(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Analysis Cards Grid */}
      {filteredAnalyses.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 border border-white/20 text-center">
          <p className="text-blue-200 text-lg mb-2">No trade analyses yet</p>
          <p className="text-blue-300 text-sm">Click "Add Analysis" to start analyzing trade opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAnalyses.map((analysis) => (
            <TradeAnalysisCard
              key={analysis.analysis_id}
              analysis={analysis}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdate={fetchAnalyses}
            />
          ))}
        </div>
      )}
    </div>
  );
}