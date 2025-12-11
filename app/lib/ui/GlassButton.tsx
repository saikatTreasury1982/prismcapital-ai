'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  tooltip?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

export default function GlassButton({
  icon: Icon,
  tooltip,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: GlassButtonProps) {
  const baseStyles = 'backdrop-blur-md bg-white/10 border border-white/20 rounded-full font-semibold transition-all hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variantStyles = {
    primary: 'hover:bg-blue-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20',
    secondary: 'hover:bg-emerald-600/30 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20',
  };
  
  const sizeStyles = {
    sm: 'p-2 text-sm',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <button
      title={tooltip}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className.replace('animate-spin', '').trim()}`}
      {...props}
    >
      {Icon && <Icon className={`w-5 h-5 text-white ${className.includes('animate-spin') ? 'animate-spin' : ''}`} />}
      {children}
    </button>
  );
}