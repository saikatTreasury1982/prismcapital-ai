import { TradesClientWrapper } from '../../components/trades/TradesClientWrapper';
import { auth } from '../../lib/auth';
import { redirect } from 'next/navigation';

export default async function TradesPage() {
  // Check authentication
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/');
  }

  // Just render the wrapper - it will fetch data via API calls
  return <TradesClientWrapper />;
}