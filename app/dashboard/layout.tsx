'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { DashboardNav } from '../components/dashboard/DashboardNav';
import { Settings, LogOut, Save, Menu, XCircle, X as CloseIcon } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { X } from 'lucide-react';
import { AlertBell } from '../components/alerts/AlertBell';
import { AlertPanel } from '../components/alerts/AlertPanel';
import { formatDisplayDate } from '@/app/lib/utils/dateFormatter';

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
  const [editMode, setEditMode] = useState(false);
  const [tempCutoffDate, setTempCutoffDate] = useState<string | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [loadingSignOff, setLoadingSignOff] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);

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
      setTempCutoffDate(data.moomoo_import_cutoff_date);
      setShowPreferences(true);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      const userId = session?.user?.id;
      const response = await fetch(`/api/user/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          moomoo_import_cutoff_date: tempCutoffDate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const updatedPrefs = await response.json();
      setPreferences(updatedPrefs);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSavingPreferences(false);
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
                size="sm"
              />
              
              <AlertBell onClick={() => setAlertPanelOpen(true)} />
              
              <GlassButton
                icon={LogOut}
                onClick={handleSignOff}
                disabled={loadingSignOff}
                tooltip={loadingSignOff ? 'Signing off...' : 'Sign Off'}
                variant="secondary"
                size="sm"
              />
            </div>
          </div>
          
          {/* Bottom Row: User Info + Date */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-white font-medium truncate max-w-[150px] sm:max-w-none">
              {session?.user?.name || 'User'}
            </span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-200 whitespace-nowrap" suppressHydrationWarning>
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
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 max-w-2xl w-full p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Header with Action Buttons */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">User Preferences</h2>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <GlassButton
                      icon={CloseIcon}
                      onClick={() => {
                        setEditMode(false);
                        setTempCutoffDate(preferences.moomoo_import_cutoff_date);
                      }}
                      tooltip="Cancel"
                      variant="secondary"
                      size="md"
                    />
                    <GlassButton
                      icon={Save}
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                      tooltip="Save Changes"
                      variant="primary"
                      size="md"
                    />
                  </>
                ) : (
                  <GlassButton
                    icon={CloseIcon}
                    onClick={() => {
                      setShowPreferences(false);
                      setEditMode(false);
                      setTempCutoffDate(preferences.moomoo_import_cutoff_date);
                    }}
                    tooltip="Close"
                    variant="secondary"
                    size="md"
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-6 text-white">
              {/* ACCOUNT & DISPLAY */}
              <div>
                <h3 className="text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Account & Display</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">User ID</p>
                    <p className="font-semibold text-sm break-all">{preferences.user_id}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">Theme</p>
                    <p className="font-semibold capitalize">{preferences.theme}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">Date Format</p>
                    <p className="font-semibold">{preferences.date_format}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">Default Currency</p>
                    <p className="font-semibold">{preferences.default_trading_currency}</p>
                  </div>
                </div>
              </div>

              {/* TRADING STRATEGY */}
              {preferences.pnl_strategy_id && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Trading Strategy</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">P&L Strategy</p>
                    <p className="font-semibold">{preferences.pnl_strategy_name || `ID: ${preferences.pnl_strategy_id}`}</p>
                  </div>
                </div>
              )}

              {/* MOOMOO IMPORT SETTINGS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Moomoo Import Settings</h3>
                  {!editMode && (
                    <GlassButton
                      icon={Settings}
                      onClick={() => setEditMode(true)}
                      tooltip="Edit Moomoo Settings"
                      variant="secondary"
                      size="sm"
                    />
                  )}
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-blue-200 text-xs mb-2">Import Cutoff Date</p>
                  
                  {editMode ? (
                    <div className="space-y-3">
                      <input
                        type="date"
                        value={tempCutoffDate || ''}
                        onChange={(e) => setTempCutoffDate(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      
                      <p className="text-blue-200 text-xs leading-relaxed">
                        ℹ️ Trades before this date cannot be imported from Moomoo
                      </p>
                      
                      <GlassButton
                        icon={XCircle}
                        onClick={() => setTempCutoffDate(null)}
                        tooltip="Clear Cutoff Date"
                        variant="secondary"
                        size="sm"
                      >
                      </GlassButton>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold">
                        {preferences.moomoo_import_cutoff_date 
                          ? formatDisplayDate(preferences.moomoo_import_cutoff_date, preferences.date_format)
                          : 'Not set (all dates allowed)'
                        }
                      </p>
                      {preferences.moomoo_import_cutoff_date && (
                        <p className="text-blue-200 text-xs">
                          Trades before this date cannot be imported
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Panel */}
      <AlertPanel 
        isOpen={alertPanelOpen} 
        onClose={() => setAlertPanelOpen(false)} 
      />
    </div>
  );
}