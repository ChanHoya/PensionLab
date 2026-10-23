// 개인연금(IRP/연금저축) 금융사 갈아타기 실익 분석기 모달 컴포넌트
'use client';

import React, { useState, useMemo } from 'react';
import {
  calculatePensionTransferBenefit,
  PensionTransferInput,
} from '../services/pensionTransferCalculator';
import { NumberPopIn } from '@/components/motion';
import GlossaryTooltip from './GlossaryTooltip';
import {
  ArrowRightLeft,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Building2,
  X,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface PensionTransferBenefitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number; // 만원 단위
  initialMonthly?: number; // 만원 단위
}

export default function PensionTransferBenefitModal({
  isOpen,
  onClose,
  initialBalance = 3000,
  initialMonthly = 30,
}: PensionTransferBenefitModalProps) {
  const [inputs, setInputs] = useState<PensionTransferInput>({
    currentBalance: initialBalance,
    monthlyContribution: initialMonthly,
    holdingYears: 15,
    receivingYears: 20,
    currentReturnRate: 2.2,
    currentFeeRate: 1.1,
    newReturnRate: 6.5,
    newFeeRate: 0.3,
  });

  const result = useMemo(() => {
    return calculatePensionTransferBenefit(inputs);
  }, [inputs]);

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
          maxWidth: '980px',
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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 148, 136, 0.04) 100%)',
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
                background: 'linear-gradient(135deg, #10b981, #0d9488)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                flexShrink: 0,
              }}
            >
              🔄
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary, #0f172a)' }}>
                  개인연금(IRP/연금저축) 금융사 갈아타기 실익 분석기
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  세금 0원 원스톱 승계
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', margin: '4px 0 0 0' }}>
                과거 가입한 저수익 연금신탁·보험을 증권사 우량 ETF/TDF로 이전할 때의 복리 자산 격차
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

        {/* 바디 콘텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 상단 핵심 효과 배너 */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(13, 148, 136, 0.04) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Expected Asset Surplus
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                  ({inputs.holdingYears}년 후 만기 시점)
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)' }}>
                갈아타기 시 은퇴 자산{' '}
                <span style={{ color: '#059669' }}>
                  +<NumberPopIn value={result.assetGap} formatter={(v) => `${v.toLocaleString()}만원`} />
                </span>{' '}
                추가 확보
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #475569)', margin: '2px 0 0 0' }}>
                수수료는 낮추고 복리 수익률은 높여 자산이 약 <strong style={{ color: '#059669' }}>{result.growthMultiplier}배</strong>로 증식됩니다.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'var(--surface, #ffffff)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border, #e2e8f0)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ textAlign: 'right', borderRight: '1px solid var(--border, #e2e8f0)', paddingRight: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>은퇴 후 20년 월 수령액</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                  +<NumberPopIn value={result.monthlyPensionGap} formatter={(v) => `${v.toLocaleString()}만원/월`} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
                  기존 월 {result.currentMonthlyPension.toLocaleString()}만원 대비
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>아끼는 총 수수료</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0d9488' }}>
                  약 {result.totalFeeSaved.toLocaleString()}만원
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>불필요한 보수 절감</div>
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
            {/* 현재 연금 적립금 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '8px', minHeight: '24px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  현재 연금 적립금
                  <GlossaryTooltip termId="PENSION_ACCOUNT_TRANSFER" iconOnly />
                </span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}>
                  {inputs.currentBalance.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={inputs.currentBalance}
                onChange={(e) => setInputs({ ...inputs, currentBalance: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                <span>500만원</span>
                <span>1억원</span>
                <span>2억원</span>
              </div>
            </div>

            {/* 월 추가 납입액 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '8px', minHeight: '24px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', whiteSpace: 'nowrap' }}>월 추가 납입액</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}>
                  {inputs.monthlyContribution.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={inputs.monthlyContribution}
                onChange={(e) => setInputs({ ...inputs, monthlyContribution: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                <span>0원</span>
                <span>50만원</span>
                <span>150만원</span>
              </div>
            </div>

            {/* 잔여 운용 기간 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '8px', minHeight: '24px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', whiteSpace: 'nowrap' }}>잔여 운용 기간</span>
                <span style={{ fontWeight: 800, color: '#0d9488', whiteSpace: 'nowrap' }}>
                  {inputs.holdingYears}년
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={inputs.holdingYears}
                onChange={(e) => setInputs({ ...inputs, holdingYears: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#0d9488', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                <span>3년</span>
                <span>15년</span>
                <span>30년</span>
              </div>
            </div>

            {/* 목표 수익률 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '8px', minHeight: '24px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', whiteSpace: 'nowrap' }}>새 금융사 목표 수익률</span>
                <span style={{ fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                  연 {inputs.newReturnRate}%
                </span>
              </div>
              <input
                type="range"
                min={3.0}
                max={10.0}
                step={0.5}
                value={inputs.newReturnRate}
                onChange={(e) => setInputs({ ...inputs, newReturnRate: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                <span>3.0%(안정)</span>
                <span>6.5%(배당/TDF)</span>
                <span>10.0%(지수)</span>
              </div>
            </div>
          </div>

          {/* 전후 비교 카드 2종 (Before vs After) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Before: 기존 유지 */}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 style={{ width: '16px', height: '16px', color: 'var(--text-muted, #64748b)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-secondary, #475569)' }}>
                    현재 유지 (은행 신탁 / 보험사)
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--border, #e2e8f0)', color: 'var(--text-muted, #64748b)' }}>
                  기존 유지
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>연간 수익률 - 수수료</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    {inputs.currentReturnRate}% - {inputs.currentFeeRate}% = 순 {(inputs.currentReturnRate - inputs.currentFeeRate).toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>{inputs.holdingYears}년 후 예상 적립액</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)' }}>
                    {result.currentFinalBalance.toLocaleString()}만원
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>은퇴 후 월 예상 연금</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    월 {result.currentMonthlyPension.toLocaleString()}만원
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(244, 63, 94, 0.06)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  fontSize: '0.75rem',
                  color: '#e11d48',
                  lineHeight: 1.4,
                  marginTop: 'auto',
                }}
              >
                ⚠️ 원리금보장형에 묶여있어 물가상승률(2~3%)에 미치지 못해 실질 화폐가치가 잠식될 위험이 있습니다.
              </div>
            </div>

            {/* After: 증권사 이전 */}
            <div
              style={{
                padding: '18px',
                borderRadius: '14px',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp style={{ width: '16px', height: '16px', color: '#059669' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>
                    증권사 계좌이체 (글로벌 ETF/TDF)
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#047857' }}>
                  추천 전략
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>연간 수익률 - 수수료</span>
                  <span style={{ fontWeight: 800, color: '#059669' }}>
                    {inputs.newReturnRate}% - {inputs.newFeeRate}% = 순 {(inputs.newReturnRate - inputs.newFeeRate).toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>{inputs.holdingYears}년 후 예상 적립액</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                    {result.newFinalBalance.toLocaleString()}만원
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>은퇴 후 월 예상 연금</span>
                  <span style={{ fontWeight: 800, color: '#059669' }}>
                    월 {result.newMonthlyPension.toLocaleString()}만원 (+{result.monthlyPensionGap.toLocaleString()}만원)
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.75rem',
                  color: '#047857',
                  lineHeight: 1.4,
                  marginTop: 'auto',
                }}
              >
                ✨ 미국배당다우존스, S&P500, TDF 등으로 전 세계 우량 자산의 장기 복리 성장 효과를 온전히 누립니다.
              </div>
            </div>
          </div>

          {/* 차트 시각화 패널 */}
          <div
            style={{
              padding: '18px',
              borderRadius: '14px',
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                연도별 복리 자산 축적 시뮬레이션 (만원 단위)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                ● 녹색 선이 증권사 계좌이체 시 성장 경로
              </span>
            </div>
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearlyTrajectory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
                  <XAxis dataKey="year" stroke="var(--text-muted, #94a3b8)" fontSize={11} tickFormatter={(v) => `${v}년`} />
                  <YAxis stroke="var(--text-muted, #94a3b8)" fontSize={11} tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface, #ffffff)',
                      borderColor: 'var(--border, #e2e8f0)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                      color: 'var(--text-primary, #0f172a)',
                    }}
                    formatter={(val: any) => [`${Number(val || 0).toLocaleString()} 만원`, '']}
                    labelFormatter={(label) => `${label}년 후`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Line type="monotone" dataKey="currentBalance" name="기존 유지 (은행/보험)" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="newBalance" name="증권사 갈아타기 (ETF/TDF)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="totalContributions" name="원금 누적" stroke="#64748b" strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3단계 간편 이전 가이드 */}
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
              <ArrowRightLeft style={{ width: '16px', height: '16px', color: '#059669' }} />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                방문 없이 모바일 앱으로 3분 만에 끝내는 '원스톱 계좌이체' 3단계
              </h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {result.transferGuideSteps.map((step) => (
                <div
                  key={step.step}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface, #ffffff)',
                    border: '1px solid var(--border, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#059669',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {step.step}
                      </span>
                      <h5 style={{ fontSize: '0.82rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                        {step.title}
                      </h5>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.45 }}>
                      {step.description}
                    </p>
                  </div>
                  {step.tip && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        fontSize: '0.72rem',
                        color: '#047857',
                        fontWeight: 600,
                      }}
                    >
                      💡 {step.tip}
                    </div>
                  )}
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
            <span>수익률은 예시이며, 실제 투자 성과 및 세부 해약환급금은 금융사별로 상이합니다.</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
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
