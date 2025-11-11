import { getOpenPositionsForDividends } from '../../services/dividendService';
import { DividendsClientWrapper } from '../../components/dividends/DividendsClientWrapper';
import { auth } from '../../lib/auth';

export default async function DividendsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
          <p className="text-rose-200">Please log in to view dividends</p>
        </div>
      </div>
    );
  }

  const positions = await getOpenPositionsForDividends(session.user.id);

  return <DividendsClientWrapper positions={positions} />;
}