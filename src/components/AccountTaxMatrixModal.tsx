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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 text-xl border border-teal-500/30">
              📑
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  2026 절세 계좌 4총사(ISA·연금저축·IRP·일반) 자산배분 매트릭스
                </h2>
                <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
                  Sprint 42 신규
                </span>
              </div>
              <p className="text-xs text-slate-400">
                어떤 자산(미국배당/지수/채권/국내주식)을 어느 계좌에 담아야 세후 복리가 극대화되는지 명쾌한 가이드
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

        {/* 탭 네비게이션 */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('ASSET_GUIDE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ASSET_GUIDE'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🎯 자산군별 최적 계좌 추천 (어디에 담을까?)
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNT_RULES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ACCOUNT_RULES'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📋 계좌 4총사 세제 룰 한눈에 비교표
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'ASSET_GUIDE' ? (
            <div className="space-y-6">
              {/* 자산군 선택 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {assetGuides.map((asset) => {
                  const isSelected = asset.id === selectedAssetId;
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-teal-950/50 border-teal-500 ring-2 ring-teal-500/30'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-[11px] text-teal-400 font-semibold">{asset.category}</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-1 line-clamp-1">
                        {asset.assetName}
                      </div>
                      <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/60 text-slate-300">
                        권장: {asset.bestAccountName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 자산 상세 추천 패널 */}
              {selectedAsset && (
                <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-b from-teal-950/20 to-slate-900 p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                        {selectedAsset.category}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                        {selectedAsset.assetName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">최적 추천 담는 바구니</div>
                      <div className="text-base sm:text-lg font-bold text-teal-300 flex items-center gap-1.5 justify-end">
                        <span>🏆</span>
                        <span>{selectedAsset.bestAccountName}</span>
                      </div>
                    </div>
                  </div>

                  {/* 세후 실질 수익률 비교 카드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                      <div className="text-xs text-slate-400">일반 위탁계좌에 담았을 때 (세금 즉시 차감)</div>
                      <div className="text-lg font-bold text-slate-300">
                        연 {selectedAsset.afterTaxReturnGeneral}%
                      </div>
                      <div className="text-[11px] text-rose-400">
                        배당세 15.4% 매년 차감 + 금융소득 1,000만 초과 시 건보료 부과 위험
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/50 space-y-1">
                      <div className="text-xs text-teal-300 font-semibold">
                        {selectedAsset.bestAccountName}에 담았을 때 (절세 극대화)
                      </div>
                      <div className="text-lg font-bold text-teal-300">
                        연 {selectedAsset.afterTaxReturnBest}%
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        {selectedAsset.differenceNote}
                      </div>
                    </div>
                  </div>

                  {/* 선정 사유 전문 설명 */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                      <span>💡</span> 왜 이 계좌에 담아야 할까요?
                    </div>
                    {selectedAsset.reason}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 계좌 4총사 세제 룰 한눈에 비교표 */
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-800 text-slate-200 uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 min-w-[120px]">비교 항목</th>
                    {accountRules.map((r) => (
                      <th key={r.id} className="px-4 py-3 min-w-[170px]">
                        <div className="text-white font-bold">{r.name}</div>
                        <div className="text-[10px] text-teal-400 font-normal">{r.badge}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-400">연간 납입한도</td>
                    {accountRules.map((r) => (
                      <td key={r.id} className="px-4 py-3 font-medium text-white">
                        {r.annualLimit}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-400">납입 시 세액공제</td>
                    {accountRules.map((r) => (
                      <td key={r.id} className="px-4 py-3 text-slate-300">
                        {r.taxBenefitNow}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-400">매매차익 과세</td>
                    {accountRules.map((r) => (
                      <td key={r.id} className="px-4 py-3 text-slate-300">
                        {r.tradingTax}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-400">배당/분배금 과세</td>
                    {accountRules.map((r) => (
                      <td key={r.id} className="px-4 py-3 text-slate-300">
                        {r.dividendTax}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-400">건강보험료 합산</td>
                    {accountRules.map((r) => (
                      <td key={r.id} className="px-4 py-3 text-slate-300 font-medium">
                        {r.healthInsuranceImpact}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-400">의무 요건</td>
                    {accountRules.map((r) => (
                      <td key={r.id} className="px-4 py-3 text-slate-400">
                        {r.mandatoryPeriod}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-800/40 bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-teal-400">최적 적합 자산</td>
                    {accountRules.map((r) => (
                      <td key={r.id} className="px-4 py-3 font-bold text-white">
                        {r.recommendationAsset}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>※ 2026년 정부 세법 개정안(금융투자소득세 폐지 및 ISA 혜택 확대 기준) 반영</span>
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
