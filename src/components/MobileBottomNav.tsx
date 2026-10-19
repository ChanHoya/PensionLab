'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // 온보딩 완료 전 화면에서는 네비게이션 숨김
  if (pathname === '/onboarding') {
    return null;
  }

  const navItems = [
    { label: '홈', href: '/', icon: '🏠' },
    { label: '대시보드', href: '/dashboard', icon: '📊' },
    { label: 'AI 진단', href: '/dashboard/ai-advisor', icon: '🤖' },
    { label: '인출전략', href: '/dashboard/withdrawal', icon: '💸' },
    { label: '연금뉴스', href: '/news', icon: '📰' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe shadow-2xl">
      <nav className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive
                  ? 'text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="h-1 w-1 bg-indigo-500 rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
