"use client";

import React, { useState, useMemo } from "react";
import { usePensionStore } from "@/store/usePensionStore";
import { statutoryStartAgeOf } from "@/services/coupleSimulation";
import { paidTotalsOf } from "@/services/paidTotals";
import {
  calculateIncomeBridge,
  UNEMPLOYMENT_MONTHLY_MAX_WON,
} from "@/services/incomeBridgeCalculator";

interface IncomeBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IncomeBridgeModal({ isOpen, onClose }: IncomeBridgeModalProps) {
  const store = usePensionStore();

  const defaultNpsAge = statutoryStartAgeOf(store.simulationParams, "SELF");
  const defaultRetAge = Math.min(
    defaultNpsAge - 1,
    Math.max(55, store.simulationParams.retirementAge || 60)
  );
  const defaultExpense = store.simulationParams.targetMonthlySpending || 300;

  // 퇴직연금·개인연금 자산 (만원). 스토어 금액은 이미 만원 단위 — 은퇴까지 낼 납입액과 DB형 예상 적립금 포함, 운용수익 제외(원금 기준)
  const paid = paidTotalsOf(
    {
      national: store.nationalPension,
      retirementPensions: store.retirementPensions,
      personalPensions: store.personalPensions,
      pensionInsurances: store.pensionInsurances,
    },
    store.simulationParams
  );
  const severanceManwon = Math.round(paid.retirement);
  const personalPensionManwon = Math.round(paid.personal + paid.insurance);

  // 로컬 상태
  const [retAge, setRetAge] = useState<number>(defaultRetAge);
  const [npsAge, setNpsAge] = useState<number>(defaultNpsAge);
  const [targetExpenseManwon, setTargetExpenseManwon] = useState<number>(defaultExpense);
  const [includeUnemployment, setIncludeUnemployment] = useState<boolean>(true);
  const [includeHealthSavings, setIncludeHealthSavings] = useState<boolean>(true);
  const [includeReverseMortgage, setIncludeReverseMortgage] = useState<boolean>(
    store.simulationParams.useReverseMortgage ?? false
  );
  const [reverseMortgageMonthlyManwon, setReverseMortgageMonthlyManwon] = useState<number>(100);

  const bridgeResult = useMemo(() => {
    return calculateIncomeBridge({
      retirementAge: retAge,
      npsStartAge: npsAge,
      targetMonthlyExpenseWon: targetExpenseManwon * 10000,
      severancePayWon: severanceManwon * 10000,
      personalPensionWon: personalPensionManwon * 10000,
      includeUnemploymentBenefit: includeUnemployment,
      unemploymentMonths: 9,
      includeReverseMortgage: includeReverseMortgage,
      reverseMortgageMonthlyWon: reverseMortgageMonthlyManwon * 10000,
      includeVoluntaryHealthInsurance: includeHealthSavings,
      monthlyHealthInsuranceSavingsWon: 150000,
    });
  }, [
    retAge,
    npsAge,
    targetExpenseManwon,
    severanceManwon,
    personalPensionManwon,
    includeUnemployment,
    includeHealthSavings,
    includeReverseMortgage,
    reverseMortgageMonthlyManwon,
  ]);

  if (!isOpen) return null;

  const badgeColor =
    bridgeResult.safetyGrade === "SAFE"
      ? "#10b981"
      : bridgeResult.safetyGrade === "CAUTION"
      ? "#f59e0b"
      : "#ef4444";

  const badgeBg =
    bridgeResult.safetyGrade === "SAFE"
      ? "rgba(16, 185, 129, 0.15)"
      : bridgeResult.safetyGrade === "CAUTION"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card t-modal-spring"
        style={{
          width: "100%",
          maxWidth: "920px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "var(--modal-bg, #ffffff)",
          color: "var(--text-primary, #0f1127)",
          borderRadius: "16px",
          border: "1px solid var(--modal-border, #e2e8f0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            paddingBottom: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.6rem" }}>🌉</span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                은퇴 소득 공백기(소득 크레바스) 브릿지 집중 플래너
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  color: badgeColor,
                  background: badgeBg,
                  border: `1px solid ${badgeColor}`,
                }}
              >
                {bridgeResult.safetyGradeLabel} ({bridgeResult.coverageRatio}%)
              </span>
            </div>
            <p
              style={{
                fontSize: "0.825rem",
                color: "var(--text-secondary, #94a3b8)",
                margin: "4px 0 0 0",
              }}
            >
              주직장 퇴직 후 국민연금 개시 전까지 발생하는 소득 절벽 구간을 4대 브릿지 수단(실업급여, 사적연금, 건보료 방어, 주택연금)으로 방어합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary, #94a3b8)",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* 상단 4대 핵심 KPI 카드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "var(--modal-surface-card, #f8fafc)",
              border: "1px solid var(--modal-border, #e2e8f0)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>
              소득 공백 기간
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#0284c7" }}>
              {bridgeResult.gapYears}년 ({bridgeResult.gapMonths}개월)
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              은퇴 {retAge}세 ~ 국민연금 {npsAge}세
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "var(--modal-surface-card, #f8fafc)",
              border: "1px solid var(--modal-border, #e2e8f0)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>
              공백기 총 필요 생활비
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#e11d48" }}>
              {(bridgeResult.totalRequiredFundsWon / 100000000).toFixed(2)}억원
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              월 {targetExpenseManwon}만원 기준
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "var(--modal-surface-card, #f8fafc)",
              border: "1px solid var(--modal-border, #e2e8f0)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>
              조달 가능 총 자산
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#059669" }}>
              {(bridgeResult.totalProcuredFundsWon / 100000000).toFixed(2)}억원
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              준비율 {bridgeResult.coverageRatio}%
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "var(--modal-surface-card, #f8fafc)",
              border: "1px solid var(--modal-border, #e2e8f0)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>
              최종 자금 밸런스
            </div>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                marginTop: "4px",
                color: bridgeResult.shortfallWon > 0 ? "#dc2626" : "#059669",
              }}
            >
              {bridgeResult.shortfallWon > 0
                ? `-${(bridgeResult.shortfallWon / 10000).toLocaleString()}만원`
                : "충족 (+0원)"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              {bridgeResult.shortfallWon > 0 ? "적자 자금 발생" : "소득 결손 방어 완료"}
            </div>
          </div>
        </div>

        {/* 조절 슬라이더 및 전략 토글 박스 */}
        <div
          style={{
            background: "var(--modal-subbox-bg, #f8fafc)",
            border: "1px solid var(--modal-subbox-border, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0284c7" }}>
            ⚙️ 공백기 조건 및 4대 브릿지 수단 시뮬레이션
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            {/* 은퇴 나이 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>은퇴 예정 나이</span>
                <span style={{ fontWeight: 700, color: "#0284c7" }}>만 {retAge}세</span>
              </div>
              <input
                type="range"
                min={55}
                max={npsAge}
                step={1}
                value={retAge}
                onChange={(e) => setRetAge(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 국민연금 개시 나이 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>국민연금 수령 개시 나이</span>
                <span style={{ fontWeight: 700, color: "#0284c7" }}>만 {npsAge}세 (법정 {defaultNpsAge}세)</span>
              </div>
              <input
                type="range"
                min={60}
                max={70}
                step={1}
                value={npsAge}
                onChange={(e) => setNpsAge(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 목표 생활비 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>공백기 월 목표 생활비</span>
                <span style={{ fontWeight: 700, color: "#e11d48" }}>월 {targetExpenseManwon}만원</span>
              </div>
              <input
                type="range"
                min={150}
                max={600}
                step={10}
                value={targetExpenseManwon}
                onChange={(e) => setTargetExpenseManwon(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>
          </div>

          {/* 브릿지 전략 토글 버튼 행 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "10px",
              marginTop: "4px",
            }}
          >
            {/* 1. 실업급여 */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.78rem",
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: "8px",
                background: includeUnemployment ? "rgba(2, 132, 199, 0.1)" : "var(--modal-surface, #ffffff)",
                border: `1px solid ${includeUnemployment ? "rgba(2, 132, 199, 0.4)" : "var(--modal-border, #e2e8f0)"}`,
              }}
            >
              <input
                type="checkbox"
                checked={includeUnemployment}
                onChange={(e) => setIncludeUnemployment(e.target.checked)}
              />
              <div>
                <div style={{ fontWeight: 600 }}>구직급여(실업급여) 반영</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #64748b)" }}>
                  은퇴 1년차 최대 9개월 (총 {((UNEMPLOYMENT_MONTHLY_MAX_WON * 9) / 10000).toLocaleString()}만원)
                </div>
              </div>
            </label>

            {/* 2. 임의계속가입 */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.78rem",
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: "8px",
                background: includeHealthSavings ? "rgba(16, 185, 129, 0.1)" : "var(--modal-surface, #ffffff)",
                border: `1px solid ${includeHealthSavings ? "rgba(16, 185, 129, 0.4)" : "var(--modal-border, #e2e8f0)"}`,
              }}
            >
              <input
                type="checkbox"
                checked={includeHealthSavings}
                onChange={(e) => setIncludeHealthSavings(e.target.checked)}
              />
              <div>
                <div style={{ fontWeight: 600 }}>건보료 임의계속가입(36개월)</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #64748b)" }}>
                  월 약 15만원 건보료 지출 방어
                </div>
              </div>
            </label>

            {/* 3. 주택연금 조기 결합 */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.78rem",
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: "8px",
                background: includeReverseMortgage ? "rgba(245, 158, 11, 0.1)" : "var(--modal-surface, #ffffff)",
                border: `1px solid ${includeReverseMortgage ? "rgba(245, 158, 11, 0.4)" : "var(--modal-border, #e2e8f0)"}`,
              }}
            >
              <input
                type="checkbox"
                checked={includeReverseMortgage}
                onChange={(e) => setIncludeReverseMortgage(e.target.checked)}
              />
              <div>
                <div style={{ fontWeight: 600 }}>주택연금 조기 브릿지</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #64748b)" }}>
                  {includeReverseMortgage ? `월 ${reverseMortgageMonthlyManwon}만원 연계` : "비활성화 (필요시 활성화)"}
                </div>
              </div>
            </label>
          </div>

          {includeReverseMortgage && (
            <div style={{ marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span>주택연금 월 수령 연계액</span>
                <span style={{ fontWeight: 700, color: "#d97706" }}>월 {reverseMortgageMonthlyManwon}만원</span>
              </div>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={reverseMortgageMonthlyManwon}
                onChange={(e) => setReverseMortgageMonthlyManwon(Number(e.target.value))}
                style={{ width: "100%", marginTop: "4px" }}
              />
            </div>
          )}
        </div>

        {/* CFP 전문 권장안 콜아웃 */}
        <div
          style={{
            background: "rgba(2, 132, 199, 0.08)",
            border: "1px solid rgba(2, 132, 199, 0.25)",
            borderRadius: "10px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0284c7", marginBottom: "6px" }}>
            💡 CFP 은퇴설계 전문가 브릿지 전략 권고
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", lineHeight: 1.6 }}>
            {bridgeResult.cfRecommendations.map((rec, idx) => (
              <li key={idx} style={{ color: "var(--text-secondary, #475569)", marginTop: "2px" }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* 연도별 상세 현금흐름 타임라인 테이블 */}
        {bridgeResult.yearlyDetails.length > 0 && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
              📊 소득 공백기 연도별 수지 균형 타임라인
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.75rem",
                  textAlign: "right",
                }}
              >
                <thead>
                  <tr style={{ background: "var(--modal-table-th, #f8fafc)", borderBottom: "1px solid var(--modal-table-border, #e2e8f0)" }}>
                    <th style={{ padding: "8px 6px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>연차</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>나이</th>
                    <th style={{ padding: "8px 6px", color: "var(--text-muted, #64748b)" }}>연 목표생활비</th>
                    <th style={{ padding: "8px 6px", color: "#0284c7" }}>실업급여</th>
                    <th style={{ padding: "8px 6px", color: "#059669" }}>건보료절감</th>
                    <th style={{ padding: "8px 6px", color: "#d97706" }}>주택연금</th>
                    <th style={{ padding: "8px 6px", color: "var(--text-muted, #64748b)" }}>퇴직연금인출</th>
                    <th style={{ padding: "8px 6px", color: "var(--text-muted, #64748b)" }}>개인연금인출</th>
                    <th style={{ padding: "8px 6px", fontWeight: 700, color: "var(--text-primary)" }}>총조달액(월평균)</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>결손여부</th>
                  </tr>
                </thead>
                <tbody>
                  {bridgeResult.yearlyDetails.map((row) => (
                    <tr
                      key={row.yearIndex}
                      style={{
                        borderBottom: "1px solid var(--modal-border-subtle, #f1f5f9)",
                        background: row.netSurplusWon < 0 ? "rgba(239, 68, 68, 0.08)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "8px 6px", textAlign: "center", color: "var(--text-secondary)" }}>{row.yearIndex}년차</td>
                      <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, color: "var(--text-primary)" }}>{row.age}세</td>
                      <td style={{ padding: "8px 6px", color: "var(--text-primary)" }}>{(row.annualTargetWon / 10000).toLocaleString()}만원</td>
                      <td style={{ padding: "8px 6px", color: "#0284c7" }}>
                        {row.unemploymentWon > 0 ? `${(row.unemploymentWon / 10000).toLocaleString()}만` : "-"}
                      </td>
                      <td style={{ padding: "8px 6px", color: "#059669" }}>
                        {row.healthInsuranceSavingsWon > 0 ? `${(row.healthInsuranceSavingsWon / 10000).toLocaleString()}만` : "-"}
                      </td>
                      <td style={{ padding: "8px 6px", color: "#d97706" }}>
                        {row.reverseMortgageWon > 0 ? `${(row.reverseMortgageWon / 10000).toLocaleString()}만` : "-"}
                      </td>
                      <td style={{ padding: "8px 6px", color: "var(--text-secondary)" }}>
                        {row.severanceWithdrawalWon > 0 ? `${(row.severanceWithdrawalWon / 10000).toLocaleString()}만` : "-"}
                      </td>
                      <td style={{ padding: "8px 6px", color: "var(--text-secondary)" }}>
                        {row.personalPensionWithdrawalWon > 0 ? `${(row.personalPensionWithdrawalWon / 10000).toLocaleString()}만` : "-"}
                      </td>
                      <td style={{ padding: "8px 6px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {(row.monthlyAverageIncomeWon / 10000).toFixed(0)}만원
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        {row.netSurplusWon >= 0 ? (
                          <span style={{ color: "#059669", fontWeight: 700 }}>충족</span>
                        ) : (
                          <span style={{ color: "#dc2626", fontWeight: 700 }}>
                            {Math.round(row.netSurplusWon / 10000)}만원
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 모달 닫기 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            className="premium-button-primary"
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
}
