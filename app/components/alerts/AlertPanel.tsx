'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { AlertGroup } from './AlertGroup';

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroupedAlerts {
  urgent: AlertItem[];
  thisWeek: AlertItem[];
  comingSoon: AlertItem[];
  past: AlertItem[];
}

interface AlertItem {
  news_id: number;
  ticker: string;
  company_name: string | null;
  news_description: string;
  news_date: string;
  alert_date: string | null;
  alert_notes: string | null;
  news_type: {
    type_code: string;
    type_name: string;
  };
}

export function AlertPanel({ isOpen, onClose }: AlertPanelProps) {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<GroupedAlerts>({
    urgent: [],
    thisWeek: [],
    comingSoon: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !session?.user?.id) {
      return;
    }

    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/alerts?userId=${session.user?.id}`);
        const result = await response.json();
        setAlerts(result.data || {
          urgent: [],
          thisWeek: [],
          comingSoon: [],
          past: [],
        });
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [isOpen, session?.user?.id]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] backdrop-blur-xl bg-white/5 border-l border-white/20 z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-xl bg-white/5 border-b border-white/20 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🔔 Alerts
            </h2>
            <p className="text-blue-300 text-sm mt-1">
              {alerts.urgent.length + alerts.thisWeek.length > 0
                ? `${alerts.urgent.length + alerts.thisWeek.length} upcoming alerts`
                : 'No upcoming alerts'}
            </p>
          </div>
          <GlassButton
            icon={X}
            onClick={onClose}
            tooltip="Close"
            variant="secondary"
            size="md"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center text-blue-200 py-8">Loading alerts...</div>
          ) : (
            <>
              {/* Urgent Group (0-3 days) */}
              {alerts.urgent.length > 0 && (
                <AlertGroup
                  title="🔥 URGENT (Next 3 Days)"
                  alerts={alerts.urgent}
                  variant="urgent"
                  defaultExpanded={true}
                />
              )}

              {/* This Week Group (4-7 days) */}
              {alerts.thisWeek.length > 0 && (
                <AlertGroup
                  title="📅 This Week (4-7 Days)"
                  alerts={alerts.thisWeek}
                  variant="thisWeek"
                  defaultExpanded={true}
                />
              )}

              {/* Coming Soon Group (8-30 days) */}
              {alerts.comingSoon.length > 0 && (
                <AlertGroup
                  title="📌 Coming Soon (8-30 Days)"
                  alerts={alerts.comingSoon}
                  variant="comingSoon"
                  defaultExpanded={false}
                />
              )}

              {/* Past Group */}
              {alerts.past.length > 0 && (
                <AlertGroup
                  title="📜 Past Alerts"
                  alerts={alerts.past}
                  variant="past"
                  defaultExpanded={false}
                />
              )}

              {/* Empty State */}
              {alerts.urgent.length === 0 &&
                alerts.thisWeek.length === 0 &&
                alerts.comingSoon.length === 0 &&
                alerts.past.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-blue-200 text-lg mb-2">No alerts set</p>
                    <p className="text-blue-300 text-sm">
                      Set alerts when adding news entries to get notified
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </>
  );
}