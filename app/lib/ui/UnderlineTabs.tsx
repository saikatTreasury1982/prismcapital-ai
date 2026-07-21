'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface Tab {
  id: string;
  label: string | ReactNode;
  icon?: ReactNode;
}

interface UnderlineTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function UnderlineTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: UnderlineTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measure = () => {
    const container = containerRef.current;
    const activeEl = tabRefs.current[activeTab];
    if (!container || !activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    setIndicator({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
  };

  useEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabs.length]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className={`backdrop-blur-xl bg-white/5 rounded-full p-2 border border-white/10 relative ${className}`}>
      <div
        ref={containerRef}
        className="flex gap-1 overflow-x-auto md:overflow-visible scroll-smooth snap-x snap-mandatory scrollbar-hide relative"
      >
        {/* Sliding pill indicator */}
        {indicator && (
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-br from-blue-400/25 to-emerald-400/20 transition-all duration-300 ease-out pointer-events-none"
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}

        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            type="button"
            onClick={() => onChange(tab.id)}
            suppressHydrationWarning
            className={`flex-1 px-3 py-3 md:px-6 rounded-full flex items-center justify-center gap-2 transition-colors relative z-10 flex-shrink-0 ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <span className={activeTab === tab.id ? 'scale-110 transition-transform' : 'transition-transform'}>
              {tab.icon}
            </span>
            {typeof tab.label === 'string' ? (
              <span className="hidden md:inline">{tab.label}</span>
            ) : (
              <span className="hidden md:inline">{tab.label}</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-1.5 left-4 right-4 md:left-6 md:right-6 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Gradient fade hints for scrolling - mobile only */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-800/50 to-transparent pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-800/50 to-transparent pointer-events-none md:hidden" />
    </div>
  );
}