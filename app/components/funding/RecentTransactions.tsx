import { TrendingUp, TrendingDown } from 'lucide-react';
import { CashMovementWithDirection } from '../../lib/types/funding';

interface RecentTransactionsProps {
  movements: CashMovementWithDirection[];
  homeCurrency: string;
}

export function RecentTransactions({ movements, homeCurrency }: RecentTransactionsProps) {
  if (movements.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
      <h3 className="text-white font-semibold mb-4">Recent Transactions</h3>
      <div className="space-y-2">
        {movements.map(txn => (
          <div key={txn.cash_movement_id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-center">
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
            <div className="text-right">
              <div className={`text-lg font-bold ${
                txn.direction.direction_code === 'IN' ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {txn.direction.direction_code === 'IN' ? '+' : '-'}
                {homeCurrency} {Math.abs(txn.home_currency_value).toFixed(2)}
              </div>
              <div className="text-blue-200 text-sm">
                {txn.trading_currency_code} {Math.abs(txn.trading_currency_value).toFixed(4)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}