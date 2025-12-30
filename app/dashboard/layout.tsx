'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { DashboardNav } from '../components/dashboard/DashboardNav';
import { Settings, LogOut, Menu, X as CloseIcon } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [loadingSignOff, setLoadingSignOff] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div className="container mx-auto px-4 sm:px-6 py-3">
          {/* Top Row: Logo + Menu + Actions */}
          <div className="flex items-center justify-between w-full mb-2">
            {/* Left: Logo + Hamburger (Mobile) */}
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">Prism Capital</span>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
            
            {/* Center: Desktop Navigation Menu */}
            <div className="hidden md:flex flex-1 justify-center">
              <DashboardNav menuItems={menuItems} />
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <GlassButton
                icon={Settings}
                onClick={handleUserPreferences}
                disabled={loadingPreferences}
                tooltip="User Preferences"
                variant="secondary"
                size="md"
              />
              
              <GlassButton
                icon={LogOut}
                onClick={handleSignOff}
                disabled={loadingSignOff}
                tooltip={loadingSignOff ? 'Signing off...' : 'Sign Off'}
                variant="secondary"
                size="md"
              />
            </div>
          </div>
          
          {/* Bottom Row: User Info + Date */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-white font-medium truncate max-w-[150px] sm:max-w-none">
              {session?.user?.name || 'User'}
            </span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-200 whitespace-nowrap">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 z-50 md:hidden transform transition-transform">
            <div className="p-6">
              {/* Close Button */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold text-white">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Mobile Navigation */}
              <DashboardNav 
                menuItems={menuItems} 
                mobile={true}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* User Preferences Modal */}
      {showPreferences && preferences && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 max-w-md w-full p-6 sm:p-8">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">User Preferences</h2>
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
                <p className="font-semibold text-sm break-all">{preferences.user_id}</p>
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