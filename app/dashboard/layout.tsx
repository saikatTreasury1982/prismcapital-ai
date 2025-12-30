'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardNavProps {
  menuItems: Array<{ href: string; label: string }>;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function DashboardNav({ menuItems, mobile = false, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-xl text-white shadow-lg border border-white/30'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex items-stretch gap-2 h-full">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center ${
              isActive
                ? 'bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-xl text-white shadow-lg border border-white/30'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}