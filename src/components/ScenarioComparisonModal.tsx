// 복수 은퇴 시나리오(A vs B vs C) 비교함 모달 컴포넌트
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

  const scenarioThemeConfig: Record<string, {
    primaryColor: string;
    bgTint: string;
    borderActive: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    buttonGradient: string;
    icon: string;
  }> = {
    SCENARIO_A: {
      primaryColor: '#6366f1',
      bgTint: 'rgba(99, 102, 241, 0.05)',
      borderActive: '#6366f1',
      badgeBg: 'rgba(99, 102, 241, 0.12)',
      badgeText: '#4f46e5',
      badgeBorder: 'rgba(99, 102, 241, 0.3)',
      buttonGradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      icon: '🏛️',
    },
    SCENARIO_B: {
      primaryColor: '#f97316',
      bgTint: 'rgba(249, 115, 22, 0.05)',
      borderActive: '#ea580c',
      badgeBg: 'rgba(249, 115, 22, 0.12)',
      badgeText: '#c2410c',
      badgeBorder: 'rgba(249, 115, 22, 0.3)',
      buttonGradient: 'linear-gradient(135deg, #f97316, #ea580c)',
      icon: '🔥',
    },
    SCENARIO_C: {
      primaryColor: '#10b981',
      bgTint: 'rgba(16, 185, 129, 0.05)',
      borderActive: '#059669',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      badgeText: '#047857',
      badgeBorder: 'rgba(16, 185, 129, 0.3)',
      buttonGradient: 'linear-gradient(135deg, #10b981, #059669)',
      icon: '👑',
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '20px',
          border: '1px solid var(--border, rgba(226, 232, 240, 0.8))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          color: 'var(--text-primary, #0f172a)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #9333ea, #6366f1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 6px 16px rgba(147, 51, 234, 0.3)',
                flexShrink: 0,
              }}
            >
              📊
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary, #0f172a)' }}>
                  복수 은퇴 시나리오 비교함 (A vs B vs C)
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(147, 51, 234, 0.12)',
                    color: '#9333ea',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                  }}
                >
                  Sprint 42 신규
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', margin: '4px 0 0 0' }}>
                조기 은퇴 vs 정년 완주 vs 연기연금 극대화 시나리오를 3열 Side-by-Side로 비교하고 원클릭 적용
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border, #e2e8f0)',
              backgroundColor: 'var(--surface-2, #f8fafc)',
              color: 'var(--text-muted, #64748b)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* 3열 카드 그리드 바디 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              const theme = scenarioThemeConfig[sc.id] || scenarioThemeConfig.SCENARIO_A;

              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? `2px solid ${theme.borderActive}` : '1px solid var(--border, #e2e8f0)',
                    backgroundColor: isSelected ? 'var(--surface, #ffffff)' : 'var(--surface-2, #f8fafc)',
                    boxShadow: isSelected
                      ? `0 12px 28px ${theme.primaryColor}25`
                      : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transform: isSelected ? 'translateY(-3px)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* 상단 배지 & 추천 마커 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeText,
                          border: `1px solid ${theme.badgeBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{theme.icon}</span>
                        <span>{sc.badge}</span>
                      </span>

                      {sc.isRecommended && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '20px',
                            backgroundColor: '#6366f1',
                            color: '#ffffff',
                            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          현재 설정
                        </span>
                      )}
                    </div>

                    {/* 시나리오 명칭 및 요약 */}
                    <div>
                      <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
                        {sc.name}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                        {sc.tagline}
                      </p>
                    </div>

                    {/* 핵심 지표 박스 */}
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--surface, #ffffff)',
                        border: '1px solid var(--border, #e2e8f0)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted, #64748b)' }}>월 예상 실수령액</span>
                        <span style={{ fontSize: '0.98rem', fontWeight: 900, color: theme.primaryColor }}>
                          <NumberPopIn value={sc.monthlyExpectedPension} formatter={(v) => `월 ${v}만원`} />
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted, #64748b)' }}>자산 고갈 예상 나이</span>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: sc.pensionDepletionAge ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: sc.pensionDepletionAge ? '#e11d48' : '#059669',
                            border: `1px solid ${sc.pensionDepletionAge ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          }}
                        >
                          {sc.pensionDepletionAge ? `${sc.pensionDepletionAge}세 경고` : '100세+ 종신 안심'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted, #64748b)' }}>생애 총 수령액 (추정)</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          약 {sc.totalLifetimePension}억원
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted, #64748b)' }}>안전 런웨이 (현금버퍼)</span>
                        <span style={{ fontWeight: 700, color: '#6366f1' }}>{sc.runwayYears}년</span>
                      </div>
                    </div>

                    {/* 장단점 요약 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <span>✓</span> 핵심 장점
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5 }}>
                          {sc.pros.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <span>⚠️</span> 주의 위험요인
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.5 }}>
                          {sc.cons.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 하단 선택/적용 버튼 */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border, #e2e8f0)' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyScenario(sc);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: 'none',
                        background: isSelected ? theme.buttonGradient : 'var(--surface, #ffffff)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary, #0f172a)',
                        boxShadow: isSelected ? `0 4px 14px ${theme.primaryColor}40` : '0 1px 3px rgba(0,0,0,0.08)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {sc.isRecommended ? '현재 설정 유지하기' : '이 시나리오로 대시보드 변경'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 종합 인사이트 박스 */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.82rem',
              color: 'var(--text-primary, #0f172a)',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontWeight: 800, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💡</span> CFP 은퇴설계 전문가 의사결정 가이드
            </div>
            <p style={{ margin: 0 }}>
              • 조기 퇴직(B안)을 선택할 경우 국민연금 감액률(-6%/년)과 60대 소득 공백기 버퍼를 위해 최소 3~5년치 생활비를 Bucket 1 현금성 자산으로 사전 확보해야 합니다.
            </p>
            <p style={{ margin: 0 }}>
              • 기대수명이 83세 이상으로 예상되거나 배우자 유족연금을 든든히 남겨주고 싶다면, 정년을 최대한 채우고 국민연금을 1~5년 연기하는 C안이 생애 총 실수령액 관점에서 압도적으로 유리합니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--surface-2, #f8fafc)',
            borderTop: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
            ※ 시나리오 선택 시 대시보드의 은퇴 나이 및 국민연금 개시 연령이 즉시 자동 반영됩니다.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
