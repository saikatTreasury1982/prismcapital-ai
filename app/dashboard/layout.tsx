'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { DashboardNav } from '../components/dashboard/DashboardNav';
import { Settings, LogOut, UserCircle } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [loadingSignOff, setLoadingSignOff] = useState(false);

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/funding', label: 'Funding' },
    { href: '/dashboard/trades', label: 'Trades' },
    { href: '/dashboard/news', label: 'News' },
    { href: '/dashboard/dividends', label: 'Dividends' },
    { href: '/dashboard/trading-plan', label: 'Trading Plan' },
  ];

  const handleSignOff = async () => {
    setLoadingSignOff(true);
    try {
      const userId = session?.user?.id;
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Sign off failed:', error);
    } finally {
      setLoadingSignOff(false);
    }
  };

  const handleUserPreferences = async () => {
    setLoadingPreferences(true);
    try {
      const userId = session?.user?.id;
      const response = await fetch(`/api/user/preferences?userId=${userId}`);
      const data = await response.json();
      setPreferences(data);
      setShowPreferences(true);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center w-full">
            {/* Logo - Not clickable */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
              <span className="text-xl sm:text-2xl font-bold text-white">Prism Capital</span>
            </div>
            
            {/* Desktop Menu - Centered */}
            <div className="flex-1 flex justify-center">
              <DashboardNav menuItems={menuItems} />
            </div>
            
            {/* User Menu Button - Extreme Right */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <UserCircle className="w-6 h-6 text-white" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-20">
                    <div className="py-2">
                      <button
                        onClick={handleUserPreferences}
                        disabled={loadingPreferences}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 disabled:opacity-50"
                      >
                        <Settings className="w-5 h-5" />
                        <span>User Preferences</span>
                      </button>
                      
                      <div className="border-t border-white/10 my-1"></div>
                      
                      <button
                        onClick={handleSignOff}
                        disabled={loadingSignOff}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-white/10 transition-colors flex items-center gap-3 disabled:opacity-50"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>{loadingSignOff ? 'Signing off...' : 'Sign Off'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* User Preferences Modal */}
      {showPreferences && preferences && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 max-w-md w-full p-8">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">User Preferences</h2>
              <GlassButton
                icon={X}
                onClick={() => setShowPreferences(false)}
                tooltip="Close"
                variant="secondary"
                size="md"
              />
            </div>
            
            <div className="space-y-4 text-white">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-1">User ID</p>
                <p className="font-semibold">{preferences.user_id}</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-1">Decimal Places</p>
                <p className="font-semibold">{preferences.decimal_places}</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-1">Date Format</p>
                <p className="font-semibold">{preferences.date_format}</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-1">Theme</p>
                <p className="font-semibold capitalize">{preferences.theme}</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-1">Notifications</p>
                <p className="font-semibold">{preferences.notifications_enabled === 1 ? 'Enabled' : 'Disabled'}</p>
              </div>
              
              {preferences.pnl_strategy_id && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-blue-200 text-sm mb-1">P&L Strategy</p>
                  <p className="font-semibold">{preferences.pnl_strategy_name || `ID: ${preferences.pnl_strategy_id}`}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}