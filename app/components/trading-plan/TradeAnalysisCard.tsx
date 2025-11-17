'use client';

import { useState } from 'react';
import { Flag, Trash2, Edit, Archive, TrendingUp, TrendingDown } from 'lucide-react';
import { TradeAnalysis } from '@/app/lib/types/tradeAnalysis';
import { updateTradeAnalysis } from '@/app/services/tradeAnalysisServiceClient';

interface TradeAnalysisCardProps {
  analysis: TradeAnalysis;
  onEdit: (analysis: TradeAnalysis) => void;
  onDelete: (analysisId: number) => void;
  onUpdate: () => void;
}

export function TradeAnalysisCard({ analysis, onEdit, onDelete, onUpdate }: TradeAnalysisCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFlag = async () => {
    setIsUpdating(true);
    try {
      await updateTradeAnalysis(analysis.analysis_id, {
        is_flagged: analysis.is_flagged === 1 ? 0 : 1,
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleArchive = async () => {
    setIsUpdating(true);
    try {
      await updateTradeAnalysis(analysis.analysis_id, {
        status: analysis.status === 'ARCHIVED' ? 'ANALYZING' : 'ARCHIVED',
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Determine R:R color
  const getRRColor = () => {
    const ratio = analysis.risk_reward_ratio || 0;
    if (ratio >= 2) return 'text-green-400';
    if (ratio >= 1) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const getRRBgColor = () => {
    const ratio = analysis.risk_reward_ratio || 0;
    if (ratio >= 2) return 'from-green-500/10 to-emerald-500/10 border-green-400/30';
    if (ratio >= 1) return 'from-yellow-500/10 to-orange-500/10 border-yellow-400/30';
    return 'from-rose-500/10 to-red-500/10 border-rose-400/30';
  };

  return (
    <div className={`backdrop-blur-xl bg-gradient-to-br ${getRRBgColor()} rounded-3xl p-6 border transition-all ${
      analysis.is_flagged === 1 ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-500/20' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">{analysis.ticker}</h3>
          {analysis.status === 'ARCHIVED' && (
            <span className="text-xs px-2 py-1 bg-slate-500/20 text-slate-300 rounded-full">
              Archived
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFlag}
            disabled={isUpdating}
            className={`p-2 rounded-full transition-all ${
              analysis.is_flagged === 1
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white/10 text-blue-300 hover:bg-white/20'
            }`}
            title={analysis.is_flagged === 1 ? 'Unflag' : 'Flag for trading'}
          >
            <Flag className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(analysis)}
            className="p-2 rounded-full bg-white/10 text-blue-300 hover:bg-white/20 transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={toggleArchive}
            disabled={isUpdating}
            className="p-2 rounded-full bg-white/10 text-blue-300 hover:bg-white/20 transition-all"
            title={analysis.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(analysis.analysis_id)}
            className="p-2 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Input Values */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Entry Price</p>
            <p className="text-white text-lg font-bold">${analysis.entry_price.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Position Size</p>
            <p className="text-white text-lg font-bold">${analysis.position_size.toFixed(0)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-rose-200 text-xs mb-1">Stop Loss</p>
            <p className="text-white text-lg font-bold">${analysis.stop_loss.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-green-200 text-xs mb-1">Take Profit</p>
            <p className="text-white text-lg font-bold">${analysis.take_profit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Calculated Metrics */}
      <div className="border-t border-white/20 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-blue-200 text-sm">Shares to Buy</span>
          <span className="text-white font-semibold">{analysis.shares_to_buy?.toFixed(2) || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-rose-200 text-sm flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            Risk %
          </span>
          <span className="text-rose-400 font-bold text-lg">
            {analysis.risk_percentage?.toFixed(2) || 0}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-green-200 text-sm flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Reward %
          </span>
          <span className="text-green-400 font-bold text-lg">
            {analysis.reward_percentage?.toFixed(2) || 0}%
          </span>
        </div>

        <div className="bg-white/10 rounded-xl p-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Risk:Reward Ratio</span>
            <span className={`font-bold text-2xl ${getRRColor()}`}>
              1:{analysis.risk_reward_ratio?.toFixed(2) || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {analysis.notes && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-blue-200 text-xs mb-1">Notes</p>
          <p className="text-white text-sm">{analysis.notes}</p>
        </div>
      )}
    </div>
  );
}