'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { generateRetirementRoadmap, RoadmapMilestone } from '@/services/retirementRoadmapService';
import { usePensionStore } from '@/store/usePensionStore';
import { NumberPopIn } from '@/components/motion';

interface RetirementRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTool?: (toolId: string) => void;
}

const CHECKLIST_STORAGE_KEY = 'pensionlab_roadmap_checklist_v1';

export default function RetirementRoadmapModal({
  isOpen,
  onClose,
  onOpenTool,
}: RetirementRoadmapModalProps) {
  const store = usePensionStore();
  const params = store.simulationParams;

  const currentAge = params?.currentAge || 45;
  const retireAge = params?.retirementAge || 60;
  const npsStartAge = params?.nationalPensionStartAge || 65;
  const spouseAge = params?.spouseAge || 43;

  // 체크리스트 저장 상태 관리 (localStorage)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('MILESTONE_CURRENT');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (saved) {
          setCheckedItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load roadmap checklist from localStorage', e);
      }
    }
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save checklist', e);
      }
      return next;
    });
  };

  const milestones: RoadmapMilestone[] = useMemo(() => {
    return generateRetirementRoadmap({
      currentAge,
      retireAge,
      npsStartAge,
      spouseAge,
    });
  }, [currentAge, retireAge, npsStartAge, spouseAge]);

  // 전체 체크리스트 달성률 계산
  const totalTasks = useMemo(() => {
    return milestones.reduce((sum, m) => sum + m.actionItems.length, 0);
  }, [milestones]);

  const completedTasks = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  const progressPercent = Math.min(100, Math.round((completedTasks / (totalTasks || 1)) * 100));

  const activeMilestone = useMemo(() => {
    return milestones.find((m) => m.id === selectedMilestoneId) || milestones[0];
  }, [milestones, selectedMilestoneId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 text-xl border border-indigo-500/30">
              🧭
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  은퇴 생애 D-Day 타임라인 & 실행 체크리스트
                </h2>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                  Sprint 42 신규
                </span>
              </div>
              <p className="text-xs text-slate-400">
                내 나이({currentAge}세)부터 80세 초고령기까지 연령대별 필수 실행 과제와 D-Day 로드맵
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 진행률 상단 대시보드 바 */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">은퇴 D-Day</div>
              <div className="text-sm font-bold text-rose-400">
                {retireAge - currentAge > 0 ? `D-${retireAge - currentAge}년 (${retireAge}세)` : '은퇴 도달'}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">국민연금 개시</div>
              <div className="text-sm font-bold text-blue-400">
                {npsStartAge - currentAge > 0 ? `D-${npsStartAge - currentAge}년 (${npsStartAge}세)` : '수령 중'}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">체크리스트 달성도</div>
              <div className="text-sm font-bold text-emerald-400">
                {completedTasks}/{totalTasks}개 완료 ({progressPercent}%)
              </div>
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="flex-1 min-w-[160px] max-w-xs">
            <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 바디 (2열 레이아웃: 좌측 타임라인 마일스톤 리스트, 우측 액션 아이템 상세) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* 좌측: 타임라인 네비게이션 (5열) */}
          <div className="md:col-span-5 p-4 sm:p-5 space-y-3 bg-slate-900/60 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              생애 단계별 마일스톤 선택
            </div>
            <div className="relative pl-4 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
              {milestones.map((m) => {
                const isSelected = m.id === selectedMilestoneId;
                const completedInMilestone = m.actionItems.filter((act) => checkedItems[act.id]).length;
                const isAllDone = completedInMilestone === m.actionItems.length;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMilestoneId(m.id)}
                    className={`relative w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/70 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    {/* 타임라인 불릿 점 */}
                    <span
                      className={`absolute -left-[1.35rem] top-4 h-3.5 w-3.5 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'bg-indigo-500 border-white scale-125 ring-4 ring-indigo-500/20'
                          : isAllDone
                          ? 'bg-emerald-500 border-slate-900'
                          : 'bg-slate-600 border-slate-900'
                      }`}
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${m.badgeColor}`}>
                          {m.badgeText}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{m.age}세</span>
                      </div>
                      <div className="text-xs font-medium text-slate-300 mt-1 line-clamp-1">
                        {m.title}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[11px] font-semibold ${
                          isAllDone ? 'text-emerald-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {completedInMilestone}/{m.actionItems.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우측: 선택된 마일스톤 상세 체크리스트 (7열) */}
          <div className="md:col-span-7 p-4 sm:p-6 space-y-5 bg-slate-900 overflow-y-auto">
            {activeMilestone && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${activeMilestone.badgeColor}`}>
                      {activeMilestone.badgeText}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {activeMilestone.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
                    💡 {activeMilestone.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      필수 행동 체크리스트 ({activeMilestone.actionItems.filter((act) => checkedItems[act.id]).length}/
                      {activeMilestone.actionItems.length})
                    </span>
                    <span className="text-[11px] text-slate-400">체크 시 자동 영구 저장</span>
                  </div>

                  <div className="space-y-2.5">
                    {activeMilestone.actionItems.map((item) => {
                      const isChecked = !!checkedItems[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={item.id}
                              checked={isChecked}
                              onChange={() => toggleCheck(item.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-400 focus:ring-offset-slate-900 cursor-pointer"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={item.id}
                                className={`text-xs sm:text-sm font-medium leading-snug cursor-pointer select-none ${
                                  isChecked ? 'line-through text-slate-400' : 'text-slate-200'
                                }`}
                              >
                                {item.isPrimary && (
                                  <span className="inline-block mr-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                                    핵심
                                  </span>
                                )}
                                {item.text}
                              </label>

                              {/* 관련 도구 바로가기 스마트 링크 */}
                              {item.relatedToolId && onOpenTool && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => onOpenTool(item.relatedToolId!)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                                  >
                                    <span>🔍 관련 분석 도구 실행하기</span>
                                    <span>→</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>※ 본 체크리스트는 대한민국 소득세법 및 2026 연금 개혁 룰셋에 기반하여 산출되었습니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
