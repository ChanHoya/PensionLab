"use client";

import React, { useState, useMemo } from "react";
import {
  calculateThreeBucketPlan,
  ThreeBucketInput,
} from "../services/threeBucketCalculator";
import { NumberPopIn } from "@/components/motion";
import GlossaryTooltip from "./GlossaryTooltip";
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  Clock,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  X,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-indigo-950/40 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-xl">🪣</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  은퇴자 맞춤 3-Bucket 현금 버퍼 플래너
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30">
                  폭락장 방패 설계
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                주식 시장이 30% 폭락해도 생활비를 헐값에 매도하지 않고 안전하게 인출하는 자산 배분 전략
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Key Defense Banner */}
          <div className="p-4.5 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-800/80 to-blue-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-cyan-300 tracking-wider uppercase">
                    Safety Runway
                  </span>
                  <span className="text-xs text-slate-400">
                    (시장 폭락 시 주식 매도 0원 방어 기간)
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  최대{" "}
                  <span className="text-cyan-300 underline decoration-cyan-500/50 underline-offset-4">
                    {result.safeRunwayYears}년 동안
                  </span>{" "}
                  주식을 안 팔고 생활비를 씁니다
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {result.crisisDefenseScenario}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-slate-900/80 px-4 py-3 rounded-lg border border-slate-700/60">
              <div className="text-right">
                <div className="text-xs text-slate-400">연간 총 예상 배당·이자</div>
                <div className="text-lg font-bold text-emerald-400">
                  <NumberPopIn
                    value={result.overallAnnualIncome}
                    formatter={(v) => `+${v.toLocaleString()}만원/년`}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  월 약 {Math.round(result.overallAnnualIncome / 12).toLocaleString()}만원 인컴
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  총 은퇴 준비 자산
                  <GlossaryTooltip termId="PENSION_ACCOUNT_TRANSFER" />
                </span>
                <span className="font-bold text-white">
                  {(inputs.totalRetirementAssets).toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={150000}
                step={2000}
                value={inputs.totalRetirementAssets}
                onChange={(e) =>
                  setInputs({ ...inputs, totalRetirementAssets: Number(e.target.value) })
                }
                className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1억원</span>
                <span>7억원</span>
                <span>15억원</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium">월 목표 은퇴 생활비</span>
                <span className="font-bold text-white">
                  {inputs.targetMonthlySpending.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={150}
                max={800}
                step={20}
                value={inputs.targetMonthlySpending}
                onChange={(e) =>
                  setInputs({ ...inputs, targetMonthlySpending: Number(e.target.value) })
                }
                className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>150만원</span>
                <span>400만원</span>
                <span>800만원</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  확정 공적연금(국민/기초)
                  <GlossaryTooltip termId="NPS_BEP" />
                </span>
                <span className="font-bold text-emerald-400">
                  {inputs.guaranteedMonthlyPension.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={10}
                value={inputs.guaranteedMonthlyPension}
                onChange={(e) =>
                  setInputs({ ...inputs, guaranteedMonthlyPension: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0원</span>
                <span>150만원</span>
                <span>300만원</span>
              </div>
            </div>
          </div>

          {/* Allocation Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                포트폴리오 자산 배분 비중 (전체 가중수익률: {result.overallExpectedReturnRate}%/년)
              </span>
              <span className="text-slate-400 text-[11px]">
                순 인출 필요액: 월 {result.monthlyNetDeficit.toLocaleString()}만원 (연 {result.annualNetDeficit.toLocaleString()}만원)
              </span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-800 flex overflow-hidden p-0.5 gap-0.5 border border-slate-700">
              <div
                style={{ width: `${result.buckets.bucket1.percentage}%` }}
                className="bg-cyan-500 rounded-l-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-slate-950"
                title={`Bucket 1: ${result.buckets.bucket1.percentage}%`}
              >
                {result.buckets.bucket1.percentage >= 10 && `${result.buckets.bucket1.percentage}%`}
              </div>
              <div
                style={{ width: `${result.buckets.bucket2.percentage}%` }}
                className="bg-indigo-500 transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white"
                title={`Bucket 2: ${result.buckets.bucket2.percentage}%`}
              >
                {result.buckets.bucket2.percentage >= 10 && `${result.buckets.bucket2.percentage}%`}
              </div>
              <div
                style={{ width: `${result.buckets.bucket3.percentage}%` }}
                className="bg-emerald-500 rounded-r-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-slate-950"
                title={`Bucket 3: ${result.buckets.bucket3.percentage}%`}
              >
                {result.buckets.bucket3.percentage >= 10 && `${result.buckets.bucket3.percentage}%`}
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                Bucket 1: 단기 안심 현금 ({result.buckets.bucket1.percentage}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                Bucket 2: 중기 인컴·배당 ({result.buckets.bucket2.percentage}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Bucket 3: 장기 복리 성장 ({result.buckets.bucket3.percentage}%)
              </span>
            </div>
          </div>

          {/* 3 Buckets Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bucket 1 */}
            <div className="p-4.5 rounded-xl bg-slate-800/70 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-400/50 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {result.buckets.bucket1.horizonYears}
                  </span>
                  <span className="text-xs text-slate-400">수익률 연 {result.buckets.bucket1.expectedReturnRate}%</span>
                </div>
                <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  {result.buckets.bucket1.name}
                </h3>
                <div className="mt-3">
                  <div className="text-2xl font-black text-cyan-300">
                    <NumberPopIn
                      value={result.buckets.bucket1.allocatedAmount}
                      formatter={(v) => `${v.toLocaleString()}만원`}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    연간 예상 이자: 약 {result.buckets.bucket1.annualExpectedIncome.toLocaleString()}만원
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {result.buckets.bucket1.roleDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">추천 포트폴리오</div>
                <div className="flex flex-wrap gap-1">
                  {result.buckets.bucket1.recommendedAssets.map((asset, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bucket 2 */}
            <div className="p-4.5 rounded-xl bg-slate-800/70 border border-indigo-500/30 flex flex-col justify-between hover:border-indigo-400/50 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {result.buckets.bucket2.horizonYears}
                  </span>
                  <span className="text-xs text-slate-400">수익률 연 {result.buckets.bucket2.expectedReturnRate}%</span>
                </div>
                <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {result.buckets.bucket2.name}
                </h3>
                <div className="mt-3">
                  <div className="text-2xl font-black text-indigo-300">
                    <NumberPopIn
                      value={result.buckets.bucket2.allocatedAmount}
                      formatter={(v) => `${v.toLocaleString()}만원`}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    연간 예상 배당·이자: 약 {result.buckets.bucket2.annualExpectedIncome.toLocaleString()}만원
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {result.buckets.bucket2.roleDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">추천 포트폴리오</div>
                <div className="flex flex-wrap gap-1">
                  {result.buckets.bucket2.recommendedAssets.map((asset, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bucket 3 */}
            <div className="p-4.5 rounded-xl bg-slate-800/70 border border-emerald-500/30 flex flex-col justify-between hover:border-emerald-400/50 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {result.buckets.bucket3.horizonYears}
                  </span>
                  <span className="text-xs text-slate-400">수익률 연 {result.buckets.bucket3.expectedReturnRate}%</span>
                </div>
                <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {result.buckets.bucket3.name}
                </h3>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-300">
                    <NumberPopIn
                      value={result.buckets.bucket3.allocatedAmount}
                      formatter={(v) => `${v.toLocaleString()}만원`}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    연간 예상 복리성장: 약 {result.buckets.bucket3.annualExpectedIncome.toLocaleString()}만원
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {result.buckets.bucket3.roleDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">추천 포트폴리오</div>
                <div className="flex flex-wrap gap-1">
                  {result.buckets.bucket3.recommendedAssets.map((asset, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rebalancing Rules Guide */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-700/70">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">
                3-Bucket 성공을 위한 3대 리밸런싱 행동 원칙
              </h4>
            </div>
            <div className="space-y-2">
              {result.rebalancingRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>수익률 및 배당률은 시장 상황과 선택 상품에 따라 변동될 수 있습니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
}
