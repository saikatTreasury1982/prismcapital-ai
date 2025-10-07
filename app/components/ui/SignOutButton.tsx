'use client';

import { signOut } from '@/app/services/authService';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
    >
      Sign Out
    </button>
  );
}