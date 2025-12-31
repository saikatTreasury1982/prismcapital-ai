'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';

interface AlertBellProps {
  onClick: () => void;
}

export function AlertBell({ onClick }: AlertBellProps) {
  const { data: session } = useSession();
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchAlertCount = async () => {
      try {
        const response = await fetch(`/api/alerts?userId=${session.user?.id}`);
        const result = await response.json();
        setBadgeCount(result.badgeCount || 0);
      } catch (error) {
        console.error('Failed to fetch alert count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertCount();

    // Refresh count every 5 minutes
    const interval = setInterval(fetchAlertCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  return (
    <div className="relative">
      <GlassButton
        icon={Bell}
        onClick={onClick}
        tooltip="Alerts"
        variant="secondary"
        size="md"
      />
      
      {/* Badge */}
      {!loading && badgeCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
          {badgeCount > 99 ? '99+' : badgeCount}
        </div>
      )}
    </div>
  );
}