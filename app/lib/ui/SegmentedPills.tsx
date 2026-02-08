'use client';

import { ReactNode } from 'react';

export interface SegmentedPillOption<T = number | string> {
  value: T;
  label?: string;
  icon?: ReactNode;
  activeColor?: string; // Per-option color override
}

interface SegmentedPillsProps<T = number | string> {
  options: SegmentedPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  showLabels?: boolean;
  activeColor?: string; // Default active color (fallback)
  inactiveColor?: string;
  className?: string;
  disabled?: boolean;
}

export default function SegmentedPills<T extends number | string>({
  options,
  value,
  onChange,
  showLabels = true,
  activeColor = 'bg-emerald-500', // Default fallback color
  inactiveColor = 'bg-white/20',
  className = '',
  disabled = false,
}: SegmentedPillsProps<T>) {
  const selectedIndex = options.findIndex(opt => opt.value === value);
  const selectedOption = options[selectedIndex];
  
  // Use per-option color if available, otherwise use default activeColor
  const currentActiveColor = selectedOption?.activeColor || activeColor;

  return (
    <div className={`relative inline-flex ${inactiveColor} rounded-full p-1 ${className}`}>
      {/* Sliding Pill Background */}
      <div
        className={`absolute top-1 bottom-1 ${currentActiveColor} rounded-full transition-all duration-300 ease-out`}
        style={{
          width: `calc(${100 / options.length}% - 0.5rem)`,
          left: `calc(${(selectedIndex * 100) / options.length}% + 0.25rem)`,
        }}
      />

      {/* Options */}
      {options.map((option) => {
        const isActive = option.value === value;
        
        return (
          <button
            suppressHydrationWarning
            key={String(option.value)}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              relative z-10 flex items-center justify-center gap-2 px-4 py-2
              text-sm font-semibold transition-colors duration-300
              ${isActive ? 'text-white' : 'text-blue-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${!disabled && !isActive ? 'hover:text-white' : ''}
            `}
            style={{ minWidth: showLabels ? '120px' : '48px' }}
          >
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            {showLabels && option.label && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}