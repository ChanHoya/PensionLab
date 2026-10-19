"use client";

import React, { useState } from "react";
import { generateTaxAndHealthStatement, IntegratedTaxAndHealthStatement } from "@/services/taxAndHealthStatementService";

interface TaxAndHealthStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  age?: number;
  hasSpouse?: boolean;
  spouseAge?: number;
  retirementAge?: number;
  annualNationalPensionWon?: number;
  annualRetirementPensionWon?: number;
  annualPersonalPensionWon?: number;
  annualFinancialWon?: number;
  propertyTaxBaseWon?: number;
}

export default function TaxAndHealthStatementModal({
  isOpen,
  onClose,
  age = 65,
  hasSpouse = true,
  spouseAge = 63,
  retirementAge = 60,
  annualNationalPensionWon = 15600000,
  annualRetirementPensionWon = 12000000,
  annualPersonalPensionWon = 6000000,
  annualFinancialWon = 8000000,
  propertyTaxBaseWon = 350000000,
}: TaxAndHealthStatementModalProps) {
  const [activeTab, setActiveTab] = useState<"statement" | "guide">("statement");

  if (!isOpen) return null;

  const stmt: IntegratedTaxAndHealthStatement = generateTaxAndHealthStatement({
    age,
    hasSpouse,
    spouseAge,
    retirementAge,
    annualNationalPensionWon,
    annualRetirementPensionWon,
    annualPersonalPensionWon,
    annualFinancialWon,
    propertyTaxBaseWon,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-statement-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="t-modal-spring"
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          backgroundColor: "var(--modal-bg, #ffffff)",
          color: "var(--modal-text, #0f172a)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--modal-border, #e2e8f0)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>📑</span>
            <div>
              <h2
                id="tax-statement-modal-title"
                style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--modal-title, #0f172a)" }}
              >
                은퇴 세금 & 건강보험료 모의 고지서 통합 명세서
              </h2>
              <p style={{ fontSize: "12px", color: "var(--color-muted, #64748b)", margin: "2px 0 0" }}>
                소득세법 제20조의3 & 국민건강보험법 제69조 기준 가상 모의 산출 내역
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              🖨️ A4 명세서 인쇄
            </button>
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--modal-border, #e2e8f0)",
                background: "transparent",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-muted, #64748b)",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 탭 바 */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            padding: "0 24px",
            backgroundColor: "var(--modal-surface, #f8fafc)",
          }}
        >
          <button
            onClick={() => setActiveTab("statement")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: activeTab === "statement" ? "700" : "500",
              color: activeTab === "statement" ? "#2563eb" : "var(--color-muted, #64748b)",
              borderBottom: activeTab === "statement" ? "2px solid #2563eb" : "2px solid transparent",
              background: "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
            }}
          >
            📋 통합 고지서 명세표
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: activeTab === "guide" ? "700" : "500",
              color: activeTab === "guide" ? "#2563eb" : "var(--color-muted, #64748b)",
              borderBottom: activeTab === "guide" ? "2px solid #2563eb" : "2px solid transparent",
              background: "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
            }}
          >
            💡 절세 & 건보료 방어 팁 ({stmt.actionableTips.length})
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {activeTab === "statement" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 상단 4대 요약 카드 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "600" }}>월 총 연금소득 (세전)</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px" }}>
                    {(stmt.netIncome.monthlyGrossWon / 10000).toLocaleString()}만 원
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                    연간 {(stmt.incomes.totalAnnualIncomeWon / 10000).toLocaleString()}만 원
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600" }}>월 세금 + 건보료 공제</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>
                    -{(stmt.netIncome.monthlyTotalDeductionWon / 10000).toLocaleString()}만 원
                  </div>
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px" }}>
                    실질 공제율 {Number((100 - stmt.netIncome.netIncomeRatio).toFixed(1))}%
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "600" }}>월 순 실수령액 (통장 입금)</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                    {(stmt.netIncome.monthlyNetWon / 10000).toLocaleString()}만 원
                  </div>
                  <div style={{ fontSize: "11px", color: "#059669", marginTop: "2px" }}>
                    실수령 비율 {stmt.netIncome.netIncomeRatio}%
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: stmt.healthInsurance.isEligibleDependent
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(245, 158, 11, 0.08)",
                    border: `1px solid ${
                      stmt.healthInsurance.isEligibleDependent ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: stmt.healthInsurance.isEligibleDependent ? "#10b981" : "#f59e0b",
                      fontWeight: "600",
                    }}
                  >
                    건보료 피부양자 자격
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      marginTop: "6px",
                      color: stmt.healthInsurance.isEligibleDependent ? "#059669" : "#d97706",
                    }}
                  >
                    {stmt.healthInsurance.isEligibleDependent ? "✅ 자격 유지 가능" : "⚠️ 지역가입자 전환"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                    {stmt.healthInsurance.isEligibleDependent
                      ? "월 건보료 0원 세이브"
                      : `월 ${(stmt.healthInsurance.totalMonthlyHealthFeeWon / 10000).toLocaleString()}만 원 부과`}
                  </div>
                </div>
              </div>

              {/* 공식 고지서 양식 테이블 */}
              <div
                style={{
                  border: "1px solid var(--modal-border, #cbd5e1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "var(--modal-surface-card, #ffffff)",
                }}
              >
                <div
                  style={{
                    padding: "12px 18px",
                    backgroundColor: "var(--modal-surface, #f1f5f9)",
                    borderBottom: "1px solid var(--modal-border, #cbd5e1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "700" }}>🏛️ {stmt.taxYear}년도 은퇴 소득 및 세무·건보 고지 내역</span>
                  <span style={{ fontSize: "12px", color: "var(--color-muted, #64748b)" }}>
                    납세자: 만 {stmt.personalInfo.age}세 (배우자 {stmt.personalInfo.hasSpouse ? `만 ${stmt.personalInfo.spouseAge}세` : "없음"})
                  </span>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--modal-surface-sub, #f8fafc)", borderBottom: "1px solid var(--modal-border, #e2e8f0)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", width: "25%" }}>과세/부과 구분</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", width: "25%" }}>산정 소득/과세표준</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", width: "20%" }}>적용 세율/점수</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", width: "30%" }}>월 납부 예상액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 공적연금 세금 */}
                    <tr style={{ borderBottom: "1px solid var(--modal-border, #f1f5f9)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600" }}>공적연금 (국민연금) 소득세</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        {(stmt.incomes.annualNationalPensionWon / 10000).toLocaleString()}만 원/년
                        <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>
                          과표: {(stmt.taxes.publicTaxBaseWon / 10000).toLocaleString()}만 원
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>누진간이세율</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>
                        {(Math.round(stmt.taxes.publicEstimatedAnnualTaxWon / 12) / 10000).toLocaleString()}만 원/월
                        <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>
                          연 {(stmt.taxes.publicEstimatedAnnualTaxWon / 10000).toLocaleString()}만 원
                        </div>
                      </td>
                    </tr>

                    {/* 사적연금 세금 */}
                    <tr style={{ borderBottom: "1px solid var(--modal-border, #f1f5f9)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600" }}>사적연금 (퇴직+개인) 소득세</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        {(stmt.taxes.privatePensionIncomeWon / 10000).toLocaleString()}만 원/년
                        <div style={{ fontSize: "11px", color: stmt.taxes.privatePensionTaxRate > 0.1 ? "#ef4444" : "#10b981" }}>
                          {stmt.taxes.privatePensionTaxRate > 0.1 ? "1,500만 초과" : "1,500만 이하 충족"}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        {Number((stmt.taxes.privatePensionTaxRate * 100).toFixed(1))}% (분리과세)
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>
                        {(Math.round(stmt.taxes.privatePensionAnnualTaxWon / 12) / 10000).toLocaleString()}만 원/월
                        <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>
                          연 {(stmt.taxes.privatePensionAnnualTaxWon / 10000).toLocaleString()}만 원
                        </div>
                      </td>
                    </tr>

                    {/* 금융소득 세금 */}
                    <tr style={{ borderBottom: "1px solid var(--modal-border, #cbd5e1)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600" }}>배당·이자 금융소득세</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        {(stmt.incomes.annualFinancialWon / 10000).toLocaleString()}만 원/년
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>15.4% (원천징수)</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>
                        {(Math.round(stmt.taxes.financialAnnualTaxWon / 12) / 10000).toLocaleString()}만 원/월
                        <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>
                          연 {(stmt.taxes.financialAnnualTaxWon / 10000).toLocaleString()}만 원
                        </div>
                      </td>
                    </tr>

                    {/* 건보료 - 재산분 */}
                    <tr style={{ borderBottom: "1px solid var(--modal-border, #f1f5f9)", backgroundColor: "rgba(248, 250, 252, 0.5)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600" }}>지역건보료: 재산분</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        과표 {(stmt.healthInsurance.propertyTaxBaseWon / 10000).toLocaleString()}만 원
                        <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>1억원 기본 공제 반영</div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>{stmt.healthInsurance.propertyPoints}점 (점당 208.4원)</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>
                        {(stmt.healthInsurance.monthlyPropertyFeeWon / 10000).toLocaleString()}만 원/월
                      </td>
                    </tr>

                    {/* 건보료 - 연금/금융 소득분 */}
                    <tr style={{ borderBottom: "1px solid var(--modal-border, #f1f5f9)", backgroundColor: "rgba(248, 250, 252, 0.5)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600" }}>지역건보료: 소득분</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        공적연금 50% + 초과금융소득
                        <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>사적연금은 비과세 (0원)</div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>7.09% 부과</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>
                        {(
                          (stmt.healthInsurance.monthlyPublicPensionFeeWon + stmt.healthInsurance.monthlyFinancialFeeWon) /
                          10000
                        ).toLocaleString()}
                        만 원/월
                      </td>
                    </tr>

                    {/* 장기요양보험료 */}
                    <tr style={{ borderBottom: "1px solid var(--modal-border, #cbd5e1)", backgroundColor: "rgba(248, 250, 252, 0.5)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600" }}>노인장기요양보험료</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        건보료 기본액 {(stmt.healthInsurance.monthlyBaseHealthFeeWon / 10000).toLocaleString()}만 원
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>12.95% 부과</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>
                        {(stmt.healthInsurance.monthlyLongTermCareFeeWon / 10000).toLocaleString()}만 원/월
                      </td>
                    </tr>

                    {/* 총 공제 합계 */}
                    <tr style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", fontWeight: "700" }}>
                      <td style={{ padding: "12px 14px", color: "#dc2626" }}>공제 총합계 (세금 + 건보료)</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "#dc2626" }}>
                        연 {(stmt.netIncome.annualTotalTaxAndHealthWon / 10000).toLocaleString()}만 원
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "#dc2626" }}>
                        실효율 {Number((100 - stmt.netIncome.netIncomeRatio).toFixed(1))}%
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "#dc2626", fontSize: "14px" }}>
                        월 -{(stmt.netIncome.monthlyTotalDeductionWon / 10000).toLocaleString()}만 원
                      </td>
                    </tr>

                    {/* 최종 순 실수령액 */}
                    <tr style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", fontWeight: "800" }}>
                      <td style={{ padding: "14px 14px", color: "#059669", fontSize: "15px" }}>최종 실수령 연금 (통장 입금액)</td>
                      <td style={{ padding: "14px 14px", textAlign: "right", color: "#059669" }}>
                        연 {(stmt.netIncome.annualNetWon / 10000).toLocaleString()}만 원
                      </td>
                      <td style={{ padding: "14px 14px", textAlign: "center", color: "#059669" }}>
                        실수령 비율 {stmt.netIncome.netIncomeRatio}%
                      </td>
                      <td style={{ padding: "14px 14px", textAlign: "right", color: "#059669", fontSize: "17px" }}>
                        월 {(stmt.netIncome.monthlyNetWon / 10000).toLocaleString()}만 원
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 가이드 및 팁 탭 */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "15px", color: "#2563eb", fontWeight: "700" }}>
                  💡 은퇴 세무·건보 최적화 4대 핵심 원칙
                </h4>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: "1.7", color: "var(--modal-text, #334155)" }}>
                  <li>
                    <strong>사적연금 1,500만원 분산 수령</strong>: 연간 1,500만원 이하로 안분 시 연령에 따라 3.3~5.5% 저율 분리과세 적용 (초과 시 16.5% 분리과세 또는 종합과세).
                  </li>
                  <li>
                    <strong>건보료 사적연금 비과세 활용</strong>: 퇴직연금 및 개인연금은 현행 건강보험료 산정 소득에서 전액 제외(0%)되므로 안전한 현금흐름으로 최적.
                  </li>
                  <li>
                    <strong>퇴직 직후 임의계속가입(36개월) 활용</strong>: 은퇴 직후 재산·공적연금 합산으로 지역건보료가 급등할 경우, 종전 직장 보험료로 최대 3년간 납부하여 수백만 원 절감 가능.
                  </li>
                  <li>
                    <strong>배당 금융소득 1,000만원 허들 관리</strong>: 이자·배당소득이 연 1,000만원을 1원이라도 초과하면 전액 건보료 부과 대상이 되므로, ISA 및 연금계좌를 우선 활용.
                  </li>
                </ul>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "700" }}>📌 맞춤형 처방 내역</h4>
                {stmt.actionableTips.map((tip, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      backgroundColor: "var(--modal-surface, #f8fafc)",
                      border: "1px solid var(--modal-border, #e2e8f0)",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
