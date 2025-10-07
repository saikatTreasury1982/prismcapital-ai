import Link from 'next/link';
import { Button } from './components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
            <span className="text-xl sm:text-2xl font-bold text-white">Prism Capital</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 pt-16 sm:pt-32 pb-16 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Smart Portfolio Tracking for
            <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Trades and Investments
            </span>
          </h1>
          
          <p className="text-base sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            Track your day trades, swing positions, and long-term holdings all in one intelligent platform.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button 
                variant="glass" 
                size="lg" 
                className="!w-24 !h-24 sm:!w-28 sm:!h-28 !rounded-full !text-2xl !font-bold !flex !items-center !justify-center !p-0"
              >
                <ArrowRight size={40} className="sm:w-12 sm:h-12" strokeWidth={2.5} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}