import { Clock } from 'lucide-react';
import { CashMovementWithDirection } from '../../lib/types/funding';

interface RecentTransactionsProps {
  movements: CashMovementWithDirection[];
  homeCurrency: string;
  onTransactionClick?: (transaction: CashMovementWithDirection) => void;
  editingTransactionId?: number | null;
}

export function RecentTransactions({ movements, homeCurrency, onTransactionClick, editingTransactionId }: RecentTransactionsProps) {
  if (movements.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recent Transactions
      </h2>
      <p className="text-xs text-blue-300 mt-1 mb-3">
        Showing {Math.min(5, movements.length)} most recent transactions
      </p>

      <div>
        {movements.map((txn, idx) => {
          const isEditing = editingTransactionId === txn.cash_movement_id;
          const isEarmarked = txn.spot_rate_isActual === 0;
          const isIn = txn.direction.direction_code === 'IN';

          return (
            <div
              key={txn.cash_movement_id}
              onClick={() => onTransactionClick?.(txn)}
              className={`flex items-center justify-between py-2.5 px-2 border-t border-white/10 cursor-pointer transition-all ${
                idx === movements.length - 1 ? 'border-b' : ''
              } ${isEditing ? 'bg-blue-500/20' : 'hover:bg-white/5'}`}
            >
              {/* Left: IN/OUT tag + date + period */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    isIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {isIn ? 'IN' : 'OUT'}
                </span>
                <div className="min-w-0">
                  <div className="text-white font-medium text-sm">
                    {new Date(txn.transaction_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-blue-300 text-[11px]">
                    {txn.period_from
                      ? new Date(txn.period_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'No period'}
                    {' – '}
                    {txn.period_to
                      ? new Date(txn.period_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'No period'}
                  </div>
                </div>
              </div>

              {/* Right: signed amount + trading equivalent */}
              <div className="text-right">
                <div
                  className={`font-semibold text-sm flex items-center justify-end gap-1.5 ${
                    isIn ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {isEarmarked && (
                    <div className="relative group">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          Earmarked Rate
                        </div>
                      </div>
                    </div>
                  )}
                  <span>
                    {isIn ? '+' : '\u2212'}{homeCurrency} {Math.abs(txn.home_currency_value).toFixed(2)}
                  </span>
                </div>
                <div className="text-blue-300 text-[11px]">
                  {txn.trading_currency_code} {Math.abs(txn.trading_currency_value).toFixed(4)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}