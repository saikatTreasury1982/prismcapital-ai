'use client';

import { Zap, Edit3, Upload } from 'lucide-react';

interface EntryMethodSelectorProps {
  selected: 'quick' | 'detailed' | 'csv';
  onSelect: (method: 'quick' | 'detailed' | 'csv') => void;
}

export function EntryMethodSelector({ selected, onSelect }: EntryMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        onClick={() => onSelect('quick')}
        className={`p-6 rounded-2xl border-2 transition-all ${
          selected === 'quick'
            ? 'border-emerald-400 bg-emerald-500/20'
            : 'border-white/20 bg-white/5 hover:bg-white/10'
        }`}
      >
        <Zap className={`w-8 h-8 mb-3 ${selected === 'quick' ? 'text-emerald-300' : 'text-blue-300'}`} />
        <div className="text-white font-semibold mb-1">Quick Entry</div>
        <div className="text-sm text-blue-200">Fast single transaction</div>
      </button>

      <button
        onClick={() => onSelect('detailed')}
        className={`p-6 rounded-2xl border-2 transition-all ${
          selected === 'detailed'
            ? 'border-blue-400 bg-blue-500/20'
            : 'border-white/20 bg-white/5 hover:bg-white/10'
        }`}
      >
        <Edit3 className={`w-8 h-8 mb-3 ${selected === 'detailed' ? 'text-blue-300' : 'text-blue-300'}`} />
        <div className="text-white font-semibold mb-1">Detailed Entry</div>
        <div className="text-sm text-blue-200">With all fields & notes</div>
      </button>
    </div>
  );
}