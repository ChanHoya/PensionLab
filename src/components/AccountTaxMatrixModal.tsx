// 2026 절세 계좌 4총사(ISA·연금저축·IRP·일반) 자산배분 매트릭스 모달 컴포넌트
'use client';

import React, { useState } from 'react';
import {
  getAccountTaxRules,
  getAssetClassGuides,
  AccountTaxRule,
  AssetClassTaxGuide,
} from '@/services/accountTaxMatrixService';

interface AccountTaxMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountTaxMatrixModal({ isOpen, onClose }: AccountTaxMatrixModalProps) {
  const [activeTab, setActiveTab] = useState<'ASSET_GUIDE' | 'ACCOUNT_RULES'>('ASSET_GUIDE');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ASSET_US_DIVIDEND');

  const assetGuides = getAssetClassGuides();
  const accountRules = getAccountTaxRules();

  const selectedAsset = assetGuides.find((a) => a.id === selectedAssetId) || assetGuides[0];

  if (!isOpen) return null;

  const assetIcons: Record<string, string> = {
    ASSET_US_DIVIDEND: '💵',
    ASSET_US_INDEX: '📈',
    ASSET_TDF_BOND: '🎯',
    ASSET_KR_STOCK: '🇰🇷',
  };

  const accountBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
    '중개형 ISA': { bg: 'rgba(13, 148, 136, 0.12)', text: '#0d9488', border: 'rgba(13, 148, 136, 0.3)' },
    '연금저축펀드': { bg: 'rgba(59, 130, 246, 0.12)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.3)' },
    '개인형 IRP': { bg: 'rgba(147, 51, 234, 0.12)', text: '#7c3aed', border: 'rgba(147, 51, 234, 0.3)' },
    '일반 위탁계좌': { bg: 'rgba(100, 116, 139, 0.12)', text: '#475569', border: 'rgba(100, 116, 139, 0.3)' },
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
          maxWidth: '960px',
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
        {/* 모달 상단 헤더 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%)',
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
                background: 'linear-gradient(135deg, #0d9488, #0284c7)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 6px 16px rgba(13, 148, 136, 0.3)',
                flexShrink: 0,
              }}
            >
              📑
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary, #0f172a)' }}>
                  2026 절세 계좌 4총사(ISA·연금저축·IRP·일반) 자산배분 매트릭스
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(13, 148, 136, 0.12)',
                    color: '#0d9488',
                    border: '1px solid rgba(13, 148, 136, 0.3)',
                  }}
                >
                  Sprint 42 신규
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', margin: '4px 0 0 0' }}>
                어떤 자산(미국배당/지수/채권/국내주식)을 어느 계좌에 담아야 세후 복리가 극대화되는지 명쾌한 가이드
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
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--surface-2, #f8fafc)',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setActiveTab('ASSET_GUIDE')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'ASSET_GUIDE' ? '1px solid #0d9488' : '1px solid var(--border, #e2e8f0)',
              background: activeTab === 'ASSET_GUIDE' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'var(--surface, #ffffff)',
              color: activeTab === 'ASSET_GUIDE' ? '#ffffff' : 'var(--text-secondary, #64748b)',
              boxShadow: activeTab === 'ASSET_GUIDE' ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🎯 자산군별 최적 계좌 추천 (어디에 담을까?)
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNT_RULES')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'ACCOUNT_RULES' ? '1px solid #0d9488' : '1px solid var(--border, #e2e8f0)',
              background: activeTab === 'ACCOUNT_RULES' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'var(--surface, #ffffff)',
              color: activeTab === 'ACCOUNT_RULES' ? '#ffffff' : 'var(--text-secondary, #64748b)',
              boxShadow: activeTab === 'ACCOUNT_RULES' ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            📋 계좌 4총사 세제 룰 한눈에 비교표
          </button>
        </div>

        {/* 바디 콘텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'ASSET_GUIDE' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 4대 자산군 선택 카드 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {assetGuides.map((asset) => {
                  const isSelected = asset.id === selectedAssetId;
                  const badgeStyle = accountBadgeColors[asset.bestAccountName] || {
                    bg: 'rgba(13, 148, 136, 0.12)',
                    text: '#0d9488',
                    border: 'rgba(13, 148, 136, 0.3)',
                  };

                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: isSelected ? '2px solid #0d9488' : '1px solid var(--border, #e2e8f0)',
                        backgroundColor: isSelected ? 'var(--surface-2, #f0fdfa)' : 'var(--surface, #ffffff)',
                        boxShadow: isSelected
                          ? '0 8px 20px rgba(13, 148, 136, 0.18)'
                          : '0 2px 6px rgba(0, 0, 0, 0.04)',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{assetIcons[asset.id] || '📌'}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0d9488' }}>
                          {asset.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginBottom: '8px', lineHeight: 1.3 }}>
                        {asset.assetName}
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.text,
                          border: `1px solid ${badgeStyle.border}`,
                        }}
                      >
                        권장: {asset.bestAccountName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 자산 상세 분석 패널 */}
              {selectedAsset && (
                <div
                  style={{
                    borderRadius: '16px',
                    border: '1.5px solid rgba(13, 148, 136, 0.3)',
                    background: 'linear-gradient(180deg, rgba(13, 148, 136, 0.04) 0%, var(--surface, #ffffff) 100%)',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    boxShadow: '0 4px 16px rgba(13, 148, 136, 0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingBottom: '14px',
                      borderBottom: '1px solid var(--border, #e2e8f0)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase' }}>
                        {selectedAsset.category}
                      </span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '2px 0 0 0' }}>
                        {selectedAsset.assetName}
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>최적 추천 계좌</div>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#0d9488',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <span>🏆</span>
                        <span>{selectedAsset.bestAccountName}</span>
                      </div>
                    </div>
                  </div>

                  {/* 세후 실질 수익률 비교 카드 (일반 vs 최적 계좌) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {/* 일반 위탁계좌 */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--surface-2, #f8fafc)',
                        border: '1px solid var(--border, #e2e8f0)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                        일반 위탁계좌에 담았을 때 (세금 즉시 차감)
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)' }}>
                        연 {selectedAsset.afterTaxReturnGeneral}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#e11d48', fontWeight: 600, lineHeight: 1.4 }}>
                        ⚠️ 배당세 15.4% 매년 차감 + 금융소득 1,000만 초과 시 건보료 부과 위험
                      </div>
                    </div>

                    {/* 추천 계좌 (절세 극대화) */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(13, 148, 136, 0.08)',
                        border: '1.5px solid rgba(13, 148, 136, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: '#0d9488', fontWeight: 700 }}>
                        {selectedAsset.bestAccountName}에 담았을 때 (절세 극대화)
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0d9488' }}>
                        연 {selectedAsset.afterTaxReturnBest}%
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, lineHeight: 1.4 }}>
                        ✨ {selectedAsset.differenceNote}
                      </div>
                    </div>
                  </div>

                  {/* 선정 사유 전문 설명 콜아웃 박스 */}
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary, #0f172a)',
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#d97706', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💡</span> 왜 이 계좌에 담아야 할까요?
                    </div>
                    {selectedAsset.reason}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 계좌 4총사 세제 룰 한눈에 비교표 */
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid var(--border, #e2e8f0)',
                overflowX: 'auto',
                backgroundColor: 'var(--surface, #ffffff)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-2, #f8fafc)', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary, #475569)', fontWeight: 700, minWidth: '120px' }}>
                      비교 항목
                    </th>
                    {accountRules.map((r) => (
                      <th key={r.id} style={{ padding: '12px 16px', minWidth: '170px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', fontSize: '0.9rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 600, marginTop: '2px' }}>{r.badge}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '연간 납입한도', key: 'annualLimit', bold: true },
                    { label: '납입 시 세액공제', key: 'taxBenefitNow' },
                    { label: '매매차익 과세', key: 'tradingTax' },
                    { label: '배당/분배금 과세', key: 'dividendTax' },
                    { label: '건강보험료 합산', key: 'healthInsuranceImpact' },
                    { label: '의무 요건', key: 'mandatoryPeriod' },
                    { label: '최적 적합 자산', key: 'recommendationAsset', highlight: true },
                  ].map((row, idx) => (
                    <tr
                      key={row.label}
                      style={{
                        borderBottom: '1px solid var(--border, #e2e8f0)',
                        backgroundColor: row.highlight
                          ? 'rgba(13, 148, 136, 0.06)'
                          : idx % 2 === 1
                          ? 'var(--surface-2, #f8fafc)'
                          : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: row.highlight ? '#0d9488' : 'var(--text-secondary, #475569)' }}>
                        {row.label}
                      </td>
                      {accountRules.map((r) => {
                        const val = (r as any)[row.key];
                        return (
                          <td
                            key={r.id}
                            style={{
                              padding: '12px 16px',
                              fontWeight: row.bold || row.highlight ? 700 : 500,
                              color: row.highlight ? '#0d9488' : 'var(--text-primary, #0f172a)',
                            }}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 모달 하단 푸터 */}
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
            ※ 2026년 정부 세법 개정안(금융투자소득세 폐지 및 ISA 혜택 확대 기준) 반영
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
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
