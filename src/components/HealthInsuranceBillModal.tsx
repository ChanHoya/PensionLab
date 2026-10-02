"use client";

import React, { useState, useMemo } from "react";
import { usePensionStore } from "@/store/usePensionStore";
import { calculateLocalHealthInsuranceBill } from "@/services/localHealthInsuranceCalculator";

interface HealthInsuranceBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HealthInsuranceBillModal({ isOpen, onClose }: HealthInsuranceBillModalProps) {
  const store = usePensionStore();

  // 사용자 조정 가능한 슬라이더 상태 (기본값은 스토어 데이터)
  const initialPropertyManwon = store.simulationParams.propertyTaxBase || 30000; // 기본 3억원
  const initialFinancialManwon = store.simulationParams.financialIncome || 500; // 기본 500만원
  const initialPublicPensionManwon = Math.round((store.nationalPension.expectedMonthlyPension || 120) * 12); // 연간 국민연금
  const initialSalaryManwon = Math.round((store.nationalPension.currentStandardMonthlyIncome || 4500000) / 10000);

  const [propertyTaxBaseManwon, setPropertyTaxBaseManwon] = useState<number>(initialPropertyManwon);
  const [financialIncomeManwon, setFinancialIncomeManwon] = useState<number>(initialFinancialManwon);
  const [publicPensionManwon] = useState<number>(initialPublicPensionManwon);
  const [lastSalaryManwon, setLastSalaryManwon] = useState<number>(initialSalaryManwon);

  const bill = useMemo(() => {
    return calculateLocalHealthInsuranceBill({
      propertyTaxBaseWon: propertyTaxBaseManwon * 10000,
      annualPublicPensionWon: publicPensionManwon * 10000,
      annualFinancialIncomeWon: financialIncomeManwon * 10000,
      lastStandardMonthlySalaryWon: lastSalaryManwon * 10000,
    });
  }, [propertyTaxBaseManwon, financialIncomeManwon, publicPensionManwon, lastSalaryManwon]);

  if (!isOpen) return null;

  const formatWon = (won: number) => `${Math.round(won).toLocaleString()}원`;
  const formatManwon = (won: number) => `${(won / 10000).toFixed(1)}만원`;

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
          maxWidth: "920px",
          maxHeight: "92vh",
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
              <span style={{ fontSize: "1.4rem" }}>🏥</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc" }}>
                은퇴 후 지역건강보험료 모의 고지서 & 임의계속가입(36개월)
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  backgroundColor: bill.dependentStatus.isEligible ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: bill.dependentStatus.isEligible ? "#34d399" : "#f87171",
                  border: bill.dependentStatus.isEligible ? "1px solid #059669" : "1px solid #dc2626",
                }}
              >
                {bill.dependentStatus.isEligible ? "피부양자 유지 가능" : "지역가입자 전환 대상"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
              2024~2026년 국민건강보험법 기준 — 재산세 과세표준(1억원 기본공제)과 공적연금(50% 반영), 금융소득을 반영한 실제 고지서 시뮬레이션
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

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Voluntary Continuation Highlight Banner */}
          {bill.voluntaryContinuation.isAdvantageous && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                backgroundColor: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>⚡</span>
                  <span style={{ fontWeight: 700, color: "#38bdf8", fontSize: "0.95rem" }}>
                    임의계속가입(36개월) 추천: 3년간 총 {formatManwon(bill.voluntaryContinuation.total36MonthsSavingsWon)} 절감!
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#0284c7",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  월 {formatManwon(bill.voluntaryContinuation.monthlySavingsWon)} 절약
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                {bill.voluntaryContinuation.recommendation}
              </p>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                <span>📌</span>
                <span>{bill.voluntaryContinuation.deadlineNotice}</span>
              </div>
            </div>
          )}

          {/* Two-Column Layout: Bill Paper (Left) + Sliders & Dependent Status (Right) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* Left: Bill Paper Styled Container */}
            <div
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #334155", paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f8fafc" }}>
                  📋 국민건강보험공단 모의 고지서
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>2026년 기준 7.09%</span>
              </div>

              {/* Bill Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.85rem" }}>
                {/* Property Fee */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#e2e8f0" }}>① 재산 보험료</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 6 }}>
                      (과표 {formatManwon(bill.propertyTaxBaseWon)} - 1억 공제, {bill.propertyPoints}점)
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, color: "#f8fafc" }}>{formatWon(bill.propertyFeeMonthlyWon)}</span>
                </div>

                {/* Public Pension Fee */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#e2e8f0" }}>② 공적연금 소득 보험료</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 6 }}>
                      (연 {formatManwon(bill.annualPublicPensionWon)}의 50% 인정)
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, color: "#f8fafc" }}>{formatWon(bill.publicPensionFeeMonthlyWon)}</span>
                </div>

                {/* Financial Income Fee */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#e2e8f0" }}>③ 금융소득 보험료</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 6 }}>
                      {bill.annualFinancialIncomeWon > 10000000
                        ? `(연 ${formatManwon(bill.annualFinancialIncomeWon)} 전액 과세)`
                        : `(연 1,000만원 이하 0원)`}
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, color: bill.financialFeeMonthlyWon > 0 ? "#f87171" : "#34d399" }}>
                    {formatWon(bill.financialFeeMonthlyWon)}
                  </span>
                </div>

                {/* Private Pension (Tax-Free) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#e2e8f0" }}>④ 사적연금(연금저축/IRP)</span>
                    <span style={{ fontSize: "0.75rem", color: "#34d399", marginLeft: 6 }}>
                      (현행 건강보험료 완전 비과세)
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, color: "#34d399" }}>0원</span>
                </div>

                <div style={{ height: "1px", backgroundColor: "#1e293b", margin: "4px 0" }} />

                {/* Base Health Fee Subtotal */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8" }}>
                  <span>건강보험료 소계</span>
                  <span>{formatWon(bill.healthInsuranceMonthlyWon)}</span>
                </div>

                {/* Long Term Care Fee */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8" }}>
                  <div>
                    <span>장기요양보험료</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 6 }}>(건보료의 12.95%)</span>
                  </div>
                  <span>{formatWon(bill.longTermCareMonthlyWon)}</span>
                </div>

                <div style={{ height: "2px", borderTop: "2px solid #334155", margin: "6px 0 2px" }} />

                {/* Total Monthly Bill */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#38bdf8" }}>
                    🧾 최종 월 지역건보료
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#38bdf8" }}>
                      {formatWon(bill.totalLocalBillMonthlyWon)}
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      (연간 {formatManwon(bill.totalLocalBillMonthlyWon * 12)})
                    </div>
                  </div>
                </div>

                {/* Workplace Comparison Line */}
                <div
                  style={{
                    marginTop: 8,
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "#1e293b",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>종전 직장보험료 (본인부담)</span>
                  <span style={{ fontWeight: 700, color: "#f8fafc" }}>
                    {formatWon(bill.totalWorkplaceBillMonthlyWon)} / 월
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Interactive Sliders & Dependent Status */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Dependent Eligibility Card */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  backgroundColor: bill.dependentStatus.isEligible ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: bill.dependentStatus.isEligible ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: bill.dependentStatus.isEligible ? "#34d399" : "#f87171" }}>
                  {bill.dependentStatus.isEligible ? "🛡️ 자녀 직장 피부양자 등재 가능" : "⚠️ 피부양자 자격 박탈 (지역 전환)"}
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                  {bill.dependentStatus.reason}
                </p>
              </div>

              {/* Sliders Box */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#f8fafc", borderBottom: "1px solid #1e293b", paddingBottom: 6 }}>
                  ⚙️ 내 자산·소득 기준 모의 조정
                </div>

                {/* Slider 1: Property Tax Base */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 }}>
                    <span style={{ color: "#94a3b8" }}>재산세 과세표준 (주택/토지)</span>
                    <span style={{ fontWeight: 600, color: "#38bdf8" }}>{formatManwon(propertyTaxBaseManwon * 10000)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={150000} // 15억원
                    step={1000}
                    value={propertyTaxBaseManwon}
                    onChange={(e) => setPropertyTaxBaseManwon(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
                  />
                  <div style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                    <span>0원</span>
                    <span>시세의 약 60%</span>
                    <span>15억원</span>
                  </div>
                </div>

                {/* Slider 2: Financial Income */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 }}>
                    <span style={{ color: "#94a3b8" }}>연간 금융소득 (배당/이자)</span>
                    <span style={{ fontWeight: 600, color: financialIncomeManwon > 1000 ? "#f87171" : "#34d399" }}>
                      연 {financialIncomeManwon.toLocaleString()}만원
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4000} // 4000만원
                    step={100}
                    value={financialIncomeManwon}
                    onChange={(e) => setFinancialIncomeManwon(Number(e.target.value))}
                    style={{ width: "100%", accentColor: financialIncomeManwon > 1000 ? "#f87171" : "#38bdf8", cursor: "pointer" }}
                  />
                  <div style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                    <span>0원</span>
                    <span style={{ color: "#fbbf24" }}>1,000만원 허들</span>
                    <span>4,000만원</span>
                  </div>
                </div>

                {/* Slider 3: Last Salary */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 }}>
                    <span style={{ color: "#94a3b8" }}>종전 직장 기준소득월액 (퇴직 직전)</span>
                    <span style={{ fontWeight: 600, color: "#38bdf8" }}>월 {lastSalaryManwon.toLocaleString()}만원</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={600}
                    step={10}
                    value={lastSalaryManwon}
                    onChange={(e) => setLastSalaryManwon(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
                  />
                  <div style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                    <span>월 200만원</span>
                    <span>공단 상한 617만원</span>
                  </div>
                </div>
              </div>
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
            * 2024년 2월 제도 개편에 따라 자동차 건보료는 완전 폐지(0원)되었으며, 재산 과표 1억원 기본공제가 적용됩니다.
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
