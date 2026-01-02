'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Sliders, Edit2, List, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Position, Transaction } from '../../lib/types/transaction';
import { getPositions } from '../../services/positionServiceClient';
import { getTransactions } from '../../services/transactionServiceClient';
import { AssignAttributesModal } from './AssignAttributesModal';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import BulletDisplay from '@/app/lib/ui/BulletDisplay';

interface RealizedTrade {
  realization_id: number;
  ticker: string;
  sale_date: string;
  quantity: number;
  average_cost: number;
  total_cost: number;
  sale_price: number;
  total_proceeds: number;
  realized_pnl: number;
  entry_date: string;
  position_currency: string;
  fees: number;
  notes: string | null;
}

export function ByOpenTradesView() {
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [tickerTransactions, setTickerTransactions] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPositionForAttributes, setSelectedPositionForAttributes] = useState<Position | null>(null);
  const [transactionPages, setTransactionPages] = useState<Record<string, number>>({});
  const transactionPageSize = 5;
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('all');
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    transaction_date: '',
    quantity: '',
    price: '',
    fees: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getPositions(true); // Only active positions
        setPositions(data);
        setFilteredPositions(data);
      } catch (err) {
        console.error('Failed to fetch positions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setExpandedTicker(null);
  }, []);

  // Apply ticker filter
  useEffect(() => {
    let filtered = [...positions];

    if (selectedTicker !== 'all') {
      filtered = filtered.filter(p => p.ticker === selectedTicker);
    }

    setFilteredPositions(filtered);
  }, [selectedTicker, positions]);

  const handleToggleExpand = async (ticker: string) => {
    if (expandedTicker === ticker) {
      setExpandedTicker(null);
      return;
    }

    setExpandedTicker(ticker);

    // Reset transaction pagination for this ticker
    setTransactionPages(prev => ({ ...prev, [ticker]: 1 }));

    if (!tickerTransactions[ticker]) {
      try {
        const allTransactions = await getTransactions(ticker);
        
        // Find the position's opened_date
        const position = positions.find(p => p.ticker === ticker);
        
        // Filter transactions to only include those on or after opened_date
        const filteredTransactions = position && position.opened_date
        ? allTransactions.filter(t => t.transaction_date >= position.opened_date!)
        : allTransactions;
        
        setTickerTransactions(prev => ({ ...prev, [ticker]: filteredTransactions }));
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      transaction_date: transaction.transaction_date,
      quantity: transaction.quantity.toString(),
      price: transaction.price.toString(),
      fees: transaction.fees.toString(),
      notes: transaction.notes || ''
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    // Validation
    if (!editFormData.transaction_date || !editFormData.quantity || !editFormData.price) {
      setEditError('Please fill in all required fields');
      return;
    }

    const quantity = parseFloat(editFormData.quantity);
    const price = parseFloat(editFormData.price);
    const fees = parseFloat(editFormData.fees);

    if (isNaN(quantity) || isNaN(price) || isNaN(fees)) {
      setEditError('Please enter valid numbers');
      return;
    }

    if (quantity <= 0 || price <= 0 || fees < 0) {
      setEditError('Invalid values entered');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.transaction_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_date: editFormData.transaction_date,
          quantity: quantity,
          price: price,
          fees: fees,
          notes: editFormData.notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      // Refresh transactions for the expanded ticker
      if (expandedTicker) {
        const allTransactions = await getTransactions(expandedTicker);
        const position = positions.find(p => p.ticker === expandedTicker);
        const filteredTransactions = position && position.opened_date
          ? allTransactions.filter(t => t.transaction_date >= position.opened_date!)
          : allTransactions;
        
        setTickerTransactions(prev => ({ ...prev, [expandedTicker]: filteredTransactions }));
      }

      // Refresh positions data
      const data = await getPositions(true);
      setPositions(data);
      setFilteredPositions(selectedTicker === 'all' ? data : data.filter(p => p.ticker === selectedTicker));

      setEditingTransaction(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditError(null);
  };

  // Calculate trade value for edit form
  const editTradeValue = editFormData.quantity && editFormData.price
    ? (parseFloat(editFormData.quantity) * parseFloat(editFormData.price)).toFixed(2)
    : '0.00';

  // Calculate totals for open positions (STOCKS ONLY)
  const openTotals = filteredPositions.reduce((acc, pos) => {
    const investedCapital = pos.total_shares * pos.average_cost;
    acc.totalInvestment += investedCapital;
    acc.totalValue += pos.current_value || 0;
    acc.unrealizedPL += pos.unrealized_pnl || 0;
    return acc;
  }, { totalInvestment: 0, totalValue: 0, unrealizedPL: 0 });

  // Calculate growth percentage
  const growthPercentage = openTotals.totalInvestment > 0 
    ? ((openTotals.unrealizedPL / openTotals.totalInvestment) * 100) 
    : 0;

  // Calculate annualized growth
  // Find the earliest opened_date from filtered positions
  const earliestDate = filteredPositions.reduce((earliest, pos) => {
    if (!pos.opened_date) return earliest;
    const posDate = new Date(pos.opened_date);
    return !earliest || posDate < earliest ? posDate : earliest;
  }, null as Date | null);

  let annualizedGrowth = 0;
  if (earliestDate && openTotals.totalInvestment > 0) {
    const now = new Date();
    const yearsHeld = (now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (yearsHeld > 0) {
      // Annualized return = (Total Return / Years)
      annualizedGrowth = (growthPercentage / yearsHeld);
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <List className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-bold text-white">Filter by Ticker</h3>
        </div>
        <div className="flex gap-3 items-center">
          <label className="text-blue-200 text-sm font-medium whitespace-nowrap">Select Ticker</label>
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="w-48 funding-input rounded-xl px-3 py-2 text-sm"
          >
            <option value="all" className="bg-slate-800 text-white">All Tickers</option>
            {positions.map(position => (
              <option key={position.ticker} value={position.ticker} className="bg-slate-800 text-white">
                {position.ticker}
              </option>
            ))}
          </select>
          
          {selectedTicker !== 'all' && (
            <GlassButton
              icon={X}
              onClick={() => setSelectedTicker('all')}
              tooltip="Clear Filter"
              variant="secondary"
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Investment */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-400/20">
          <p className="text-blue-300 text-sm mb-1">Total Investment</p>
          <p className="text-white text-3xl font-bold">${openTotals.totalInvestment.toFixed(2)}</p>
        </div>

        {/* Total Value */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
          <p className="text-purple-300 text-sm mb-1">Total Value</p>
          <p className="text-white text-3xl font-bold">${openTotals.totalValue.toFixed(2)}</p>
        </div>

        {/* Unrealized P/L */}
        <div className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-6 border ${
          openTotals.unrealizedPL >= 0
            ? 'from-green-500/10 to-emerald-500/10 border-green-400/20'
            : 'from-rose-500/10 to-red-500/10 border-rose-400/20'
        }`}>
          <p className={`text-sm mb-1 ${openTotals.unrealizedPL >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
            Unrealized P/L
          </p>
          <p className="text-white text-3xl font-bold flex items-center gap-2">
            {openTotals.unrealizedPL >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            ${openTotals.unrealizedPL.toFixed(2)}
          </p>
        </div>

        {/* Growth % */}
        <div className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-6 border ${
          growthPercentage >= 0
            ? 'from-emerald-500/10 to-teal-500/10 border-emerald-400/20'
            : 'from-red-500/10 to-orange-500/10 border-red-400/20'
        }`}>
          <p className={`text-sm mb-1 ${growthPercentage >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            Growth
          </p>
          <p className="text-white text-3xl font-bold flex items-center gap-2">
            {growthPercentage >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            {growthPercentage.toFixed(2)}%
          </p>
        </div>

        {/* Annualized Growth */}
        <div className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-6 border ${
          annualizedGrowth >= 0
            ? 'from-cyan-500/10 to-blue-500/10 border-cyan-400/20'
            : 'from-orange-500/10 to-red-500/10 border-orange-400/20'
        }`}>
          <p className={`text-sm mb-1 ${annualizedGrowth >= 0 ? 'text-cyan-300' : 'text-orange-300'}`}>
            Annualized Growth
          </p>
          <p className="text-white text-3xl font-bold flex items-center gap-2">
            {annualizedGrowth >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            {annualizedGrowth.toFixed(2)}%
          </p>
          {earliestDate && (
            <p className="text-blue-200 text-xs mt-1">
              Since {earliestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Position Cards */}
      {filteredPositions.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
          <p className="text-blue-200 text-center">No open positions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPositions.map((position) => (
            <div
              key={position.position_id}
              className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden"
            >
              {/* Position Summary Header */}
              <div
                onClick={() => handleToggleExpand(position.ticker)}
                className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{position.ticker}</h3>
                      {position.ticker_name && (
                        <span className="text-blue-200 text-sm">{position.ticker_name}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPositionForAttributes(position);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Assign Attributes"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
                      <div>
                        <p className="text-blue-300">Shares</p>
                        <p className="text-white font-semibold">{position.total_shares.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">Avg Price</p>
                        <p className="text-white font-semibold">${position.average_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">Invested Capital</p>
                        <p className="text-white font-semibold">
                          ${(position.total_shares * position.average_cost).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-300">Current Market Price</p>
                        <p className="text-white font-semibold">
                          ${position.current_market_price ? position.current_market_price.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-300">Current Value</p>
                        <p className="text-white font-semibold">
                          ${position.current_value ? position.current_value.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-300">Unrealized P/L</p>
                        <p className={`font-semibold flex items-center gap-1 ${
                          (position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                        }`}>
                          {(position.unrealized_pnl || 0) >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          ${position.unrealized_pnl ? position.unrealized_pnl.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-300">Opened</p>
                        <p className="text-white font-semibold">
                          {position.opened_date ? new Date(position.opened_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {expandedTicker === position.ticker ? (
                      <ChevronUp className="w-6 h-6 text-blue-300" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-blue-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content: Transactions */}
              {expandedTicker === position.ticker && (
                <div className="border-t border-white/20 p-6">
                  <h4 className="text-lg font-bold text-white mb-4">Transaction History</h4>
                  {tickerTransactions[position.ticker] && tickerTransactions[position.ticker].length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-transparent border-b border-white/20">
                              <th className="text-left text-slate-200 p-4 font-semibold">Date</th>
                              <th className="text-center text-slate-200 p-4 font-semibold">Type</th>
                              <th className="text-right text-slate-200 p-4 font-semibold">Quantity</th>
                              <th className="text-right text-slate-200 p-4 font-semibold">Price</th>
                              <th className="text-right text-slate-200 p-4 font-semibold">Fees</th>
                              <th className="text-right text-slate-200 p-4 font-semibold">Trade Value</th>
                              <th className="text-left text-slate-200 p-4 font-semibold">Notes</th>
                              <th className="text-center text-slate-200 p-4 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const currentPage = transactionPages[position.ticker] || 1;
                              const startIdx = (currentPage - 1) * transactionPageSize;
                              const endIdx = startIdx + transactionPageSize;
                              const paginatedTransactions = tickerTransactions[position.ticker].slice(startIdx, endIdx);
                              
                              return paginatedTransactions.map((transaction) => (
                                <tr key={transaction.transaction_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-4 text-white">
                                    {new Date(transaction.transaction_date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      transaction.transaction_type_id === 1 
                                        ? 'bg-green-500/20 text-green-300' 
                                        : 'bg-rose-500/20 text-rose-300'
                                    }`}>
                                      {transaction.transaction_type_id === 1 ? 'BUY' : 'SELL'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right text-white">{transaction.quantity}</td>
                                  <td className="p-4 text-right text-white">${transaction.price.toFixed(2)}</td>
                                  <td className="p-4 text-right text-white">${transaction.fees.toFixed(2)}</td>
                                  <td className="p-4 text-right text-white">${(transaction.trade_value || 0).toFixed(2)}</td>
                                  <td className="p-4 text-white text-sm">
                                    {transaction.notes ? <BulletDisplay text={transaction.notes} /> : '-'}
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => handleEditClick(transaction)}
                                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4 text-blue-300" />
                                    </button>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {/* Transaction Pagination */}
                      {tickerTransactions[position.ticker].length > transactionPageSize && (() => {
                        const currentPage = transactionPages[position.ticker] || 1;
                        const totalPages = Math.ceil(tickerTransactions[position.ticker].length / transactionPageSize);
                        
                        return (
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <p className="text-blue-200">
                              Showing {((currentPage - 1) * transactionPageSize) + 1} to {Math.min(currentPage * transactionPageSize, tickerTransactions[position.ticker].length)} of {tickerTransactions[position.ticker].length} transactions
                            </p>
                            <div className="flex gap-2 items-center">
                              <GlassButton
                                icon={ChevronLeft}
                                onClick={() => setTransactionPages(prev => ({ 
                                  ...prev, 
                                  [position.ticker]: Math.max(1, currentPage - 1) 
                                }))}
                                disabled={currentPage === 1}
                                tooltip="Previous Page"
                                variant="primary"
                                size="sm"
                              />
                              <span className="px-3 py-1 text-white text-xs">
                                Page {currentPage} of {totalPages}
                              </span>
                              <GlassButton
                                icon={ChevronRight}
                                onClick={() => setTransactionPages(prev => ({ 
                                  ...prev, 
                                  [position.ticker]: Math.min(totalPages, currentPage + 1) 
                                }))}
                                disabled={currentPage === totalPages}
                                tooltip="Next Page"
                                variant="primary"
                                size="sm"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <p className="text-blue-200 text-sm">No transactions found.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 max-w-2xl w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Transaction - {editingTransaction.ticker}</h2>
                <p className="text-blue-200 text-sm mt-1">
                  {editingTransaction.transaction_type_id === 1 ? 'BUY' : 'SELL'} Transaction
                </p>
              </div>
              <div className="flex items-center gap-2">
                <GlassButton
                  icon={Save}
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  tooltip={isSaving ? 'Saving...' : 'Save Changes'}
                  variant="primary"
                  size="md"
                />
                <GlassButton
                  icon={X}
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  tooltip="Close"
                  variant="secondary"
                  size="md"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {editError && (
                <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                {/* Transaction Date */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Date *</label>
                  <input
                    type="date"
                    value={editFormData.transaction_date}
                    onChange={(e) => setEditFormData({ ...editFormData, transaction_date: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div>
                    <label className="text-blue-200 text-sm mb-2 block font-medium">Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                      className="w-full funding-input rounded-xl px-4 py-3"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-blue-200 text-sm mb-2 block font-medium">Price per Share *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full funding-input rounded-xl px-4 py-3"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Fees */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Fees</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.fees}
                    onChange={(e) => setEditFormData({ ...editFormData, fees: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* Auto-calculated Trade Value */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-blue-200 text-sm mb-2 font-medium">Trade Value (Calculated)</p>
                  <p className="text-white text-xl font-bold">${editTradeValue}</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
                  <BulletTextarea
                    value={editFormData.notes}
                    onChange={(value) => setEditFormData({ ...editFormData, notes: value })}
                    disabled={isSaving}
                    rows={4}
                    placeholder="Optional notes (use • for bullet points)..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Attributes Modal */}
      <AssignAttributesModal
        position={selectedPositionForAttributes}
        onClose={() => setSelectedPositionForAttributes(null)}
        onSuccess={async () => {
          const data = await getPositions(true);
          setPositions(data);
          setFilteredPositions(selectedTicker === 'all' ? data : data.filter(p => p.ticker === selectedTicker));
        }}
      />
    </div>
  );
}