import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
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
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6" />
          Recent Transactions
        </h2>
        <p className="text-xs text-blue-300 mt-1">Showing {Math.min(5, movements.length)} most recent transactions</p>
      </div>
      <div className="space-y-2">
        {movements.map(txn => {
          const isEditing = editingTransactionId === txn.cash_movement_id;
          const isEarmarked = txn.spot_rate_isActual === 0;
          
          return (
            <div 
              key={txn.cash_movement_id} 
              onClick={() => onTransactionClick?.(txn)}
              className={`
                rounded-xl p-4 border flex justify-between items-center transition-all
                ${isEditing 
                  ? 'bg-blue-500/20 border-blue-400/50 ring-2 ring-blue-400/30' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  txn.direction.direction_code === 'IN' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}>
                  {txn.direction.direction_code === 'IN' ? 
                    <TrendingUp className="w-5 h-5 text-emerald-300" /> : 
                    <TrendingDown className="w-5 h-5 text-rose-300" />
                  }
                </div>
                <div>
                  <div className="text-white font-medium">
                    {new Date(txn.transaction_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-blue-200 text-sm">
                    {txn.period_from ? new Date(txn.period_from).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'No period'}
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className={`text-lg font-bold flex items-center gap-2 ${
                    txn.direction.direction_code === 'IN' ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    <span>
                      {txn.direction.direction_code === 'IN' ? '+' : '-'}
                      {homeCurrency} {Math.abs(txn.home_currency_value).toFixed(2)}
                    </span>
                    {isEarmarked && (
                      <div className="relative group">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            Earmarked Rate
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-blue-200 text-sm">
                    {txn.trading_currency_code} {Math.abs(txn.trading_currency_value).toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}