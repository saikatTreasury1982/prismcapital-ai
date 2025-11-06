'use client';

import Link from 'next/link';
import { BarChart3, Wallet, Plane, Power } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function LauncherPage() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/';
    }
  }, [status]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-emerald-400">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // If no session, show nothing (will redirect)
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const apps = [
    {
      name: 'Prism Capital',
      href: '/prismcapital',
      icon: BarChart3,
      gradient: 'from-blue-500 to-purple-600',
      description: 'Trading & Portfolio',
    },
    {
      name: 'Finance Pulse',
      href: '/financepulse',
      icon: Wallet,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Budget & Expenses',
    },
    {
      name: 'Wanderlust',
      href: '/wanderlust',
      icon: Plane,
      gradient: 'from-orange-500 to-pink-600',
      description: 'Travel Planning',
    },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      // Sign out from NextAuth
      await signOut({ redirect: false });
      
      // Redirect to login
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      setIsSigningOut(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">App Launcher</h1>
            <p className="text-blue-200">Choose an app to continue</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-blue-200 text-sm">Signed In</span>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`relative w-16 h-8 rounded-full transition-all ${
                isSigningOut ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
            >
              <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg transition-all">
                <Power className="w-4 h-4 text-blue-600" />
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => {
            const isComingSoon = app.name !== 'Prism Capital';
            
            return isComingSoon ? (
              <div key={app.name} className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 opacity-60 cursor-not-allowed relative">
                <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-500/30">
                  Coming Soon
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center mb-4`}>
                  <app.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{app.name}</h2>
                <p className="text-blue-200 text-sm">{app.description}</p>
              </div>
            ) : (
              <Link key={app.name} href={app.href} target="_blank" rel="noopener noreferrer">
                <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group hover:scale-105 hover:shadow-2xl">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <app.icon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{app.name}</h2>
                  <p className="text-blue-200 text-sm">{app.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}