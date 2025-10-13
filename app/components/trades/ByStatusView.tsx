'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TradeLot } from '../../lib/types/transaction';
import { getTradeLots } from '../../services/tradeLotServiceClient';
import { CURRENT_USER_ID } from '../../lib/auth';

export function ByStatusView() {
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'closed'>('open');
  const [openLots, setOpenLots] = useState<TradeLot[]>([]);
  const [closedLots, setClosedLots] = useState<TradeLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const fetchLots = async () => {
      setLoading(true);
      try {
        if (activeSubTab === 'open') {
          const data = await getTradeLots(CURRENT_USER_ID, undefined, 'OPEN');
          setOpenLots(data);
        } else {
          const data = await getTradeLots(CURRENT_USER_ID, undefined, 'CLOSED');
          setClosedLots(data);
        }
      } catch (err) {
        console.error('Failed to fetch trade lots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, [activeSubTab]);

  const getStrategyName = (strategyId: number | null) => {
    if (strategyId === 1) return 'Day Trade';
    if (strategyId === 2) return 'Swing Trade';
    if (strategyId === 3) return 'Position Trade';
    return '-';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'OPEN': 'bg-green-500/20 text-green-300 border-green-400/30',
      'PARTIAL': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'CLOSED': 'bg-slate-500/20 text-slate-300 border-slate-400/30'
    };
    return colors[status as keyof typeof colors] || colors.CLOSED;
  };

  const currentLots = activeSubTab === 'open' ? openLots : closedLots;
  const totalPages = Math.ceil(currentLots.length / pageSize);
  const paginatedLots = currentLots.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate totals for open lots
  const openTotals = openLots.reduce((acc, lot) => {
    acc.totalShares += lot.quantity;
    acc.totalValue += lot.quantity * lot.entry_price;
    return acc;
  }, { totalShares: 0, totalValue: 0 });

  // Calculate totals for closed lots
  const closedTotals = closedLots.reduce((acc, lot) => {
    acc.totalPL += lot.realized_pl || 0;
    acc.totalTrades += 1;
    if ((lot.realized_pl || 0) > 0) acc.winningTrades += 1;
    return acc;
  }, { totalPL: 0, totalTrades: 0, winningTrades: 0 });

  const winRate = closedTotals.totalTrades > 0 
    ? (closedTotals.winningTrades / closedTotals.totalTrades * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading trade lots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('open');
            setCurrentPage(1);
          }}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
            activeSubTab === 'open' 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Open Trades</span>
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
            {openLots.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('closed');
            setCurrentPage(1);
          }}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
            activeSubTab === 'closed' 
              ? 'bg-slate-600 text-white shadow-lg' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
        >
          <TrendingDown className="w-5 h-5" />
          <span>Closed Trades</span>
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
            {closedLots.length}
          </span>
        </button>
      </div>

      {/* Summary Cards */}
      {activeSubTab === 'open' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-400/20">
            <p className="text-green-300 text-sm mb-1">Total Open Shares</p>
            <p className="text-white text-3xl font-bold">{openTotals.totalShares.toLocaleString()}</p>
          </div>
          <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
            <p className="text-blue-300 text-sm mb-1">Total Open Value</p>
            <p className="text-white text-3xl font-bold">${openTotals.totalValue.toFixed(2)}</p>
          </div>
        </div>
      )}

      {activeSubTab === 'closed' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-6 border ${
            closedTotals.totalPL >= 0 
              ? 'from-green-500/10 to-emerald-500/10 border-green-400/20'
              : 'from-rose-500/10 to-red-500/10 border-rose-400/20'
          }`}>
            <p className={`text-sm mb-1 ${closedTotals.totalPL >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
              Total Realized P/L
            </p>
            <p className="text-white text-3xl font-bold flex items-center gap-2">
              {closedTotals.totalPL >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              ${closedTotals.totalPL.toFixed(2)}
            </p>
          </div>
          <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
            <p className="text-blue-300 text-sm mb-1">Win Rate</p>
            <p className="text-white text-3xl font-bold">
              {winRate}%
              <span className="text-sm text-blue-300 ml-2">
                ({closedTotals.winningTrades}/{closedTotals.totalTrades})
              </span>
            </p>
          </div>
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
            <p className="text-purple-300 text-sm mb-1">Total Closed Trades</p>
            <p className="text-white text-3xl font-bold">{closedTotals.totalTrades}</p>
          </div>
        </div>
      )}

      {/* Trade Lots Table */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden">
        {paginatedLots.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-blue-200">
              No {activeSubTab} trade lots found.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-blue-300 p-4">Ticker</th>
                    <th className="text-left text-blue-300 p-4">Entry Date</th>
                    {activeSubTab === 'closed' && (
                      <th className="text-left text-blue-300 p-4">Exit Date</th>
                    )}
                    <th className="text-right text-blue-300 p-4">Qty</th>
                    <th className="text-right text-blue-300 p-4">Entry Price</th>
                    {activeSubTab === 'closed' && (
                      <>
                        <th className="text-right text-blue-300 p-4">Exit Price</th>
                        <th className="text-right text-blue-300 p-4">P/L</th>
                        <th className="text-right text-blue-300 p-4">P/L %</th>
                        <th className="text-center text-blue-300 p-4">Hold Days</th>
                        <th className="text-center text-blue-300 p-4">Strategy</th>
                      </>
                    )}
                    <th className="text-center text-blue-300 p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLots.map((lot) => (
                    <tr key={lot.lot_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-semibold">{lot.ticker}</td>
                      <td className="p-4 text-white">
                        {new Date(lot.entry_date).toLocaleDateString()}
                      </td>
                      {activeSubTab === 'closed' && (
                        <td className="p-4 text-white">
                          {lot.exit_date ? new Date(lot.exit_date).toLocaleDateString() : '-'}
                        </td>
                      )}
                      <td className="p-4 text-right text-white">{lot.quantity}</td>
                      <td className="p-4 text-right text-white">${lot.entry_price.toFixed(2)}</td>
                      {activeSubTab === 'closed' && (
                        <>
                          <td className="p-4 text-right text-white">
                            {lot.exit_price ? `$${lot.exit_price.toFixed(2)}` : '-'}
                          </td>
                          <td className={`p-4 text-right font-bold ${
                            (lot.realized_pl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                          }`}>
                            {lot.realized_pl ? `$${lot.realized_pl.toFixed(2)}` : '-'}
                          </td>
                          <td className={`p-4 text-right font-bold ${
                            (lot.realized_pl_percent || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                          }`}>
                            {lot.realized_pl_percent ? `${lot.realized_pl_percent.toFixed(2)}%` : '-'}
                          </td>
                          <td className="p-4 text-center text-white">
                            {lot.trade_hold_days || '-'}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {getStrategyName(lot.trade_strategy)}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 border rounded text-xs ${getStatusBadge(lot.lot_status)}`}>
                          {lot.lot_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-blue-200 text-sm">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, currentLots.length)} of {currentLots.length} lots
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}