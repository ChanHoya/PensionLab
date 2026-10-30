// 은퇴자 맞춤 3-Bucket 현금 버퍼 플래너 모달 컴포넌트
'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateThreeBucketPlan,
  ThreeBucketInput,
} from '../services/threeBucketCalculator';
import { NumberPopIn } from '@/components/motion';
import GlossaryTooltip from './GlossaryTooltip';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  RefreshCw,
  X,
  Info,
} from 'lucide-react';

interface ThreeBucketPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTotalAssets?: number; // 만원 단위
  initialTargetSpending?: number; // 만원 단위
  initialPension?: number; // 만원 단위
}

export default function ThreeBucketPlanModal({
  isOpen,
  onClose,
  initialTotalAssets = 40000,
  initialTargetSpending = 300,
  initialPension = 120,
}: ThreeBucketPlanModalProps) {
  const [inputs, setInputs] = useState<ThreeBucketInput>({
    totalRetirementAssets: initialTotalAssets,
    targetMonthlySpending: initialTargetSpending,
    guaranteedMonthlyPension: initialPension,
    bucket1Years: 2,
    bucket2Years: 5,
    bucket1ReturnRate: 2.5,
    bucket2ReturnRate: 5.5,
    bucket3ReturnRate: 8.0,
  });

  const result = useMemo(() => {
    return calculateThreeBucketPlan(inputs);
  }, [inputs]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="t-modal-spring modal-container"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}
            >
              🪣
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  은퇴자 맞춤 3-Bucket 현금 버퍼 플래너
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(6, 182, 212, 0.12)',
                    color: '#0891b2',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                  }}
                >
                  폭락장 방패 설계
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                주식 시장이 30% 폭락해도 생활비를 헐값에 매도하지 않고 안전하게 인출하는 자산 배분 전략
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close-button"
            title="닫기"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 바디 콘텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 상단 안전 런웨이 방패 배너 */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
              border: '1.5px solid rgba(6, 182, 212, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 16px rgba(6, 182, 212, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  color: '#0891b2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck style={{ width: '28px', height: '28px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Safety Runway
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                    (시장 폭락 시 주식 매도 0원 방어 기간)
                  </span>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)' }}>
                  최대 <span style={{ color: '#0891b2' }}>{result.safeRunwayYears}년 동안</span> 주식을 안 팔고 생활비를 씁니다
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #475569)', margin: '2px 0 0 0' }}>
                  {result.crisisDefenseScenario}
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface, #ffffff)',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border, #e2e8f0)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                textAlign: 'right',
                minWidth: '180px',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>연간 총 예상 배당·이자</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                <NumberPopIn value={result.overallAnnualIncome} formatter={(v) => `+${v.toLocaleString()}만원/년`} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                월 약 {Math.round(result.overallAnnualIncome / 12).toLocaleString()}만원 인컴
              </div>
            </div>
          </div>

          {/* 슬라이더 컨트롤 패널 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              backgroundColor: 'var(--surface-2, #f8fafc)',
              padding: '18px',
              borderRadius: '14px',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            {/* 총 은퇴 준비 자산 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '8px', minHeight: '24px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  총 은퇴 준비 자산
                  <GlossaryTooltip termId="PENSION_ACCOUNT_TRANSFER" iconOnly />
                </span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}>
                  {inputs.totalRetirementAssets.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={150000}
                step={2000}
                value={inputs.totalRetirementAssets}
                onChange={(e) => setInputs({ ...inputs, totalRetirementAssets: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                <span>1억원</span>
                <span>7억원</span>
                <span>15억원</span>
              </div>
            </div>

            {/* 월 목표 은퇴 생활비 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '8px', minHeight: '24px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', whiteSpace: 'nowrap' }}>월 목표 은퇴 생활비</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}>
                  {inputs.targetMonthlySpending.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={150}
                max={800}
                step={20}
                value={inputs.targetMonthlySpending}
                onChange={(e) => setInputs({ ...inputs, targetMonthlySpending: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                <span>150만원</span>
                <span>400만원</span>
                <span>800만원</span>
              </div>
            </div>

            {/* 확정 공적연금 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '8px', minHeight: '24px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  확정 공적연금(국민/기초)
                  <GlossaryTooltip termId="NPS_BEP" iconOnly />
                </span>
                <span style={{ fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                  {inputs.guaranteedMonthlyPension.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={10}
                value={inputs.guaranteedMonthlyPension}
                onChange={(e) => setInputs({ ...inputs, guaranteedMonthlyPension: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                <span>0원</span>
                <span>150만원</span>
                <span>300만원</span>
              </div>
            </div>
          </div>

          {/* 포트폴리오 자산 배분 비중 바 */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                포트폴리오 자산 배분 비중 (전체 가중수익률: {result.overallExpectedReturnRate.toFixed(2)}%/년)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                순 인출 필요액: 월 {result.monthlyNetDeficit}만원 (연 {(result.annualNetDeficit || result.monthlyNetDeficit * 12).toLocaleString()}만원)
              </span>
            </div>

            <div style={{ width: '100%', height: '14px', backgroundColor: 'var(--border, #e2e8f0)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${result.buckets.bucket1.percentage}%`, backgroundColor: '#06b6d4', transition: 'width 0.3s ease' }} title={`Bucket 1: ${result.buckets.bucket1.percentage}%`} />
              <div style={{ width: `${result.buckets.bucket2.percentage}%`, backgroundColor: '#6366f1', transition: 'width 0.3s ease' }} title={`Bucket 2: ${result.buckets.bucket2.percentage}%`} />
              <div style={{ width: `${result.buckets.bucket3.percentage}%`, backgroundColor: '#10b981', transition: 'width 0.3s ease' }} title={`Bucket 3: ${result.buckets.bucket3.percentage}%`} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4' }} />
                Bucket 1: 단기 안심 현금 ({result.buckets.bucket1.percentage}%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
                Bucket 2: 중기 인컴·배당 ({result.buckets.bucket2.percentage}%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Bucket 3: 장기 복리 성장 ({result.buckets.bucket3.percentage}%)
              </span>
            </div>
          </div>

          {/* 3대 버킷 카드 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {/* Bucket 1 */}
            <div
              style={{
                borderRadius: '16px',
                padding: '20px',
                backgroundColor: 'rgba(6, 182, 212, 0.04)',
                border: '1.5px solid rgba(6, 182, 212, 0.3)',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#0891b2' }}>
                    {result.buckets.bucket1.horizonYears}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
                    수익률 연 {result.buckets.bucket1.expectedReturnRate}%
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️</span>
                  <span>{result.buckets.bucket1.name}</span>
                </h3>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0891b2' }}>
                    <NumberPopIn value={result.buckets.bucket1.allocatedAmount} formatter={(v) => `${v.toLocaleString()}만원`} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                    연간 예상 이자: 약 {result.buckets.bucket1.annualExpectedIncome.toLocaleString()}만원
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.45, margin: 0 }}>
                  {result.buckets.bucket1.roleDescription}
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                  추천 포트폴리오
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.buckets.bucket1.recommendedAssets.map((asset, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--surface, #ffffff)',
                        color: '#0891b2',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                      }}
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bucket 2 */}
            <div
              style={{
                borderRadius: '16px',
                padding: '20px',
                backgroundColor: 'rgba(99, 102, 241, 0.04)',
                border: '1.5px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#4f46e5' }}>
                    {result.buckets.bucket2.horizonYears}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
                    수익률 연 {result.buckets.bucket2.expectedReturnRate}%
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock style={{ width: '18px', height: '18px', color: '#6366f1' }} />
                  <span>{result.buckets.bucket2.name}</span>
                </h3>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4f46e5' }}>
                    <NumberPopIn value={result.buckets.bucket2.allocatedAmount} formatter={(v) => `${v.toLocaleString()}만원`} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                    연간 예상 배당·이자: 약 {result.buckets.bucket2.annualExpectedIncome.toLocaleString()}만원
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.45, margin: 0 }}>
                  {result.buckets.bucket2.roleDescription}
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                  추천 포트폴리오
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.buckets.bucket2.recommendedAssets.map((asset, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--surface, #ffffff)',
                        color: '#4f46e5',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bucket 3 */}
            <div
              style={{
                borderRadius: '16px',
                padding: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>
                    {result.buckets.bucket3.horizonYears}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
                    수익률 연 {result.buckets.bucket3.expectedReturnRate}%
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp style={{ width: '18px', height: '18px', color: '#10b981' }} />
                  <span>{result.buckets.bucket3.name}</span>
                </h3>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669' }}>
                    <NumberPopIn value={result.buckets.bucket3.allocatedAmount} formatter={(v) => `${v.toLocaleString()}만원`} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                    연간 예상 복리성장: 약 {result.buckets.bucket3.annualExpectedIncome.toLocaleString()}만원
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.45, margin: 0 }}>
                  {result.buckets.bucket3.roleDescription}
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                  추천 포트폴리오
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.buckets.bucket3.recommendedAssets.map((asset, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--surface, #ffffff)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3대 리밸런싱 행동 원칙 콜아웃 박스 */}
          <div
            style={{
              padding: '18px',
              borderRadius: '14px',
              backgroundColor: 'var(--surface-2, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw style={{ width: '16px', height: '16px', color: '#6366f1' }} />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                3-Bucket 성공을 위한 3대 리밸런싱 행동 원칙
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.rebalancingRules.map((rule, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary, #475569)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #e2e8f0)',
                    lineHeight: 1.45,
                  }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#4f46e5',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
            <Info style={{ width: '14px', height: '14px' }} />
            <span>수익률 및 배당률은 시장 상황과 선택 상품에 따라 변동될 수 있습니다.</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              backgroundColor: '#06b6d4',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
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
