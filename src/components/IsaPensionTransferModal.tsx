"use client";

import React, { useState, useMemo } from "react";
import { usePensionStore } from "@/store/usePensionStore";
import {
  calculateIsaPensionTransfer,
} from "@/services/isaPensionTransferCalculator";

interface IsaPensionTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IsaPensionTransferModal({ isOpen, onClose }: IsaPensionTransferModalProps) {
  const store = usePensionStore();

  const initialSalaryManwon = Math.round(
    (store.nationalPension.currentStandardMonthlyIncome || 4500000) * 12 / 10000
  ) || 6000;

  // 로컬 슬라이더 상태
  const [isaMaturityManwon, setIsaMaturityManwon] = useState<number>(3000); // 3,000만원
  const [salaryManwon, setSalaryManwon] = useState<number>(initialSalaryManwon); // 총급여
  const [regularDepositManwon, setRegularDepositManwon] = useState<number>(900); // 기본 연금 납입 900만원
  const [cycles, setCycles] = useState<number>(3); // 3회 (9년)

  const result = useMemo(() => {
    return calculateIsaPensionTransfer({
      isaMaturityAmountWon: isaMaturityManwon * 10000,
      annualSalaryWon: salaryManwon * 10000,
      annualRegularPensionDepositWon: regularDepositManwon * 10000,
      rollingOverCycles: cycles,
    });
  }, [isaMaturityManwon, salaryManwon, regularDepositManwon, cycles]);

  if (!isOpen) return null;

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
              <span style={{ fontSize: "1.6rem" }}>💎</span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                ISA 만기 자금 연금계좌 전환 & 절세 3총사 플래너
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  color: "#0284c7",
                  background: "rgba(2, 132, 199, 0.12)",
                  border: "1px solid rgba(2, 132, 199, 0.3)",
                }}
              >
                {result.taxCreditRateLabel}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.825rem",
                color: "var(--text-secondary, #64748b)",
                margin: "4px 0 0 0",
              }}
            >
              조세특례제한법 제91조의18: 3년 만기 ISA 전환액의 10%(최대 300만원)를 추가 세액공제받아 연간 최대 1,200만원까지 환급받는 풍차돌리기 전략입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary, #64748b)",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* 상단 핵심 KPI 4종 카드 */}
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
              ISA 전환 추가 공제 한도
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#0284c7" }}>
              +{(result.isaTransferTaxCreditWon / 10000).toLocaleString()}만원
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              전환금액({isaMaturityManwon}만)의 10% (상한 300만)
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
              당해 연도 총 공제 인정액
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#9333ea" }}>
              {(result.totalTaxCreditEligibleWon / 10000).toLocaleString()}만원
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              기본 연금 {regularDepositManwon}만 + ISA {result.isaTransferTaxCreditWon / 10000}만
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
              당해 연말정산 총 환급액
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#059669" }}>
              {(result.totalAnnualTaxRefundWon / 10000).toFixed(1)}만원
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              ISA 보너스 환급 {(result.isaBonusTaxRefundWon / 10000).toFixed(1)}만원 포함
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
              {cycles * 3}개년 누적 절세 환급액
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#d97706" }}>
              {(result.cumulativeTaxBenefitWon / 10000).toFixed(0)}만원
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
              3년 풍차돌리기 {cycles}회 반복 기준
            </div>
          </div>
        </div>

        {/* 조절 슬라이더 영역 */}
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
            ⚙️ 전환 자금 및 소득 조건 시뮬레이션
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {/* ISA 만기 자금 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>ISA 3년 만기 해지 자금</span>
                <span style={{ fontWeight: 700, color: "#0284c7" }}>{isaMaturityManwon}만원</span>
              </div>
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={isaMaturityManwon}
                onChange={(e) => setIsaMaturityManwon(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 총급여 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>근로자 연간 총급여</span>
                <span style={{ fontWeight: 700, color: salaryManwon <= 5500 ? "#059669" : "#0284c7" }}>
                  {salaryManwon}만원 {salaryManwon <= 5500 ? "(16.5% 우대)" : "(13.2%)"}
                </span>
              </div>
              <input
                type="range"
                min={3000}
                max={12000}
                step={500}
                value={salaryManwon}
                onChange={(e) => setSalaryManwon(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 기본 연금 납입액 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>정기 연금저축/IRP 연 납입액</span>
                <span style={{ fontWeight: 700, color: "#9333ea" }}>{regularDepositManwon}만원</span>
              </div>
              <input
                type="range"
                min={0}
                max={900}
                step={50}
                value={regularDepositManwon}
                onChange={(e) => setRegularDepositManwon(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 풍차돌리기 반복 횟수 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>3년 풍차돌리기 반복 횟수</span>
                <span style={{ fontWeight: 700, color: "#d97706" }}>{cycles}회 ({cycles * 3}개년)</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={cycles}
                onChange={(e) => setCycles(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>
          </div>
        </div>

        {/* 절세 3총사 계좌 비교표 */}
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
            📑 절세 3총사 계좌(일반 vs ISA vs 연금저축/IRP) 핵심 세제 비교
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.75rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "var(--modal-table-th, #f8fafc)", borderBottom: "1px solid var(--modal-table-border, #e2e8f0)" }}>
                  <th style={{ padding: "8px 10px", width: "18%", color: "var(--text-muted, #64748b)" }}>구분</th>
                  <th style={{ padding: "8px 10px", width: "24%", color: "var(--text-secondary, #64748b)" }}>일반 위탁계좌</th>
                  <th style={{ padding: "8px 10px", width: "29%", color: "#0284c7" }}>ISA 계좌</th>
                  <th style={{ padding: "8px 10px", width: "29%", color: "#9333ea" }}>연금저축 / IRP</th>
                </tr>
              </thead>
              <tbody>
                {result.comparisonTable.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--modal-border-subtle, #f1f5f9)" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--text-primary)" }}>{row.feature}</td>
                    <td style={{ padding: "8px 10px", color: "var(--text-secondary, #64748b)" }}>{row.generalAccount}</td>
                    <td style={{ padding: "8px 10px", color: "#0284c7", fontWeight: 500 }}>{row.isaAccount}</td>
                    <td style={{ padding: "8px 10px", color: "#9333ea", fontWeight: 500 }}>{row.pensionAccount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 전문가 권고 박스 */}
        <div
          style={{
            background: "rgba(2, 132, 199, 0.08)",
            border: "1px solid rgba(2, 132, 199, 0.25)",
            borderRadius: "10px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0284c7", marginBottom: "6px" }}>
            💡 CFP 은퇴설계 전문가 ISA 풍차돌리기 조언
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", lineHeight: 1.6 }}>
            {result.expertTips.map((tip, idx) => (
              <li key={idx} style={{ color: "var(--text-secondary, #475569)", marginTop: "2px" }}>
                {tip}
              </li>
            ))}
          </ul>
        </div>

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
