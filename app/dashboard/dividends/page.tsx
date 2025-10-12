import { getOpenPositionsForDividends } from '../../services/dividendService';
import { DividendsClientWrapper } from '../../components/dividends/DividendsClientWrapper';
import { CURRENT_USER_ID } from '../../lib/auth';

export default async function DividendsPage() {
  const positions = await getOpenPositionsForDividends(CURRENT_USER_ID);

  return <DividendsClientWrapper positions={positions} />;
}