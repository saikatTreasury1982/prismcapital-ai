import Link from 'next/link';
import { Button } from './components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
            <span className="text-2xl font-bold text-white">Prism Capital</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-32 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Smart Portfolio Tracking for
            <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Trades and Investments
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Track your day trades, swing positions, and long-term holdings all in one intelligent platform.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="!px-12">
                Start
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}