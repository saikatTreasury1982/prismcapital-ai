import Link from 'next/link';
import { BarChart3, Wallet, Plane } from 'lucide-react';

export default function LauncherPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">App Launcher</h1>
        <p className="text-blue-200 text-center mb-12">Choose an app to continue</p>

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
            <Link key={app.name} href={app.href}>
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