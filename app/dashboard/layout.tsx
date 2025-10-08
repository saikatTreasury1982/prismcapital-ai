import Link from 'next/link';
import { MobileMenu } from '../components/ui/MobileMenu';
import { DashboardNav } from '../components/dashboard/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/funding', label: 'Funding' },
    { href: '/dashboard/trades', label: 'Trades' },
    { href: '/dashboard/news', label: 'News' },
    { href: '/dashboard/dividends', label: 'Dividends' },
    { href: '/dashboard/trading-plan', label: 'Trading Plan' },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
              <span className="text-xl sm:text-2xl font-bold text-white">Prism Capital</span>
            </Link>
            
            {/* Desktop Menu */}
            <DashboardNav menuItems={menuItems} />

            {/* Mobile Menu */}
            <MobileMenu items={menuItems} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}