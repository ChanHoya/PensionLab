'use client';

import React, { useEffect, useState } from 'react';

interface AiThinkingStreamProps {
  onComplete?: () => void;
}

const STEPS = [
  { id: 1, title: '3층 연금 구조 분석', desc: '국민·퇴직·개인연금 및 부부 가구 생애 수령액 산출 중...' },
  { id: 2, title: '지출 곡선 및 소득 충분성 평가', desc: '초기 활동기 집중 지출 대비 현금흐름 밸런스 검증 중...' },
  { id: 3, title: '세제 및 건강보험료 최적화', desc: '사적연금 1,500만 한도 및 피부양자 자격 방어 시뮬레이션 중...' },
  { id: 4, title: 'Gemini 3.8 Flash 종합 처방 도출', desc: 'CFP 전문가 관점 5대 지표 채점 및 실행 로드맵 생성 중...' },
];

export const AiThinkingStream: React.FC<AiThinkingStreamProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 92) return prev + Math.floor(Math.random() * 8) + 3;
        return prev;
      });
    }, 400);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div
      className="glass-card t-modal-spring"
      style={{
        margin: '24px 0',
        padding: '28px 32px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(22, 23, 40, 0.95) 0%, rgba(15, 17, 39, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
      }}
    >
      {/* 헤더: 로고 및 타이틀 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
            }}
          >
            <span style={{ fontSize: '1.25rem', animation: 'spin 3s linear infinite' }}>🔮</span>
          </div>
          <div>
            <h4
              className="t-shimmer-text"
              style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Gemini 3.8 Flash 심층 연금 포트폴리오 분석 중
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              transitions.dev Reasoning Stream 인터랙티브 시뮬레이션
            </span>
          </div>
        </div>

        {/* 진행률 뱃지 */}
        <div
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#a5b4fc',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
          <span>{Math.min(progress, 99)}% 분석 완료</span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: `${Math.min(progress, 99)}%`,
            height: '100%',
            background: 'var(--gradient-brand)',
            borderRadius: '9999px',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.8)',
          }}
        />
      </div>

      {/* 4단계 추론 스트림 단계 표시 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step.id}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: isCurrent
                  ? 'rgba(99, 102, 241, 0.14)'
                  : isDone
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: isCurrent
                  ? '1px solid rgba(99, 102, 241, 0.5)'
                  : isDone
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isCurrent ? '#a5b4fc' : isDone ? '#34d399' : 'var(--text-muted)',
                  }}
                >
                  STEP 0{step.id}
                </span>
                {isDone ? (
                  <span className="t-success-check" style={{ color: '#10b981', fontSize: '0.85rem' }}>✓</span>
                ) : isCurrent ? (
                  <span style={{ fontSize: '0.75rem', color: '#6366f1', animation: 'pulse 1.2s infinite' }}>● 진행중</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>대기</span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: isCurrent ? 'var(--text-primary)' : isDone ? '#e2e8f0' : 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
