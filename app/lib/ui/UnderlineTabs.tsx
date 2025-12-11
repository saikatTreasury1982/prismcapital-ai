'use client';

import { ReactNode } from 'react';

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
  return (
    <div className={`backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 ${className}`}>
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {typeof tab.label === 'string' ? (
              <span>{tab.label}</span>
            ) : (
              tab.label
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}