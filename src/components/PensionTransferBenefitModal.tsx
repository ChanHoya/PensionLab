"use client";

import React, { useState, useMemo } from "react";
import {
  calculatePensionTransferBenefit,
  PensionTransferInput,
} from "../services/pensionTransferCalculator";
import { NumberPopIn } from "@/components/motion";
import GlossaryTooltip from "./GlossaryTooltip";
import {
  ArrowRightLeft,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  HelpCircle,
  Building2,
  Sparkles,
  Info,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-emerald-950/40 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl">🔄</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  개인연금(IRP/연금저축) 금융사 갈아타기 실익 분석기
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  세금 0원 원스톱 승계
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                과거 가입한 저수익 연금신탁·보험을 증권사 우량 ETF/TDF로 이전할 때의 복리 자산 격차
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
          {/* Top Big Impact Metric Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-800/80 to-teal-950/50 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                  Expected Asset Surplus
                </span>
                <span className="text-xs text-slate-400">
                  ({inputs.holdingYears}년 후 만기 시점)
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                갈아타기 시 은퇴 자산{" "}
                <span className="text-emerald-400">
                  +<NumberPopIn value={result.assetGap} formatter={(v) => `${v.toLocaleString()}만원`} />
                </span>{" "}
                추가 확보
              </div>
              <p className="text-xs text-slate-300">
                수수료는 낮추고 복리 수익률은 높여 자산이 약 <b>{result.growthMultiplier}배</b>로 증식됩니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0 bg-slate-900/80 p-3 rounded-lg border border-slate-700/60">
              <div className="text-right border-r border-slate-700/60 pr-3">
                <div className="text-[11px] text-slate-400">은퇴 후 20년 월 수령액</div>
                <div className="text-base font-bold text-emerald-400">
                  +<NumberPopIn value={result.monthlyPensionGap} formatter={(v) => `${v.toLocaleString()}만원/월`} />
                </div>
                <div className="text-[10px] text-slate-400">
                  기존 월 {result.currentMonthlyPension.toLocaleString()}만원 대비
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400">아끼는 총 수수료</div>
                <div className="text-base font-bold text-teal-300">
                  약 {result.totalFeeSaved.toLocaleString()}만원
                </div>
                <div className="text-[10px] text-slate-400">불필요한 보수 절감</div>
              </div>
            </div>
          </div>

          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  현재 연금 적립금
                  <GlossaryTooltip termId="PENSION_ACCOUNT_TRANSFER" />
                </span>
                <span className="font-bold text-white">
                  {inputs.currentBalance.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={inputs.currentBalance}
                onChange={(e) =>
                  setInputs({ ...inputs, currentBalance: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>500만원</span>
                <span>1억원</span>
                <span>2억원</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium">월 추가 납입액</span>
                <span className="font-bold text-white">
                  {inputs.monthlyContribution.toLocaleString()}만원
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={inputs.monthlyContribution}
                onChange={(e) =>
                  setInputs({ ...inputs, monthlyContribution: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0원</span>
                <span>50만원</span>
                <span>150만원</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium">잔여 운용 기간</span>
                <span className="font-bold text-teal-400">
                  {inputs.holdingYears}년
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={inputs.holdingYears}
                onChange={(e) =>
                  setInputs({ ...inputs, holdingYears: Number(e.target.value) })
                }
                className="w-full accent-teal-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>3년</span>
                <span>15년</span>
                <span>30년</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium">새 금융사 목표 수익률</span>
                <span className="font-bold text-emerald-400">
                  연 {inputs.newReturnRate}%
                </span>
              </div>
              <input
                type="range"
                min={3.0}
                max={10.0}
                step={0.5}
                value={inputs.newReturnRate}
                onChange={(e) =>
                  setInputs({ ...inputs, newReturnRate: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>3.0%(안정)</span>
                <span>6.5%(배당/TDF)</span>
                <span>10.0%(지수)</span>
              </div>
            </div>
          </div>

          {/* Comparison Cards: Before vs After */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Card */}
            <div className="p-4.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-300">
                    현재 유지 (은행 신탁 / 보험사 연금보험)
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                  기존 유지
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">연간 수익률 - 수수료</span>
                  <span className="text-xs font-semibold text-slate-300">
                    {inputs.currentReturnRate}% - {inputs.currentFeeRate}% = 순 {(inputs.currentReturnRate - inputs.currentFeeRate).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{inputs.holdingYears}년 후 예상 적립액</span>
                  <span className="text-lg font-bold text-slate-200">
                    {result.currentFinalBalance.toLocaleString()}만원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">은퇴 후 월 예상 연금</span>
                  <span className="text-sm font-semibold text-slate-300">
                    월 {result.currentMonthlyPension.toLocaleString()}만원
                  </span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                원리금보장형에 묶여있어 물가상승률(2~3%)에 미치지 못해 실질 화폐가치가 잠식될 위험이 있습니다.
              </div>
            </div>

            {/* After Card */}
            <div className="p-4.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-800/70 to-teal-950/30 border border-emerald-500/40 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    증권사 계좌이체 (글로벌 ETF / TDF 포트폴리오)
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  추천 전략
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">연간 수익률 - 수수료</span>
                  <span className="text-xs font-semibold text-emerald-300">
                    {inputs.newReturnRate}% - {inputs.newFeeRate}% = 순 {(inputs.newReturnRate - inputs.newFeeRate).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">{inputs.holdingYears}년 후 예상 적립액</span>
                  <span className="text-lg font-black text-emerald-400">
                    {result.newFinalBalance.toLocaleString()}만원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">은퇴 후 월 예상 연금</span>
                  <span className="text-sm font-bold text-emerald-300">
                    월 {result.newMonthlyPension.toLocaleString()}만원 (+{result.monthlyPensionGap.toLocaleString()}만원)
                  </span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-emerald-200/90 bg-emerald-950/40 p-2 rounded border border-emerald-500/20">
                미국배당다우존스, S&P500, TDF 등으로 전 세계 우량 자산의 장기 복리 성장 효과를 온전히 누립니다.
              </div>
            </div>
          </div>

          {/* Recharts: Yearly Growth Trajectory */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
              <span>연도별 복리 자산 축적 시뮬레이션 (만원 단위)</span>
              <span className="text-[11px] text-slate-400 font-normal">
                녹색 선이 증권사 계좌이체 시 성장 경로
              </span>
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearlyTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="year"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) => `${v}년`}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${Number(val || 0).toLocaleString()} 만원`, ""]}
                    labelFormatter={(label) => `${label}년 후`}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Line
                    type="monotone"
                    dataKey="currentBalance"
                    name="기존 유지 (은행/보험)"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="newBalance"
                    name="증권사 갈아타기 (ETF/TDF)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalContributions"
                    name="원금 누적"
                    stroke="#475569"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3 Steps Transfer Guide */}
          <div className="bg-slate-850 p-4.5 rounded-xl border border-slate-700/70">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                방문 없이 모바일 앱으로 3분 만에 끝내는 '원스톱 계좌이체' 3단계
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.transferGuideSteps.map((step) => (
                <div
                  key={step.step}
                  className="p-3 rounded-lg bg-slate-900/70 border border-slate-850 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center border border-emerald-500/30">
                        {step.step}
                      </span>
                      <h5 className="text-xs font-bold text-slate-200">{step.title}</h5>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {step.tip && (
                    <div className="mt-2 text-[10px] text-emerald-400/90 bg-emerald-950/30 p-1.5 rounded border border-emerald-900/50">
                      💡 {step.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Caution Checklist */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              갈아타기 전 반드시 확인해야 할 유의사항
            </div>
            <ul className="space-y-1.5">
              {result.warningPoints.map((warn, i) => (
                <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>수익률은 예시이며, 실제 투자 성과 및 세부 해약환급금은 금융사별로 상이합니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
}
