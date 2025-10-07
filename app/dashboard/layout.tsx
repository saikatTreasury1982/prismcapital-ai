import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { SignOutButton } from '../components/ui/SignOutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
              <span className="text-2xl font-bold text-gray-900">Prism Capital</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/transactions" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Transactions
              </Link>
              <Link href="/dashboard/positions" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Positions
              </Link>
              <Link href="/dashboard/lots" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Trade Lots
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">{user.email}</div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}