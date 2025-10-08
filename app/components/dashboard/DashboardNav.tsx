'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardNavProps {
  menuItems: Array<{ href: string; label: string }>;
}

export function DashboardNav({ menuItems }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-white/20 backdrop-blur-xl text-white shadow-lg border border-white/30'
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