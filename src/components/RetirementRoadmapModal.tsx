// 은퇴 생애 D-Day 타임라인 & 실행 체크리스트 모달 컴포넌트
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { generateRetirementRoadmap, RoadmapMilestone } from '@/services/retirementRoadmapService';
import { usePensionStore } from '@/store/usePensionStore';

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
          maxWidth: '1040px',
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
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.04) 100%)',
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
                background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
                flexShrink: 0,
              }}
            >
              🧭
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary, #0f172a)' }}>
                  은퇴 생애 D-Day 타임라인 & 실행 체크리스트
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: '#4f46e5',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  Sprint 42 신규
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', margin: '4px 0 0 0' }}>
                내 나이({currentAge}세)부터 80세 초고령기까지 연령대별 필수 실행 과제와 D-Day 로드맵
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

        {/* 진행률 상단 대시보드 바 */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--surface-2, #f8fafc)',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>은퇴 D-Day</span>
              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#e11d48' }}>
                {retireAge - currentAge > 0 ? `D-${retireAge - currentAge}년 (${retireAge}세)` : '은퇴 도달'}
              </span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border, #e2e8f0)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>국민연금 개시</span>
              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#4f46e5' }}>
                {npsStartAge - currentAge > 0 ? `D-${npsStartAge - currentAge}년 (${npsStartAge}세)` : '수령 중'}
              </span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border, #e2e8f0)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>체크리스트 달성도</span>
              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#059669' }}>
                {completedTasks}/{totalTasks}개 완료 ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div style={{ flex: 1, minWidth: '180px', maxWidth: '280px' }}>
            <div
              style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--border, #e2e8f0)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #6366f1, #0ea5e9, #10b981)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* 바디 (2열 레이아웃: 좌측 타임라인 마일스톤 리스트, 우측 액션 아이템 상세) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.5fr)' }}>
          {/* 좌측: 타임라인 네비게이션 */}
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--surface-2, #f8fafc)',
              borderRight: '1px solid var(--border, #e2e8f0)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              생애 단계별 마일스톤 선택
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {milestones.map((m) => {
                const isSelected = m.id === selectedMilestoneId;
                const completedInMilestone = m.actionItems.filter((act) => checkedItems[act.id]).length;
                const isAllDone = completedInMilestone === m.actionItems.length;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMilestoneId(m.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '2px solid #6366f1' : '1px solid var(--border, #e2e8f0)',
                      backgroundColor: isSelected ? 'var(--surface, #ffffff)' : 'transparent',
                      boxShadow: isSelected ? '0 4px 14px rgba(99, 102, 241, 0.15)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                            color: isSelected ? '#4f46e5' : 'var(--text-secondary, #475569)',
                          }}
                        >
                          {m.badgeText}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                          {m.age}세
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        {m.title}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '20px',
                        backgroundColor: isAllDone ? 'rgba(16, 185, 129, 0.12)' : 'var(--border, #e2e8f0)',
                        color: isAllDone ? '#059669' : 'var(--text-muted, #64748b)',
                        flexShrink: 0,
                      }}
                    >
                      {completedInMilestone}/{m.actionItems.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우측: 선택된 마일스톤 상세 체크리스트 */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {activeMilestone && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: '#4f46e5',
                      }}
                    >
                      {activeMilestone.badgeText} ({activeMilestone.age}세)
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
                      {activeMilestone.title}
                    </h3>
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary, #0f172a)',
                      lineHeight: 1.55,
                    }}
                  >
                    💡 {activeMilestone.description}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary, #475569)' }}>
                      필수 행동 체크리스트 ({activeMilestone.actionItems.filter((act) => checkedItems[act.id]).length}/
                      {activeMilestone.actionItems.length})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                      ✓ 체크 시 자동 영구 저장
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeMilestone.actionItems.map((item) => {
                      const isChecked = !!checkedItems[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: isChecked ? '1.5px solid #10b981' : '1px solid var(--border, #e2e8f0)',
                            backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.04)' : 'var(--surface-2, #f8fafc)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{
                              width: '18px',
                              height: '18px',
                              marginTop: '2px',
                              accentColor: '#10b981',
                              cursor: 'pointer',
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              {item.isPrimary && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                    color: '#4f46e5',
                                  }}
                                >
                                  핵심 과제
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: '0.88rem',
                                  fontWeight: 700,
                                  color: isChecked ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #0f172a)',
                                  textDecoration: isChecked ? 'line-through' : 'none',
                                  lineHeight: 1.45,
                                }}
                              >
                                {item.text}
                              </span>
                            </div>

                            {/* 관련 분석 도구 원클릭 실행 버튼 */}
                            {item.relatedToolId && onOpenTool && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTool(item.relatedToolId!);
                                  onClose();
                                }}
                                style={{
                                  marginTop: '8px',
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                                }}
                              >
                                <span>⚡ 관련 분석 도구 실행하기</span>
                                <span>→</span>
                              </button>
                            )}
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
            ※ 본 체크리스트는 대한민국 소득세법 및 2026 연금 개혁 룰셋에 기반하여 산출되었습니다.
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
