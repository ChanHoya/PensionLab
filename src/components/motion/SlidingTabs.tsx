'use client';

import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';

// 부드러운 알약 슬라이딩 인디케이터 기반 탭 전환 모션 컴포넌트

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface SlidingTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SlidingTabs: React.FC<SlidingTabsProps> = ({
  tabs,
  activeTabId,
  onChange,
  className = '',
  size = 'md',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  const updateIndicator = () => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeTabId}"]`
    );
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeTabId, tabs]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        updateIndicator();
      });
    }
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTabId]);

  const paddingStyle =
    size === 'sm'
      ? { padding: '4px 10px', fontSize: '12px' }
      : size === 'lg'
      ? { padding: '8px 18px', fontSize: '14px' }
      : { padding: '6px 14px', fontSize: '13px' };

  return (
    <div
      ref={containerRef}
      className={`t-sliding-nav ${className}`}
      role="tablist"
      style={{ position: 'relative' }}
    >
      {/* Sliding Pill Indicator */}
      <div
        className="t-sliding-indicator"
        style={{
          left: 0,
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
        }}
      />

      {/* Tabs */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`t-sliding-tab-btn ${isActive ? 'is-active' : ''}`}
            style={{
              ...paddingStyle,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span style={{ marginLeft: '4px' }}>{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
