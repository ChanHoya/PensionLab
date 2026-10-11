"use client";

import React, { useState, useMemo } from "react";
import { usePensionStore } from "@/store/usePensionStore";
import {
  householdReverseMortgage,
} from "@/services/reverseMortgageCalculator";

interface ReverseMortgageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReverseMortgageModal({ isOpen, onClose }: ReverseMortgageModalProps) {
  const store = usePensionStore();

  const [useReverseMortgage, setUseReverseMortgage] = useState<boolean>(
    store.simulationParams.useReverseMortgage ?? false
  );
  const [houseValueManwon, setHouseValueManwon] = useState<number>(
    store.simulationParams.reverseMortgageHouseValue || 50000 // 기본 5억원
  );
  const [startAge, setStartAge] = useState<number>(
    store.simulationParams.reverseMortgageStartAge || 65 // 기본 65세
  );

  // 부부면 월지급금은 부부 중 연소자 나이 기준 (시뮬레이션과 같은 계산)
  const { hasSpouse, spouseAge, currentAge } = store.simulationParams;
  const spouseAgeGap = hasSpouse ? (spouseAge ?? currentAge) - currentAge : null;
  const estimate = useMemo(() => {
    return householdReverseMortgage(houseValueManwon * 10000, startAge, spouseAgeGap);
  }, [houseValueManwon, startAge, spouseAgeGap]);

  if (!isOpen) return null;

  const handleApply = () => {
    store.setSimulationParams({
      useReverseMortgage,
      reverseMortgageHouseValue: houseValueManwon,
      reverseMortgageStartAge: startAge,
    });
    onClose();
  };

  const formatWon = (won: number) => {
    const manwon = Math.round(won / 10000);
    if (manwon >= 10000) {
      return `${(manwon / 10000).toFixed(1)}억원`;
    }
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
              <span style={{ fontSize: "1.4rem" }}>🏠</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary, #0f1127)" }}>
                주택연금(역모기지) 결합 시뮬레이터
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  backgroundColor: useReverseMortgage ? "rgba(16, 185, 129, 0.15)" : "var(--modal-subbox-bg, #f1f5f9)",
                  color: useReverseMortgage ? "#059669" : "var(--text-muted, #64748b)",
                  border: useReverseMortgage ? "1px solid #10b981" : "1px solid var(--modal-border, #cbd5e1)",
                }}
              >
                {useReverseMortgage ? "시뮬레이션 결합 활성" : "미결합 상태"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-secondary, #64748b)" }}>
              한국주택금융공사(HF) 기준 — 보유 주택을 담보로 평생 매월 연금을 수령하여 은퇴 후 소득 결손을 완벽히 방어합니다.
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

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Toggle Switch Banner */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "12px",
              backgroundColor: useReverseMortgage ? "rgba(16, 185, 129, 0.08)" : "var(--modal-subbox-bg, #f8fafc)",
              border: useReverseMortgage ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--modal-subbox-border, #e2e8f0)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: useReverseMortgage ? "#059669" : "var(--text-primary, #0f1127)" }}>
                대시보드 은퇴 현금흐름에 주택연금 결합하기
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #64748b)", marginTop: 4 }}>
                스위치를 켜면 {startAge}세부터 매월 <b style={{ color: "#0284c7" }}>{estimate.monthlyPayoutManwon.toLocaleString()}만원</b>이 가구 고정 수령액으로 합산됩니다.
              </div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: "52px", height: "28px" }}>
              <input
                type="checkbox"
                checked={useReverseMortgage}
                onChange={(e) => setUseReverseMortgage(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: useReverseMortgage ? "#10b981" : "#cbd5e1",
                  borderRadius: "28px",
                  transition: "0.3s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    content: '""',
                    height: "20px",
                    width: "20px",
                    left: useReverseMortgage ? "26px" : "4px",
                    bottom: "4px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.3s",
                  }}
                />
              </span>
            </label>
          </div>

          {/* Interactive Sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Slider 1: House Price */}
            <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "var(--modal-subbox-bg, #f8fafc)", border: "1px solid var(--modal-subbox-border, #e2e8f0)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary, #64748b)" }}>주택 공시가격 (시세 기준)</span>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0284c7" }}>
                  {(houseValueManwon / 10000).toFixed(1)}억원
                </span>
              </div>
              <input
                type="range"
                min={10000} // 1억원
                max={150000} // 15억원 (상한 12억 적용)
                step={5000} // 5천만원 단위
                value={houseValueManwon}
                onChange={(e) => setHouseValueManwon(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#0284c7", cursor: "pointer" }}
              />
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span>1억원</span>
                <span style={{ color: "#d97706" }}>공시가 상한 12억원</span>
                <span>15억원</span>
              </div>
            </div>

            {/* Slider 2: Entry Age */}
            <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "var(--modal-subbox-bg, #f8fafc)", border: "1px solid var(--modal-subbox-border, #e2e8f0)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary, #64748b)" }}>수령 개시 연령 (만 나이)</span>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0284c7" }}>
                  만 {startAge}세
                </span>
              </div>
              <input
                type="range"
                min={55} // 법정 최소 만 55세
                max={85}
                step={1}
                value={startAge}
                onChange={(e) => setStartAge(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#0284c7", cursor: "pointer" }}
              />
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span>법정 최소 55세</span>
                <span>권장 65세</span>
                <span>85세</span>
              </div>
            </div>
          </div>

          {/* Key Output Metrics Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>월 지급금 (종신)</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
                월 {estimate.monthlyPayoutManwon.toLocaleString()}만원
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>
                {spouseAgeGap !== null ? `부부 중 연소자(만 ${estimate.age}세) 기준 · 배우자 100% 승계` : "평생 정액 지급"}
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>연간 지급금 합계</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary, #0f1127)", marginTop: 4 }}>
                {formatWon(estimate.annualPayoutWon)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>1억원당 월 {(estimate.monthlyPer100M / 10000).toFixed(1)}만원</div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>80세까지 누적 수령</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d97706", marginTop: 4 }}>
                {formatWon(estimate.annualPayoutWon * Math.max(0, 80 - startAge))}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>{80 - startAge}년간 누적</div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--modal-surface-card, #f8fafc)", border: "1px solid var(--modal-border, #e2e8f0)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>90세까지 누적 수령</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#059669", marginTop: 4 }}>
                {formatWon(estimate.annualPayoutWon * Math.max(0, 90 - startAge))}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>{90 - startAge}년간 누적</div>
            </div>
          </div>

          {/* 4 Core HF Protections */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "12px",
              backgroundColor: "var(--modal-surface-card, #f8fafc)",
              border: "1px solid var(--modal-border, #e2e8f0)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary, #0f1127)" }}>
              🛡️ 한국주택금융공사(HF) 주택연금 4대 안심 보장
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "0.8rem" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#059669" }}>✔</span>
                <div>
                  <b style={{ color: "var(--text-primary, #0f1127)" }}>평생 거주 & 종신 지급 보장</b>
                  <div style={{ color: "var(--text-secondary, #64748b)", marginTop: 2 }}>
                    부부 모두 사망할 때까지 평생 거주하면서 동일한 월지급금을 종신토록 지급받습니다.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#059669" }}>✔</span>
                <div>
                  <b style={{ color: "var(--text-primary, #0f1127)" }}>비소구 대출 (상속인 부담 없음)</b>
                  <div style={{ color: "var(--text-secondary, #64748b)", marginTop: 2 }}>
                    집값이 떨어져 총 수령액이 주택가격을 초과해도 자녀에게 청구하지 않으며, 남으면 상속인에게 환급합니다.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#059669" }}>✔</span>
                <div>
                  <b style={{ color: "var(--text-primary, #0f1127)" }}>건강보험료 완전 비과세 (영향 0원)</b>
                  <div style={{ color: "var(--text-secondary, #64748b)", marginTop: 2 }}>
                    소득이 아닌 역모기지 대출금이므로 소득으로 잡히지 않아 건강보험료가 전혀 증가하지 않습니다.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#059669" }}>✔</span>
                <div>
                  <b style={{ color: "var(--text-primary, #0f1127)" }}>세제 혜택 (재산세 감면 & 소득공제)</b>
                  <div style={{ color: "var(--text-secondary, #64748b)", marginTop: 2 }}>
                    {estimate.benefits.propertyTaxRelief} 및 연간 대출이자 200만원 한도 소득공제를 지원합니다.
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
            borderTop: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--modal-subbox-bg, #f8fafc)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
            * 공시가격 12억원 초과 주택은 가입이 제한되거나 상한액(12억원) 기준으로 산출됩니다.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "var(--modal-surface, #ffffff)",
                color: "var(--text-secondary, #64748b)",
                border: "1px solid var(--modal-border, #cbd5e1)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              style={{
                padding: "8px 22px",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              설정 저장 & 시뮬레이션 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
