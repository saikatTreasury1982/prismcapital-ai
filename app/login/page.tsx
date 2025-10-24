'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Fingerprint, Smartphone } from 'lucide-react';

export default function LoginPage() {
  const [showOTP, setShowOTP] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasskey = async () => {
    setLoading(true);
    try {
      // Passkey auth will be implemented
      await signIn('passkey', { redirect: true, callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Passkey failed:', error);
      setShowOTP(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      await signIn('otp', {
        phone,
        code,
        redirect: true,
        callbackUrl: '/dashboard',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 sm:p-12 border border-white/20 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h1>
        <p className="text-blue-200 text-center mb-8">Sign in to Prism Capital</p>

        {!showOTP ? (
          <div className="space-y-4">
            <button
              onClick={handlePasskey}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Fingerprint className="w-6 h-6" />
              {loading ? 'Authenticating...' : 'Sign in with Passkey'}
            </button>

            <button
              onClick={() => setShowOTP(true)}
              className="w-full bg-white/5 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10"
            >
              <Smartphone className="w-6 h-6" />
              Use SMS Code Instead
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
              />
            </div>

            {!code && (
              <button
                onClick={handleSendOTP}
                disabled={loading || !phone}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            )}

            {code !== '' && (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="6-Digit Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 text-center text-2xl tracking-widest"
                  />
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
              </>
            )}

            <button
              onClick={() => setShowOTP(false)}
              className="w-full text-blue-300 text-sm hover:text-white transition-colors"
            >
              ← Back to Passkey
            </button>
          </div>
        )}
      </div>
    </div>
  );
}