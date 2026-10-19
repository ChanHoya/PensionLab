'use client';

import React, { useState, useEffect } from 'react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    // 닫기 이력 확인 (7일간 다시 보지 않기)
    const isDismissed = localStorage.getItem('pensionlab_pwa_dismissed');
    if (isDismissed) {
      const dismissedTime = parseInt(isDismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pensionlab_pwa_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-slide-up text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-xl border border-indigo-500/30">
            📱
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">PensionLab 홈 화면에 추가</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              앱처럼 한 번의 터치로 실시간 연금 자산을 관리하세요.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white text-xs p-1"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
        >
          나중에
        </button>
        <button
          onClick={handleInstall}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-colors"
        >
          앱 추가하기
        </button>
      </div>
    </div>
  );
}
