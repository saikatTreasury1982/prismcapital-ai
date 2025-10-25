'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Fingerprint, Smartphone } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';

export default function LoginPage() {
  const [showOTP, setShowOTP] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasskey = async () => {
    setLoading(true);
    try {
      const userId = 'beb2f83d-998e-4bb2-9510-ae9916e339f3';

      // Try to authenticate with existing passkey first
      const authOptionsResponse = await fetch(`/api/auth/passkey/authenticate?userId=${userId}`);
      
      if (authOptionsResponse.ok) {
        // User has existing passkey - authenticate
        const options = await authOptionsResponse.json();
        const { startAuthentication } = await import('@simplewebauthn/browser');
        let credential;
        try {
          credential = await startAuthentication(options);
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            return; // User cancelled, exit gracefully
          }
          throw err; // Re-throw other errors
        }

        const verifyResponse = await fetch('/api/auth/passkey/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, credential, challenge: options.challenge }),
        });

        const { verified } = await verifyResponse.json();
        if (verified) {
          window.location.href = '/launcher';
          return;
        }
      } else {
        // No passkey exists - register new one
        const { startRegistration } = await import('@simplewebauthn/browser');
        
        const optionsResponse = await fetch('/api/auth/passkey/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const options = await optionsResponse.json();
        
        let credential;
        try {
          credential = await startRegistration(options);
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            return; // User cancelled
          }
          throw err;
        }

        const verifyResponse = await fetch('/api/auth/passkey/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, credential, challenge: options.challenge }),
        });

        const { verified } = await verifyResponse.json();
        if (verified) {
          window.location.href = '/launcher';
          return;
        }
      }

      throw new Error('Authentication failed');
    } catch (error: any) {
      console.error('Passkey failed:', error);

      // User cancelled - don't show error
      if (error.name === 'NotAllowedError') {
        setLoading(false);
        return;
      }

      alert('Passkey authentication failed. Please try SMS instead.');
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
        callbackUrl: '/launcher',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 sm:p-12 border border-white/20 max-w-md w-full shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome</h1>
        <p className="text-blue-200 text-center mb-8">Sign in to your account</p>

        {!showOTP ? (
          <div className="space-y-4">
            <button
              onClick={handlePasskey}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-600 bg-clip-text text-transparent text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Fingerprint className="w-6 h-6" />
              {loading ? 'Authenticating...' : 'Sign in with Passkey'}
            </button>

            <button
              onClick={() => setShowOTP(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-600 bg-clip-text text-transparent text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transition-all disabled:opacity-50"
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>

            {!code && (
              <button
                onClick={handleSendOTP}
                disabled={loading || !phone}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent text-white py-3 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:from-blue-600 enabled:hover:to-blue-700 enabled:hover:shadow-xl"
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
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-center text-2xl tracking-widest"
                  />
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transition-all disabled:opacity-50"
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