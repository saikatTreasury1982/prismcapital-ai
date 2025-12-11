'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Fingerprint, Smartphone } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import GlassButton from '@/app/lib/ui/GlassButton';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasskey = async () => {
    setLoading(true);
    try {
      // Lookup user_id from identifier (could be user_id or email)
      const lookupResponse = await fetch('/api/auth/user/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!lookupResponse.ok) {
        throw new Error('User not found');
      }

      const { userId } = await lookupResponse.json();

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
            setLoading(false);
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
          // Create NextAuth session
          const result = await signIn('passkey', { 
            userId,
            redirect: false,
          });
          
          if (result?.ok) {
            window.location.href = '/dashboard';
            return;
          } else {
            throw new Error('Failed to create session');
          }
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
            setLoading(false);
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
        if (!verified) {
          throw new Error('Passkey verification failed');
        }

        // Create NextAuth session
        const result = await signIn('passkey', { 
          userId,
          redirect: false,
        });
        
        if (result?.ok) {
          window.location.href = '/dashboard';
          return;
        } else {
          throw new Error('Failed to create session');
        }
      }
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
        callbackUrl: '/dashboard',
      });
    } finally {
      setLoading(false);
    }
  };

  return (  
    <div className="min-h-screen">
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
      <div className="container mx-auto px-4 sm:px-6 flex items-center min-h-[calc(100vh-100px)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SIDE - Hero Text */}
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Smart Portfolio Tracker
              <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent md:text-4xl">
                Trades and Investments
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-gray-300">
              application created by vibe coding with Claude.
            </p>
          </div>

          {/* RIGHT SIDE - Login Card */}
          <div className="flex justify-center lg:justify-end">  
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 sm:p-12 border border-white/20 max-w-md w-full shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome</h1>
          <p className="text-blue-200 text-center mb-8">Sign in to your account</p>

          {!showOTP ? (
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="User ID or Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  suppressHydrationWarning={true}
                />
                
                <GlassButton
                  icon={Fingerprint}
                  onClick={handlePasskey}
                  disabled={loading || !identifier.trim()}
                  tooltip="Sign in with Passkey"
                  variant="primary"
                  size="lg"
                />
                
                <GlassButton
                  icon={Smartphone}
                  onClick={() => setShowOTP(true)}
                  disabled={!identifier.trim()}
                  tooltip="Use SMS Code Instead"
                  variant="secondary"
                  size="lg"
                />
              </div>
            </div>
            ) : (
            <div className="space-y-4">
              {!code && (
                <div className="flex gap-2 items-center">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                  
                  <GlassButton
                    onClick={handleSendOTP}
                    disabled={loading || !phone}
                    tooltip="Send Code"
                    variant="primary"
                    size="lg"
                    className="px-6"
                  >
                    <span className="text-white text-sm whitespace-nowrap">
                      {loading ? 'Sending...' : 'Send'}
                    </span>
                  </GlassButton>
                </div>
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

                  <GlassButton
                    onClick={handleVerifyOTP}
                    disabled={loading || code.length !== 6}
                    tooltip="Verify & Sign In"
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    <span className="text-white font-semibold">
                      {loading ? 'Verifying...' : 'Verify & Sign In'}
                    </span>
                  </GlassButton>
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
        </div>
      </div>
    </div>
  );
}