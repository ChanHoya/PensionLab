'use client';

import React, { useState, useMemo } from 'react';
import { generateScenarios, RetirementScenario } from '@/services/scenarioComparisonService';
import { usePensionStore } from '@/store/usePensionStore';
import { NumberPopIn } from '@/components/motion';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScenarioComparisonModal({ isOpen, onClose }: ScenarioComparisonModalProps) {
  const store = usePensionStore();
  const params = store.simulationParams;

  const currentAge = params?.currentAge || 45;
  const retirementAge = params?.retirementAge || 60;
  const npsStartAge = params?.nationalPensionStartAge || 65;
  const monthlyExpense = params?.targetMonthlySpending || 300;
  const currentNetWorth = params?.nonPensionAssets || 40000;

  const scenarios: RetirementScenario[] = useMemo(() => {
    return generateScenarios({
      currentAge,
      retirementAge,
      npsStartAge,
      currentNetWorth,
      monthlyExpense,
    });
  }, [currentAge, retirementAge, npsStartAge, currentNetWorth, monthlyExpense]);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCENARIO_A');

  const applyScenario = (scenario: RetirementScenario) => {
    store.setSimulationParams({
      retirementAge: scenario.retirementAge,
      nationalPensionStartAge: scenario.npsStartAge,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 text-xl border border-purple-500/30">
              📊
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  복수 은퇴 시나리오 비교함 (A vs B vs C)
                </h2>
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/30">
                  Sprint 42 신규
                </span>
              </div>
              <p className="text-xs text-slate-400">
                조기 은퇴 vs 정년 완주 vs 연기연금 극대화 시나리오를 3열 Side-by-Side로 비교하고 원클릭 적용
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

        {/* 3열 카드 그리드 바디 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-500 shadow-xl shadow-purple-950/40 ring-2 ring-purple-500/30'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  {sc.isRecommended && (
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-indigo-500 text-[11px] font-bold text-white shadow">
                      현재 설정
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                        {sc.badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">{sc.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">{sc.tagline}</p>
                    </div>

                    <div className="space-y-2 py-3 border-y border-slate-700/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">월 예상 실수령액</span>
                        <span className="text-sm font-bold text-white">
                          <NumberPopIn value={sc.monthlyExpectedPension} formatter={(v) => `월 ${v}만원`} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">자산 고갈 예상 나이</span>
                        <span
                          className={`font-bold ${
                            sc.pensionDepletionAge ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {sc.pensionDepletionAge ? `${sc.pensionDepletionAge}세 경고` : '100세+ 종신 안심'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">생애 총 수령액 (추정)</span>
                        <span className="font-semibold text-slate-200">약 {sc.totalLifetimePension}억원</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">안전 런웨이 (현금버퍼)</span>
                        <span className="font-semibold text-indigo-300">{sc.runwayYears}년</span>
                      </div>
                    </div>

                    {/* 장단점 요약 */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                          <span>✓</span> 핵심 장점
                        </div>
                        <ul className="space-y-1 text-slate-300 pl-3 list-disc text-[11px]">
                          {sc.pros.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-1">
                        <div className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
                          <span>!</span> 주의 위험요인
                        </div>
                        <ul className="space-y-1 text-slate-400 pl-3 list-disc text-[11px]">
                          {sc.cons.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 하단 선택/적용 버튼 */}
                  <div className="mt-5 pt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyScenario(sc);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                          : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {sc.isRecommended ? '현재 설정 유지하기' : '이 시나리오로 대시보드 변경'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 종합 인사이트 박스 */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-bold text-white flex items-center gap-2">
              <span>💡</span> CFP 은퇴설계 전문가 의사결정 가이드
            </div>
            <p>
              • 조기 퇴직(B안)을 선택할 경우 국민연금 감액률(-6%/년)과 60대 소득 공백기 버퍼를 위해 최소 3~5년치
              생활비를 Bucket 1 현금성 자산으로 사전 확보해야 합니다.
            </p>
            <p>
              • 기대수명이 83세 이상으로 예상되거나 배우자 유족연금을 든든히 남겨주고 싶다면, 정년을 최대한 채우고 국민연금을 1~5년 연기하는 C안이 생애 총 실수령액 관점에서 압도적으로 유리합니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>※ 시나리오 선택 시 대시보드의 은퇴 나이 및 국민연금 개시 연령이 즉시 자동 반영됩니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
