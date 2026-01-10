'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { BulletDisplay } from '@/app/lib/ui/BulletTextarea';
import GlassButton from '@/app/lib/ui/GlassButton';

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

interface AlertGroupProps {
  title: string;
  alerts: AlertItem[];
  variant: 'urgent' | 'thisWeek' | 'comingSoon' | 'past';
  defaultExpanded?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function AlertGroup({ title, alerts, variant, defaultExpanded = false }: AlertGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isItemExpanded, setIsItemExpanded] = useState(defaultExpanded);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAlerts = alerts.slice(startIndex, endIndex);

  const getVariantStyles = () => {
    switch (variant) {
      case 'urgent':
        return 'border-red-400/40';
      case 'thisWeek':
        return 'border-yellow-400/40';
      case 'comingSoon':
        return 'border-blue-400/40';
      case 'past':
        return 'border-gray-400/40';
    }
  };

  const getNewsTypeIcon = (typeCode: string) => {
    const icons: Record<string, string> = {
      'EARNINGS': '💰',
      'MARKET': '📈',
      'REGULATORY': '⚖️',
      'PRODUCT': '🚀'
    };
    return icons[typeCode] || '📰';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`backdrop-blur-sm bg-white/5 rounded-2xl border border-white/20 overflow-hidden ${getVariantStyles()}`}>
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 hover:bg-white/5 transition-colors text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-md text-white">{title}</h3>
          <span className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-semibold">
            {alerts.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white flex-shrink-0" />
        )}
      </button>

      {/* Group Content */}
      {isExpanded && (
        <div className="border-t border-white/20 p-4 bg-black/5">
          <div className="space-y-3">
            {paginatedAlerts.map((alert) => {
              return (
                <div
                  key={alert.news_id}
                  className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Alert Header - Always Visible */}
                  <button
                    onClick={() => setIsItemExpanded(!isItemExpanded)}
                    className="w-full p-4 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNewsTypeIcon(alert.news_type.type_code)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg font-bold text-white">{alert.ticker}</span>
                          {alert.company_name && (
                            <span className="text-blue-200 text-sm">{alert.company_name}</span>
                          )}
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-200 rounded text-xs">
                            {alert.news_type.type_name}
                          </span>
                        </div>
                        <div className="text-emerald-300 text-sm font-semibold">
                          📅 Alert Date: {formatDate(alert.alert_date || alert.news_date)}
                        </div>
                      </div>
                      {isItemExpanded ? (
                        <ChevronUp className="w-5 h-5 text-white flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Alert Details - Collapsible */}
                  {isItemExpanded && (
                    <div className="border-t border-white/10 p-4 bg-white/5">
                      {/* Description */}
                      <div className="mb-2">
                        <BulletDisplay text={alert.news_description} className="text-sm" />
                      </div>

                      {/* Alert Notes */}
                      {alert.alert_notes && (
                        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg">
                          <h4 className="text-emerald-300 font-semibold text-sm mb-1">Alert Notes:</h4>
                          <BulletDisplay text={alert.alert_notes} className="text-sm" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
              <GlassButton
                icon={ChevronLeft}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                tooltip="Previous Page"
                variant="primary"
                size="sm"
              />
              <span className="text-white text-sm px-3">
                Page {currentPage} of {totalPages}
              </span>
              <GlassButton
                icon={ChevronRight}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                tooltip="Next Page"
                variant="primary"
                size="sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}