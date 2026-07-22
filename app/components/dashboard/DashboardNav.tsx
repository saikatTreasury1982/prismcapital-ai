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
              className={`relative px-4 py-3 rounded-xl font-medium transition-all overflow-hidden ${
                isActive ? 'text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-0 blur-md pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.5), transparent 72%)' }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-4 right-4 bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]"
                />
              )}
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
            className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center ${
              isActive ? 'text-white' : 'text-blue-200 hover:bg-white/6 hover:text-white'
            }`}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-0 blur-md pointer-events-none rounded-xl"
                style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.5), transparent 72%)' }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
            {isActive && (
              <span
                aria-hidden
                className="absolute left-[22%] right-[22%] bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}