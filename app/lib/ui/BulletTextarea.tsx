// app/lib/ui/BulletTextarea.tsx
'use client';

import { useState } from 'react';

interface BulletTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  rounded?: boolean; // New prop for rounded corners
  scrollable?: boolean; // New prop for scrollbar
}

export function BulletTextarea({
  value,
  onChange,
  placeholder = 'Enter text (each line becomes a bullet point)',
  rows = 4,
  className = '',
  label,
  required = false,
  disabled = false,
  rounded = true, // Default to rounded
  scrollable = false, // Default to no scrollbar
}: BulletTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-blue-200 text-sm font-medium block">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`
          w-full funding-input px-4 py-3 resize-none
          ${rounded ? 'rounded-xl' : 'rounded-none'}
          ${scrollable ? 'overflow-y-auto custom-scrollbar' : ''}
          ${className}
        `}
        required={required}
      />
    </div>
  );
}

interface BulletDisplayProps {
  text: string;
  className?: string;
}

export function BulletDisplay({ text, className = '' }: BulletDisplayProps) {
  if (!text) return null;

  const lines = text.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) return null;

  return (
    <ul className={`space-y-1 ${className}`}>
      {lines.map((line, index) => (
        <li key={index} className="flex items-start gap-2 text-white">
          <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
          <span className="flex-1">{line.trim()}</span>
        </li>
      ))}
    </ul>
  );
}