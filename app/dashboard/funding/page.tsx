import { Edit3, BarChart3, ArrowLeftRight } from 'lucide-react';
import { getUserCurrencies, getCashMovements, getPeriodStats } from '../../services/cashMovementService';
import { CURRENT_USER_ID } from '../../lib/auth';
import { FundingClientWrapper } from '../../components/funding/FundingClientWrapper';

export default async function FundingPage() {
  try {
    // Fetch all data server-side
    const currencies = await getUserCurrencies(CURRENT_USER_ID);
    const movements = await getCashMovements(CURRENT_USER_ID);
    const periodStats = await getPeriodStats(CURRENT_USER_ID);

    // Serialize the data to ensure no hydration issues
    const serializedData = {
      currencies: JSON.parse(JSON.stringify(currencies)),
      movements: JSON.parse(JSON.stringify(movements)),
      periodStats: JSON.parse(JSON.stringify(periodStats))
    };

    return (
      <FundingClientWrapper 
        currencies={serializedData.currencies}
        movements={serializedData.movements}
        periodStats={serializedData.periodStats}
      />
    );
  } catch (error: any) {
    return (
      <div className="min-h-screen funding-gradient-bg p-6 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Setup Required</h2>
          <div className="text-blue-200 space-y-4">
            <p>Before using the Funding page, you need to:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Ensure your user exists in the database</li>
              <li>Set up user preferences with default currencies</li>
              <li>Verify your user_id: <code className="bg-white/10 px-2 py-1 rounded">{CURRENT_USER_ID}</code></li>
            </ol>
            <div className="mt-4 p-4 bg-rose-500/20 border border-rose-400/30 rounded-lg">
              <p className="text-rose-200 text-sm font-mono">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}