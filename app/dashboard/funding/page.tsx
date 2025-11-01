import { FundingClientWrapper } from '../../components/funding/FundingClientWrapper';
import { auth } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { getUserCurrencies, getCashMovements, getPeriodStats } from '../../services/cashMovementService';

export default async function FundingPage() {
  // Get authenticated user from session
  const session = await auth();
  
  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect('/');
  }

  try {
    // ✅ Call services DIRECTLY - no fetch needed!
    const userId = session.user.id;
    
    const [currencies, movements, periodStats] = await Promise.all([
      getUserCurrencies(userId),
      getCashMovements(userId),
      getPeriodStats(userId)
    ]);

    return (
      <FundingClientWrapper 
        currencies={currencies}
        movements={movements}
        periodStats={periodStats}
      />
    );
  } catch (error: any) {
    console.error('Error loading funding data:', error);
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Setup Required</h2>
          <div className="text-blue-200 space-y-4">
            <p>Before using the Funding page, you need to:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Ensure your user exists in the database</li>
              <li>Set up user preferences with default currencies</li>
              <li>Verify the database connection is working</li>
            </ol>
            <div className="mt-4 p-4 bg-rose-500/20 border border-rose-400/30 rounded-lg">
              <p className="text-rose-200 text-sm font-mono">{error.message}</p>
              <p className="text-rose-200 text-xs mt-2">User ID: {session.user.id}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}