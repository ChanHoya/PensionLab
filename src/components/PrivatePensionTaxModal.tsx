"use client";

import React, { useState, useMemo } from "react";
import { usePensionStore } from "@/store/usePensionStore";
import { runCoupleSimulation } from "@/services/coupleSimulation";
import {
  analyzePrivatePensionTax,
  PRIVATE_PENSION_TAX_LIMIT,
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
        className="t-modal-spring"
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          backgroundColor: "var(--modal-bg, #ffffff)",
          border: "1px solid var(--modal-border, #e2e8f0)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--text-primary, #0f1127)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--modal-bg, #ffffff)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.4rem" }}>⚖️</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary, #0f1127)" }}>
                사적연금 연 1,500만원 절세 한도 최적화기
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  backgroundColor:
                    taxAnalysis.householdStatus === "SAFE" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: taxAnalysis.householdStatus === "SAFE" ? "#059669" : "#dc2626",
                  border:
                    taxAnalysis.householdStatus === "SAFE" ? "1px solid #10b981" : "1px solid #ef4444",
                }}
              >
                {taxAnalysis.householdStatus === "SAFE" ? "전 연도 1,500만 한도 내 안전" : "절세 초과 구간 발생"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-secondary, #64748b)" }}>
              소득세법 제20조의3·제129조의2 — 연금저축/IRP 연간 사적연금 수령액이 1,500만원(월 125만원)을 초과하면 저율과세(3.3~5.5%)가 배제되고 16.5% 분리과세 또는 종합과세가 적용됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #64748b)",
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
          <div style={{ display: "flex", padding: "10px 24px 0", gap: 8, borderBottom: "1px solid var(--modal-border, #e2e8f0)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("SELF")}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                borderBottom: activeTab === "SELF" ? "2px solid #0284c7" : "2px solid transparent",
                color: activeTab === "SELF" ? "#0284c7" : "var(--text-muted, #64748b)",
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
                borderBottom: activeTab === "SPOUSE" ? "2px solid #0284c7" : "2px solid transparent",
                color: activeTab === "SPOUSE" ? "#0284c7" : "var(--text-muted, #64748b)",
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
            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>법정 분리과세 한도</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0284c7", marginTop: 4 }}>
                연 1,500만원
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>월 125만원 기준</div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>최대 연간 수령액</div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: currentSummary.maxAnnualPayoutWon > PRIVATE_PENSION_TAX_LIMIT ? "#dc2626" : "#059669",
                  marginTop: 4,
                }}
              >
                {formatManwon(currentSummary.maxAnnualPayoutWon)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>
                월 약 {Math.round(currentSummary.maxAnnualPayoutWon / 120000).toLocaleString()}만원
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>1,500만 초과 연수</div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: currentSummary.totalExcessYears > 0 ? "#dc2626" : "#059669",
                  marginTop: 4,
                }}
              >
                {currentSummary.totalExcessYears > 0 ? `${currentSummary.totalExcessYears}개 연도` : "0년 (안전)"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>
                {currentSummary.totalExcessYears > 0 ? "16.5% 또는 종합과세 적용" : "저율과세 3.3~5.5%"}
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>예상 절세 기회</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d97706", marginTop: 4 }}>
                {currentSummary.potentialTaxSavingsWon > 0 ? formatManwon(currentSummary.potentialTaxSavingsWon) : "0원 (최적)"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>수령기간 분산 시 절감액</div>
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
                <span style={{ fontWeight: 700, color: "#d97706", fontSize: "0.95rem" }}>
                  CFP 전문가 절세 처방: 수령 기간을 {currentSummary.recommendedReceivingPeriod}년으로 연장하세요
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary, #475569)", lineHeight: 1.5 }}>
                현재 {currentSummary.personLabel}의 사적연금 수령 기간({currentSummary.currentReceivingPeriod}년) 동안 연간 최대{" "}
                <b style={{ color: "#dc2626" }}>{formatManwon(currentSummary.maxAnnualPayoutWon)}</b>이 지급되어 1,500만원을 초과하고 있습니다.
                수령 기간을 <b style={{ color: "#0284c7" }}>{currentSummary.recommendedReceivingPeriod}년</b>으로 연장(분산)하면,
                모든 연도의 연간 수령액이 1,500만원 이하로 안분되어 16.5% 분리과세(또는 종합과세)를 피하고 전액 저율 연금소득세(3.3~5.5%)를 적용받아{" "}
                <b style={{ color: "#d97706" }}>총 {formatManwon(currentSummary.potentialTaxSavingsWon)}의 세금을 절감</b>할 수 있습니다.
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
                <div style={{ fontWeight: 700, color: "#059669", fontSize: "0.9rem" }}>
                  {currentSummary.personLabel}의 사적연금은 전 연도 1,500만원 한도를 준수하고 있습니다!
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #64748b)", marginTop: 2 }}>
                  모든 연도에서 3.3%~5.5%의 저율 연금소득세만 부과되므로 추가적인 수령 기간 연장이 필요하지 않습니다.
                </div>
              </div>
            </div>
          )}

          {/* Year-by-Year Detail Table */}
          <div style={{ border: "1px solid var(--modal-border, #e2e8f0)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", backgroundColor: "var(--modal-subbox-bg, #f8fafc)", borderBottom: "1px solid var(--modal-border, #e2e8f0)", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary, #0f1127)" }}>
              연도별 사적연금 수령액 및 세금 시뮬레이션
            </div>
            <div style={{ maxHeight: "260px", overflowY: "auto" }}>
              {currentSummary.yearDetails.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted, #64748b)", fontSize: "0.85rem" }}>
                  등록된 사적연금(연금저축/IRP) 데이터가 없거나 수령 대상 연도가 없습니다.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "right" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--modal-table-th, #f8fafc)", color: "var(--text-muted, #64748b)", borderBottom: "1px solid var(--modal-table-border, #e2e8f0)" }}>
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
                          borderBottom: "1px solid var(--modal-border-subtle, #f1f5f9)",
                          backgroundColor: y.isOverLimit ? "rgba(239, 68, 68, 0.06)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-primary, #0f1127)" }}>
                          {y.year}년 ({y.age}세)
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: y.isOverLimit ? "#dc2626" : "var(--text-primary, #0f1127)" }}>
                          {formatManwon(y.annualPayoutWon)}
                        </td>
                        <td style={{ padding: "8px 12px", color: "var(--text-secondary, #64748b)" }}>
                          {Math.round(y.annualPayoutWon / 120000).toLocaleString()}만원
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              backgroundColor: y.isOverLimit ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                              color: y.isOverLimit ? "#dc2626" : "#059669",
                            }}
                          >
                            {y.isOverLimit ? `+${formatManwon(y.excessWon)} 초과` : "한도 내"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "var(--text-secondary, #64748b)" }}>
                          {formatManwon(y.normalLowTaxWon)} ({(y.lowRate * 100).toFixed(1)}%)
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: y.isOverLimit ? "#d97706" : "var(--text-secondary, #64748b)" }}>
                          {formatManwon(y.appliedTaxWon)} {y.isOverLimit && `(${y.betterOption === "SEPARATE_16_5" ? "16.5% 분리" : "종합"})`}
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: y.penaltyTaxWon > 0 ? "#dc2626" : "var(--text-muted, #94a3b8)" }}>
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
            borderTop: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--modal-subbox-bg, #f8fafc)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
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
