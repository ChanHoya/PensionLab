"use client";

import React, { useState, useMemo } from "react";
import {
  calculateNpsRecovery,
  RecoveryOptionInput,
  RecoveryAnalysisResult,
} from "@/services/npsRecoveryCalculator";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface NpsRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAge?: number;
  npsStartAge?: number;
  expectedLifeExpectancy?: number;
  currentMonthlyPensionWon?: number;
}

export default function NpsRecoveryModal({
  isOpen,
  onClose,
  currentAge = 55,
  npsStartAge = 65,
  expectedLifeExpectancy = 88,
  currentMonthlyPensionWon = 1200000,
}: NpsRecoveryModalProps) {
  // 사용자가 인터랙티브하게 조절할 수 있는 상태값
  const [additionalMonths, setAdditionalMonths] = useState<number>(60); // 1 ~ 119개월
  const [baseIncomeWon, setBaseIncomeWon] = useState<number>(3000000); // 100만 ~ 617만원 (2026년 기준소득 상한)
  const [hasReturnRefund, setHasReturnRefund] = useState<boolean>(false);
  const [refundYearPeriod, setRefundYearPeriod] = useState<"PRE_1998" | "1999_2007" | "POST_2008">("PRE_1998");
  const [refundPrincipalWon, setRefundPrincipalWon] = useState<number>(5000000); // 500만원
  const [refundYearsPassed, setRefundYearsPassed] = useState<number>(25);

  const input: RecoveryOptionInput = useMemo(
    () => ({
      currentAge,
      npsStartAge,
      lifeExpectancy: expectedLifeExpectancy,
      currentMonthlyPension: currentMonthlyPensionWon,
      baseIncomeWon,
      additionalMonths,
      hasReturnRefund,
      refundYearPeriod,
      refundPrincipalWon,
      refundYearsPassed,
    }),
    [
      currentAge,
      npsStartAge,
      expectedLifeExpectancy,
      currentMonthlyPensionWon,
      baseIncomeWon,
      additionalMonths,
      hasReturnRefund,
      refundYearPeriod,
      refundPrincipalWon,
      refundYearsPassed,
    ]
  );

  const result: RecoveryAnalysisResult = useMemo(() => calculateNpsRecovery(input), [input]);

  if (!isOpen) return null;

  const { additionalPayment, returnRepayment, chartData, recommendation } = result;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          maxHeight: "90vh",
          backgroundColor: "var(--surface)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.05) 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>⚖️</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                국민연금 추납(추후납부) vs 반납 실익 역산기
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "var(--text-accent, #6366f1)",
                  fontWeight: 600,
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                2026 연금개혁 산식
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              과거 미납·경단 기간 추납과 1998년 이전 70% 소득대체율 반납 실익을 골든크로스(원금 회수 나이)로 분석합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
              borderRadius: "8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Controls Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              background: "var(--modal-subbox-bg, var(--surface-2))",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--modal-subbox-border, var(--border))",
            }}
          >
            {/* 추납 희망 개월수 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  추납 희망 기간 (최대 119개월)
                </label>
                <span style={{ fontSize: "0.85rem", color: "#6366f1", fontWeight: 700 }}>
                  {additionalMonths}개월 ({(additionalMonths / 12).toFixed(1)}년)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={119}
                value={additionalMonths}
                onChange={(e) => setAdditionalMonths(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#6366f1" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                <span>1개월</span>
                <span>60개월(5년)</span>
                <span>119개월(10년 미만)</span>
              </div>
            </div>

            {/* 추납 기준소득월액 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  신청 시 기준소득월액 (보험료 9%)
                </label>
                <span style={{ fontSize: "0.85rem", color: "#a855f7", fontWeight: 700 }}>
                  {Math.round(baseIncomeWon / 10000).toLocaleString()}만원/월 (보험료 {Math.round((baseIncomeWon * 0.09) / 10000)}만원)
                </span>
              </div>
              <input
                type="range"
                min={1000000}
                max={6170000}
                step={100000}
                value={baseIncomeWon}
                onChange={(e) => setBaseIncomeWon(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#a855f7" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                <span>100만원</span>
                <span>300만원(평균 A값)</span>
                <span>617만원(상한)</span>
              </div>
            </div>

            {/* 반납 옵션 토글 */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                <input
                  type="checkbox"
                  checked={hasReturnRefund}
                  onChange={(e) => setHasReturnRefund(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#10b981" }}
                />
                과거 반환일시금 수령 이력 있음 (반납 분석 활성화)
              </label>
              {hasReturnRefund && (
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <select
                    value={refundYearPeriod}
                    onChange={(e) => setRefundYearPeriod(e.target.value as any)}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="PRE_1998">1998년 이전 (소득대체율 70%)</option>
                    <option value="1999_2007">1999~2007년 (소득대체율 60%)</option>
                    <option value="POST_2008">2008년 이후 (소득대체율 50~40%)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Key KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.02) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>추납 일시납 총비용</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#818cf8", marginTop: "4px" }}>
                {(additionalPayment.totalCostWon / 10000).toLocaleString()}만원
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                월 {Math.round(additionalPayment.monthlyPremiumWon / 10000)}만원 × {additionalPayment.months}개월
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>평생 월 수령 증가액</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#34d399", marginTop: "4px" }}>
                +{(additionalPayment.monthlyIncreaseWon / 10000).toFixed(1)}만원/월
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                연간 +{Math.round(additionalPayment.annualIncreaseWon / 10000).toLocaleString()}만원 증액
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>원금 회수 나이 (골든크로스)</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fbbf24", marginTop: "4px" }}>
                {additionalPayment.breakEvenAge}세
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                개시 후 {additionalPayment.breakEvenYears}년 만에 완벽 원금 회수
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.02) 100%)",
                border: "1px solid rgba(236, 72, 153, 0.25)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>기대수명({expectedLifeExpectancy}세) 순수익</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f472b6", marginTop: "4px" }}>
                +{(additionalPayment.netProfitWon / 10000).toLocaleString()}만원
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                순수익률 +{additionalPayment.roiPercent}% (IRR 연 {additionalPayment.annualEquivalentReturn}%)
              </div>
            </div>
          </div>

          {/* Golden Crossover Chart */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>
                📈 나이별 실질 순누적 수령액 비교 곡선 (원금 차감 후 순이익)
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>단위: 만원</span>
            </div>
            <div style={{ height: "260px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="age" stroke="#94a3b8" tickFormatter={(v) => `${v}세`} />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(val: any) => [`${Math.round(Number(val)).toLocaleString()}만원`, ""]}
                    labelFormatter={(label) => `${label}세`}
                  />
                  <Legend />
                  <ReferenceLine
                    x={Math.round(additionalPayment.breakEvenAge)}
                    stroke="#fbbf24"
                    strokeDasharray="4 4"
                    label={{ value: `골든크로스 ${additionalPayment.breakEvenAge}세`, fill: "#fbbf24", fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="withoutRecovery"
                    name="현재 유지 (미추납)"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="withAdditionalPayment"
                    name="추납 진행 (순이익)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={false}
                  />
                  {returnRepayment && (
                    <Line
                      type="monotone"
                      dataKey="withReturnRepayment"
                      name="과거 반납 복원 (초고수익)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Table & Advice */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Table */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                📋 제도별 실익 및 조건 비교
              </h4>
              <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", background: "var(--modal-table-th, var(--surface-2))" }}>
                    <th style={{ padding: "8px 4px" }}>구분</th>
                    <th style={{ padding: "8px 4px" }}>추납(추후납부)</th>
                    <th style={{ padding: "8px 4px" }}>반납(일시금 반환)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 4px", color: "var(--text-secondary)" }}>신청 한도</td>
                    <td style={{ padding: "8px 4px", color: "var(--text-accent, #6366f1)", fontWeight: 600 }}>최대 119개월 (10년 미만)</td>
                    <td style={{ padding: "8px 4px", color: "var(--success, #10b981)", fontWeight: 600 }}>수령했던 전체 기간 복원</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 4px", color: "var(--text-secondary)" }}>적용 소득대체율</td>
                    <td style={{ padding: "8px 4px", color: "var(--text-primary)" }}>현재 연도(약 41.5% 수준)</td>
                    <td style={{ padding: "8px 4px", color: "var(--success, #10b981)", fontWeight: 700 }}>
                      과거 시절(최대 70%) 통째 복원
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 4px", color: "var(--text-secondary)" }}>분할납부 여부</td>
                    <td style={{ padding: "8px 4px", color: "var(--text-primary)" }}>최대 60회 분할 가능</td>
                    <td style={{ padding: "8px 4px", color: "var(--text-primary)" }}>최대 24회 분할 가능</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 4px", color: "var(--text-secondary)" }}>수익비 평가</td>
                    <td style={{ padding: "8px 4px", color: "#f59e0b", fontWeight: 700 }}>약 1.5~2.2배 (우수)</td>
                    <td style={{ padding: "8px 4px", color: "var(--success, #10b981)", fontWeight: 700 }}>
                      약 2.5~3.8배 (최상급)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action Checklist */}
            <div
              style={{
                background: "var(--modal-subbox-bg, var(--surface-2))",
                border: "1px solid var(--modal-subbox-border, var(--border))",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-accent, #6366f1)" }}>
                💡 공단 실행 가이드 & 전략 소견
              </h4>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                {recommendation.primaryAdvice}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recommendation.actionChecklist.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-accent, #6366f1)", fontWeight: 700 }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            background: "var(--modal-header-bg, var(--surface))",
          }}
        >
          <button
            onClick={onClose}
            className="premium-button"
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
