'use client';

import { ReactNode } from 'react';

interface SegmentedOption {
  value: number;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: number;
  onChange: (value: number) => void;
  className?: string;
  color?: 'auto' | 'blue' | 'emerald' | 'rose';
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
  color = 'auto',
}: SegmentedControlProps) {
  const activeIndex = options.findIndex(opt => opt.value === value);
  
  // Determine color based on prop or number of options
  const getActiveColor = () => {
    if (color === 'blue') return 'bg-blue-500';
    if (color === 'emerald') return 'bg-emerald-500';
    if (color === 'rose') return 'bg-rose-500';
    
    // Auto mode
    if (options.length === 2) {
      // Two options: green for first, rose for second (Deposit/Withdrawal style)
      return activeIndex === 0 ? 'bg-emerald-500' : 'bg-rose-500';
    } else {
      // Three or more options: use blue (neutral)
      return 'bg-blue-500';
    }
  };
  
  return (
    <div className={`backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-1 relative ${className}`}>
      {/* Sliding pill background */}
      <div 
        className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out ${getActiveColor()}`}
        style={{
          left: `calc(${activeIndex * (100 / options.length)}% + 4px)`,
          right: `calc(${(options.length - activeIndex - 1) * (100 / options.length)}% + 4px)`,
        }}
      />
      
      {/* Buttons */}
      <div className="relative flex">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 px-8 py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap z-10 relative ${
              value === option.value
                ? 'text-white'
                : 'text-blue-200'
            }`}
            style={{ minWidth: `${100 / options.length}%` }}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}