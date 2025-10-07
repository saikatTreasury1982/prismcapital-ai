import { Edit3, BarChart3, ArrowLeftRight } from 'lucide-react';
import { getUserCurrencies, getCashMovements, getPeriodStats } from '../../services/cashMovementService';
import { CURRENT_USER_ID } from '../../lib/auth';
import { FundingClientWrapper } from '../../components/funding/FundingClientWrapper';

export default async function FundingPage() {
  // Fetch all data server-side
  const currencies = await getUserCurrencies(CURRENT_USER_ID);
  const movements = await getCashMovements(CURRENT_USER_ID);
  const periodStats = await getPeriodStats(CURRENT_USER_ID);

  return (
    <FundingClientWrapper 
      currencies={currencies}
      movements={movements}
      periodStats={periodStats}
    />
  );
}