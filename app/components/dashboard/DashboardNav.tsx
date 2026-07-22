'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface DashboardNavProps {
  menuItems: Array<{ href: string; label: string }>;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function DashboardNav({ menuItems, mobile = false, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measure = () => {
    const nav = navRef.current;
    const activeEl = itemRefs.current[pathname];
    if (!nav || !activeEl) {
      setIndicator(null);
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    setIndicator({ left: itemRect.left - navRect.left, width: itemRect.width });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, menuItems.length, mobile]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
              className={`relative px-4 py-3 rounded-xl font-medium transition-all ${
                isActive ? 'text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'
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
    <nav ref={navRef} className="hidden md:flex items-stretch gap-2 h-full relative">
      {/* Sliding glow + underline (one unit) */}
      {indicator && (
        <span
          aria-hidden
          className="absolute top-0 bottom-0 pointer-events-none transition-all duration-500 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        >
          <span
            className="absolute inset-0 blur-md rounded-xl"
            style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.5), transparent 72%)' }}
          />
          <span className="absolute left-[22%] right-[22%] bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
        </span>
      )}

      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => { itemRefs.current[item.href] = el; }}
            className={`relative z-10 px-6 py-3 rounded-xl font-medium transition-colors duration-300 flex items-center ${
              isActive ? 'text-white' : 'text-blue-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}