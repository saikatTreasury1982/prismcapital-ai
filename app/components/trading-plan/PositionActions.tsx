'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/app/lib/types/transaction';
import { getPositions } from '@/app/services/positionServiceClient';
import { ActionPlanner } from './ActionPlanner';

export function PositionActions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await getPositions(true); // Only active positions
      setPositions(data);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading positions...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Positions List (30%) */}
      <div className="lg:col-span-1">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Your Positions</h2>
          
          {positions.length === 0 ? (
            <p className="text-blue-200 text-sm text-center py-8">No active positions found</p>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <button
                  key={position.position_id}
                  onClick={() => setSelectedPosition(position)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedPosition?.position_id === position.position_id
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold text-lg">{position.ticker}</h3>
                    <span className="text-blue-200 text-xs">{position.position_currency}</span>
                  </div>
                  {position.ticker_name && (
                    <p className="text-blue-300 text-xs mb-2">{position.ticker_name}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-blue-300">Shares</p>
                      <p className="text-white font-semibold">{position.total_shares.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-blue-300">Avg Cost</p>
                      <p className="text-white font-semibold">${position.average_cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-blue-300">Current Price</p>
                      <p className="text-white font-semibold">
                        ${position.current_market_price?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-300">Value</p>
                      <p className="text-white font-semibold">
                        ${position.current_value?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-xs text-blue-300">Unrealized P/L</p>
                    <p className={`font-bold ${
                      (position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                    }`}>
                      ${position.unrealized_pnl?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Action Planner (70%) */}
      <div className="lg:col-span-2">
        {selectedPosition ? (
          <ActionPlanner position={selectedPosition} onSuccess={fetchPositions} />
        ) : (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 border border-white/20 text-center">
            <p className="text-blue-200 text-lg mb-2">Select a Position</p>
            <p className="text-blue-300 text-sm">Choose a position from the left to plan your actions</p>
          </div>
        )}
      </div>
    </div>
  );
}