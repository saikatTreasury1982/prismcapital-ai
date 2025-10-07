import Link from 'next/link';
import { MobileMenu } from '../components/ui/MobileMenu';

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">Prism Capital</span>
            </Link>
            
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu */}
            <MobileMenu items={menuItems} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}