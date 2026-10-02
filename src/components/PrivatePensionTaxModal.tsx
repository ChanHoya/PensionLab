"use client";

import React, { useState, useMemo } from "react";
import { usePensionStore } from "@/store/usePensionStore";
import { runCoupleSimulation } from "@/services/coupleSimulation";
import {
  analyzePrivatePensionTax,
  PRIVATE_PENSION_TAX_LIMIT,
  PRIVATE_PENSION_MONTHLY_LIMIT,
} from "@/services/privatePensionTaxOptimizer";

interface PrivatePensionTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivatePensionTaxModal({ isOpen, onClose }: PrivatePensionTaxModalProps) {
  const store = usePensionStore();
  const [activeTab, setActiveTab] = useState<"SELF" | "SPOUSE">("SELF");

  const hasSpouse = store.simulationParams.hasSpouse;

  const { selfPensions, spousePensions } = useMemo(() => {
    const self = {
      national: store.nationalPension,
      retirementPensions: store.retirementPensions,
      personalPensions: store.personalPensions,
      pensionInsurances: store.pensionInsurances,
    };
    const spouse = {
      national: store.spouse.nationalPension,
      retirementPensions: store.spouse.retirementPensions,
      personalPensions: store.spouse.personalPensions,
      pensionInsurances: store.spouse.pensionInsurances,
    };
    return { selfPensions: self, spousePensions: spouse };
  }, [
    store.nationalPension,
    store.retirementPensions,
    store.personalPensions,
    store.pensionInsurances,
    store.spouse,
  ]);

  const simulationFlows = useMemo(() => {
    return runCoupleSimulation(
      selfPensions,
      hasSpouse ? spousePensions : null,
      store.simulationParams,
      store.basicPension
    );
  }, [selfPensions, spousePensions, hasSpouse, store.simulationParams, store.basicPension]);

  const taxAnalysis = useMemo(() => {
    return analyzePrivatePensionTax(
      simulationFlows.rows,
      selfPensions,
      spousePensions,
      store.simulationParams
    );
  }, [simulationFlows, selfPensions, spousePensions, store.simulationParams]);

  if (!isOpen) return null;

  const currentSummary = activeTab === "SELF" ? taxAnalysis.self : taxAnalysis.spouse;

  const formatManwon = (won: number) => {
    const manwon = Math.round(won / 10000);
    return `${manwon.toLocaleString()}만원`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(10, 15, 29, 0.85)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          backgroundColor: "#161b26",
          border: "1px solid #2d3748",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#e2e8f0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #2d3748",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.4rem" }}>⚖️</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc" }}>
                사적연금 연 1,500만원 절세 한도 최적화기
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  backgroundColor:
                    taxAnalysis.householdStatus === "SAFE" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: taxAnalysis.householdStatus === "SAFE" ? "#34d399" : "#f87171",
                  border:
                    taxAnalysis.householdStatus === "SAFE" ? "1px solid #059669" : "1px solid #dc2626",
                }}
              >
                {taxAnalysis.householdStatus === "SAFE" ? "전 연도 1,500만 한도 내 안전" : "절세 초과 구간 발생"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
              소득세법 제20조의3·제129조의2 — 연금저축/IRP 연간 사적연금 수령액이 1,500만원(월 125만원)을 초과하면 저율과세(3.3~5.5%)가 배제되고 16.5% 분리과세 또는 종합과세가 적용됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Person Selector Tabs */}
        {hasSpouse && (
          <div style={{ display: "flex", padding: "10px 24px 0", gap: 8, borderBottom: "1px solid #1e293b" }}>
            <button
              type="button"
              onClick={() => setActiveTab("SELF")}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                borderBottom: activeTab === "SELF" ? "2px solid #38bdf8" : "2px solid transparent",
                color: activeTab === "SELF" ? "#38bdf8" : "#94a3b8",
                background: "transparent",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                cursor: "pointer",
              }}
            >
              본인 ({taxAnalysis.self.status === "SAFE" ? "안전" : `초과 ${taxAnalysis.self.totalExcessYears}년`})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SPOUSE")}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                borderBottom: activeTab === "SPOUSE" ? "2px solid #38bdf8" : "2px solid transparent",
                color: activeTab === "SPOUSE" ? "#38bdf8" : "#94a3b8",
                background: "transparent",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                cursor: "pointer",
              }}
            >
              배우자 ({taxAnalysis.spouse.status === "SAFE" ? "안전" : `초과 ${taxAnalysis.spouse.totalExcessYears}년`})
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Key Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>법정 분리과세 한도</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8", marginTop: 4 }}>
                연 1,500만원
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>월 125만원 기준</div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>최대 연간 수령액</div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: currentSummary.maxAnnualPayoutWon > PRIVATE_PENSION_TAX_LIMIT ? "#f87171" : "#34d399",
                  marginTop: 4,
                }}
              >
                {formatManwon(currentSummary.maxAnnualPayoutWon)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>
                월 약 {Math.round(currentSummary.maxAnnualPayoutWon / 120000).toLocaleString()}만원
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>1,500만 초과 연수</div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: currentSummary.totalExcessYears > 0 ? "#f87171" : "#34d399",
                  marginTop: 4,
                }}
              >
                {currentSummary.totalExcessYears > 0 ? `${currentSummary.totalExcessYears}개 연도` : "0년 (안전)"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>
                {currentSummary.totalExcessYears > 0 ? "16.5% 또는 종합과세 적용" : "저율과세 3.3~5.5%"}
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>예상 절세 기회</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>
                {currentSummary.potentialTaxSavingsWon > 0 ? formatManwon(currentSummary.potentialTaxSavingsWon) : "0원 (최적)"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>수령기간 분산 시 절감액</div>
            </div>
          </div>

          {/* Spread Optimization Recommendation Panel */}
          {currentSummary.status === "WARNING" ? (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.2rem" }}>💡</span>
                <span style={{ fontWeight: 700, color: "#fbbf24", fontSize: "0.95rem" }}>
                  CFP 전문가 절세 처방: 수령 기간을 {currentSummary.recommendedReceivingPeriod}년으로 연장하세요
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                현재 {currentSummary.personLabel}의 사적연금 수령 기간({currentSummary.currentReceivingPeriod}년) 동안 연간 최대{" "}
                <b style={{ color: "#f87171" }}>{formatManwon(currentSummary.maxAnnualPayoutWon)}</b>이 지급되어 1,500만원을 초과하고 있습니다.
                수령 기간을 <b style={{ color: "#38bdf8" }}>{currentSummary.recommendedReceivingPeriod}년</b>으로 연장(분산)하면,
                모든 연도의 연간 수령액이 1,500만원 이하로 안분되어 16.5% 분리과세(또는 종합과세)를 피하고 전액 저율 연금소득세(3.3~5.5%)를 적용받아{" "}
                <b style={{ color: "#fbbf24" }}>총 {formatManwon(currentSummary.potentialTaxSavingsWon)}의 세금을 절감</b>할 수 있습니다.
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: "14px 18px",
                borderRadius: "12px",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: "#34d399", fontSize: "0.9rem" }}>
                  {currentSummary.personLabel}의 사적연금은 전 연도 1,500만원 한도를 준수하고 있습니다!
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>
                  모든 연도에서 3.3%~5.5%의 저율 연금소득세만 부과되므로 추가적인 수령 기간 연장이 필요하지 않습니다.
                </div>
              </div>
            </div>
          )}

          {/* Year-by-Year Detail Table */}
          <div style={{ border: "1px solid #1e293b", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", backgroundColor: "#0f172a", borderBottom: "1px solid #1e293b", fontWeight: 600, fontSize: "0.85rem" }}>
              연도별 사적연금 수령액 및 세금 시뮬레이션
            </div>
            <div style={{ maxHeight: "260px", overflowY: "auto" }}>
              {currentSummary.yearDetails.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                  등록된 사적연금(연금저축/IRP) 데이터가 없거나 수령 대상 연도가 없습니다.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "right" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>연도 (나이)</th>
                      <th style={{ padding: "8px 12px" }}>연간 수령액</th>
                      <th style={{ padding: "8px 12px" }}>월 수령액</th>
                      <th style={{ padding: "8px 12px" }}>1,500만 판정</th>
                      <th style={{ padding: "8px 12px" }}>저율과세(A)</th>
                      <th style={{ padding: "8px 12px" }}>적용세금(B)</th>
                      <th style={{ padding: "8px 12px" }}>초과 페널티(B-A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSummary.yearDetails.map((y) => (
                      <tr
                        key={y.year}
                        style={{
                          borderBottom: "1px solid #1e293b",
                          backgroundColor: y.isOverLimit ? "rgba(239, 68, 68, 0.06)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "8px 12px", textAlign: "left", color: "#f8fafc" }}>
                          {y.year}년 ({y.age}세)
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: y.isOverLimit ? "#f87171" : "#e2e8f0" }}>
                          {formatManwon(y.annualPayoutWon)}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#94a3b8" }}>
                          {Math.round(y.annualPayoutWon / 120000).toLocaleString()}만원
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              backgroundColor: y.isOverLimit ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                              color: y.isOverLimit ? "#f87171" : "#34d399",
                            }}
                          >
                            {y.isOverLimit ? `+${formatManwon(y.excessWon)} 초과` : "한도 내"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "#94a3b8" }}>
                          {formatManwon(y.normalLowTaxWon)} ({(y.lowRate * 100).toFixed(1)}%)
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: y.isOverLimit ? "#fbbf24" : "#94a3b8" }}>
                          {formatManwon(y.appliedTaxWon)} {y.isOverLimit && `(${y.betterOption === "SEPARATE_16_5" ? "16.5% 분리" : "종합"})`}
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: y.penaltyTaxWon > 0 ? "#f87171" : "#64748b" }}>
                          {y.penaltyTaxWon > 0 ? `+${formatManwon(y.penaltyTaxWon)}` : "0원"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #2d3748",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#0f172a",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            * 연간 1,500만원 기준은 세액공제 혜택을 받은 연금저축/IRP 원금 및 운용수익 합산 기준입니다.
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
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
