'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Fingerprint, Lock, Key, ArrowLeft } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePasskey = async () => {
    setLoading(true);
    setLoadingMessage('Initializing authentication...');
    
    try {
      setLoadingMessage('Looking up your account...');
      const lookupResponse = await fetch('/api/auth/user/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!lookupResponse.ok) {
        throw new Error('User not found');
      }

      const { userId } = await lookupResponse.json();
      setLoadingMessage('Preparing passkey authentication...');

      const authOptionsResponse = await fetch(`/api/auth/passkey/authenticate?userId=${userId}`);
      
      if (authOptionsResponse.ok) {
        const options = await authOptionsResponse.json();
        setLoading(false);
        setLoadingMessage('');
        
        const { startAuthentication } = await import('@simplewebauthn/browser');
        let credential;
        try {
          credential = await startAuthentication(options);
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            return;
          }
          throw err;
        }

        setLoading(true);
        setLoadingMessage('Verifying your identity...');

        const verifyResponse = await fetch('/api/auth/passkey/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, credential, challenge: options.challenge }),
        });

        const { verified } = await verifyResponse.json();
        if (verified) {
          setLoadingMessage('Creating your session...');
          const result = await signIn('passkey', { 
            userId,
            redirect: false,
          });
          
          if (result?.ok) {
            setLoadingMessage('Success! Redirecting...');
            window.location.href = '/dashboard';
          } else {
            throw new Error('Failed to create session');
          }
        }
      } else {
        setLoadingMessage('Setting up new passkey...');
        const { startRegistration } = await import('@simplewebauthn/browser');
        
        const optionsResponse = await fetch('/api/auth/passkey/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const options = await optionsResponse.json();
        setLoading(false);
        setLoadingMessage('');
        
        let credential;
        try {
          credential = await startRegistration(options);
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            return;
          }
          throw err;
        }

        setLoading(true);
        setLoadingMessage('Verifying your passkey...');

        const verifyResponse = await fetch('/api/auth/passkey/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, credential, challenge: options.challenge }),
        });

        const { verified } = await verifyResponse.json();
        if (!verified) {
          throw new Error('Passkey verification failed');
        }

        setLoadingMessage('Creating your session...');
        const result = await signIn('passkey', { 
          userId,
          redirect: false,
        });
        
        if (result?.ok) {
          setLoadingMessage('Success! Redirecting...');
          window.location.href = '/dashboard';
        } else {
          throw new Error('Failed to create session');
        }
      }
    } catch (error: any) {
      console.error('Passkey failed:', error);

      if (error.name === 'NotAllowedError') {
        setLoading(false);
        setLoadingMessage('');
        return;
      }

      alert('Passkey authentication failed. Please try password instead.');
      setShowPasswordForm(true);
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePasswordClick = async () => {
    if (!identifier.trim()) {
      setError('Please enter your User ID or Email first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if password exists
      const response = await fetch('/api/auth/password/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check password');
      }

      const data = await response.json();
      setHasPassword(data.hasPassword);
      setUserId(data.userId);
      setShowPasswordForm(true);
      setIsSettingPassword(!data.hasPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/password/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set password');
      }

      // Password set successfully, now log in
      const result = await signIn('password', {
        identifier,
        password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = '/dashboard';
      } else {
        throw new Error('Login failed after setting password');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signIn('password', {
        identifier,
        password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = '/dashboard';
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message);
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
      <div className="container mx-auto px-4 sm:px-6 flex items-center min-h-[calc(100vh-120px)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SIDE - Hero Text */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Smart Portfolio Tracker
              <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent text-2xl sm:text-3xl md:text-4xl">
                Trades and Investments
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-xl text-gray-300">
              application created by vibe coding with Claude.
            </p>
          </div>

          {/* RIGHT SIDE - Login Card */}
          <div className="flex justify-center lg:justify-end">  
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 max-w-md w-full shadow-2xl">
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome</h1>
              <p className="text-blue-200 text-center mb-8">Sign in to your account</p>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
                  {error}
                </div>
              )}

              {!showPasswordForm ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="User ID or Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                    suppressHydrationWarning={true}
                  />
                  
                  <div className="flex gap-3 justify-center">
                    <GlassButton
                      icon={Fingerprint}
                      onClick={handlePasskey}
                      disabled={loading || !identifier.trim()}
                      tooltip="Sign in with Passkey"
                      variant="primary"
                      size="lg"
                    />
                    
                    <GlassButton
                      icon={Lock}
                      onClick={handlePasswordClick}
                      disabled={loading || !identifier.trim()}
                      tooltip="Sign in with Password"
                      variant="secondary"
                      size="lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {isSettingPassword ? (
                    <>
                      <h2 className="text-lg font-semibold text-white mb-4">Set Your Password</h2>
                      
                      <input
                        type="password"
                        placeholder="Password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                      />

                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 mb-6"
                      />
                      
                      <div className="flex items-center justify-center gap-3">
                        <GlassButton
                          icon={Key}
                          onClick={handleSetupPassword}
                          disabled={loading || !password || !confirmPassword}
                          tooltip={loading ? 'Setting Password...' : 'Set Password & Sign In'}
                          variant="primary"
                          size="lg"
                        />
                        <GlassButton
                          icon={ArrowLeft}
                          onClick={() => {
                            setShowPasswordForm(false);
                            setIsSettingPassword(false);
                            setPassword('');
                            setConfirmPassword('');
                            setError(null);
                          }}
                          tooltip="Back"
                          variant="secondary"
                          size="lg"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-white mb-4">Enter Your Password</h2>
                      
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 mb-6"
                      />
                      
                      <div className="flex items-center justify-center gap-3">
                        <GlassButton
                          icon={Lock}
                          onClick={handlePasswordLogin}
                          disabled={loading || !password}
                          tooltip={loading ? 'Signing In...' : 'Sign In'}
                          variant="primary"
                          size="lg"
                        />
                        <GlassButton
                          icon={ArrowLeft}
                          onClick={() => {
                            setShowPasswordForm(false);
                            setIsSettingPassword(false);
                            setPassword('');
                            setConfirmPassword('');
                            setError(null);
                          }}
                          tooltip="Back"
                          variant="secondary"
                          size="lg"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-white text-lg font-semibold mb-2">
                  {loadingMessage || 'Processing...'}
                </p>
                <p className="text-blue-200 text-sm">
                  Please wait, do not close this window
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}