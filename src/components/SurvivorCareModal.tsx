"use client";

import React, { useState, useMemo } from "react";
import { usePensionStore } from "@/store/usePensionStore";
import {
  calculateSurvivorCare,
} from "@/services/survivorCareCalculator";
import { householdReverseMortgage } from "@/services/reverseMortgageCalculator";

interface SurvivorCareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SurvivorCareModal({ isOpen, onClose }: SurvivorCareModalProps) {
  const store = usePensionStore();

  const selfCurrentAge = store.simulationParams.currentAge || 52;
  const spouseCurrentAge = store.simulationParams.spouseAge || 50;
  const initialSelfDeathAge = store.simulationParams.expectedLifeExpectancy || 83;
  const initialSpouseDeathAge = store.simulationParams.spouseLifeExpectancy || 89;
  const coupleSpending = store.simulationParams.targetMonthlySpending || 300;

  // 국민연금 월 수령액
  const selfNpsWon = (store.nationalPension.expectedMonthlyPension || 120) * 10000;
  const spouseNpsWon = (store.spouse.nationalPension.expectedMonthlyPension || 80) * 10000;

  // 주택연금 월지급금
  const hasRm = store.simulationParams.useReverseMortgage ?? false;
  const rmResult = useMemo(() => {
    return householdReverseMortgage(
      (store.simulationParams.reverseMortgageHouseValue || 50000) * 10000,
      store.simulationParams.reverseMortgageStartAge || 65,
      spouseCurrentAge - selfCurrentAge
    );
  }, [store.simulationParams.reverseMortgageHouseValue, store.simulationParams.reverseMortgageStartAge, spouseCurrentAge, selfCurrentAge]);

  // 로컬 슬라이더 상태
  const [selfDeathAge, setSelfDeathAge] = useState<number>(initialSelfDeathAge);
  const [spouseDeathAge, setSpouseDeathAge] = useState<number>(initialSpouseDeathAge);
  const [singleExpenseRatio, setSingleExpenseRatio] = useState<number>(0.7); // 70%
  const [careMonthlyManwon, setCareMonthlyManwon] = useState<number>(100); // 월 100만원
  const [hasReverseMortgage, setHasReverseMortgage] = useState<boolean>(hasRm);

  const result = useMemo(() => {
    return calculateSurvivorCare({
      selfCurrentAge,
      spouseCurrentAge,
      selfDeathAge,
      spouseDeathAge,
      coupleMonthlySpendingWon: coupleSpending * 10000,
      singleExpenseRatio,
      selfMonthlyPensionWon: selfNpsWon,
      spouseMonthlyPensionWon: spouseNpsWon,
      selfNpsPeriodYears: 22,
      spouseNpsPeriodYears: 15,
      hasReverseMortgage,
      reverseMortgageMonthlyWon: rmResult.monthlyPayoutWon,
      remainingPrivateAssetsWon: 100000000, // 1억원 잔여 가정
      monthlyCareExpenseWon: careMonthlyManwon * 10000,
    });
  }, [
    selfCurrentAge,
    spouseCurrentAge,
    selfDeathAge,
    spouseDeathAge,
    coupleSpending,
    singleExpenseRatio,
    selfNpsWon,
    spouseNpsWon,
    hasReverseMortgage,
    rmResult.monthlyPayoutWon,
    careMonthlyManwon,
  ]);

  if (!isOpen) return null;

  const badgeColor =
    result.safetyStatus === "SAFE"
      ? "#10b981"
      : result.safetyStatus === "CAUTION"
      ? "#f59e0b"
      : "#ef4444";

  const badgeBg =
    result.safetyStatus === "SAFE"
      ? "rgba(16, 185, 129, 0.15)"
      : result.safetyStatus === "CAUTION"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)";

  const survivorName = result.survivor === "SELF" ? "본인" : "배우자";
  const deceasedName = result.firstDeceased === "SELF" ? "본인" : "배우자";

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
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "920px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "var(--card-bg, #1e293b)",
          color: "var(--text-primary, #f8fafc)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
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
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.6rem" }}>🕊️</span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                홀로 남은 배우자(1인 가구) 생애 케어 고도화
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
                {result.safetyStatusLabel} ({result.coverageRatio}%)
              </span>
            </div>
            <p
              style={{
                fontSize: "0.825rem",
                color: "var(--text-secondary, #94a3b8)",
                margin: "4px 0 0 0",
              }}
            >
              부부 중 한 명이 먼저 사망했을 때, 홀로 남은 배우자의 1인 가구 생활비(70%), 국민연금 유족연금 중복급여 조정(제56조) 및 85세 이후 집중 간병비를 시뮬레이션합니다.
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

        {/* 핵심 KPI 4종 카드 */}
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
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" }}>
              홀로 생존 기간
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#38bdf8" }}>
              {result.aloneYears}년 ({result.survivorStartAge}~{result.survivorEndAge}세)
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
              {deceasedName} 사망 후 {survivorName} 홀로 생존
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" }}>
              1인 가구 월 목표 생활비
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#f43f5e" }}>
              {(result.aloneTargetMonthlyWon / 10000).toFixed(0)}만원/월
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
              부부 기준({coupleSpending}만원)의 {(singleExpenseRatio * 100).toFixed(0)}%
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" }}>
              국민연금 확정 수령액
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#34d399" }}>
              {(result.finalMonthlyNpsWon / 10000).toFixed(0)}만원/월
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
              {result.chosenOptionLabel}
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)" }}>
              월 수지 밸런스
            </div>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                marginTop: "4px",
                color: result.monthlyNetBalanceWon >= 0 ? "#10b981" : "#ef4444",
              }}
            >
              {result.monthlyNetBalanceWon >= 0
                ? `+${(result.monthlyNetBalanceWon / 10000).toFixed(0)}만원`
                : `${(result.monthlyNetBalanceWon / 10000).toFixed(0)}만원`}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
              총 월수입 {(result.monthlyTotalInflowWon / 10000).toFixed(0)}만원
            </div>
          </div>
        </div>

        {/* 조절 슬라이더 및 시나리오 컨트롤 */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38bdf8" }}>
            ⚙️ 기대수명 및 1인 가구 생활비·간병비 조건 설정
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {/* 본인 기대수명 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>본인 기대수명</span>
                <span style={{ fontWeight: 700, color: "#38bdf8" }}>만 {selfDeathAge}세</span>
              </div>
              <input
                type="range"
                min={70}
                max={95}
                step={1}
                value={selfDeathAge}
                onChange={(e) => setSelfDeathAge(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 배우자 기대수명 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>배우자 기대수명</span>
                <span style={{ fontWeight: 700, color: "#38bdf8" }}>만 {spouseDeathAge}세</span>
              </div>
              <input
                type="range"
                min={70}
                max={98}
                step={1}
                value={spouseDeathAge}
                onChange={(e) => setSpouseDeathAge(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 1인 생활비 비율 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>1인 가구 생활비 감소율</span>
                <span style={{ fontWeight: 700, color: "#f43f5e" }}>
                  {(singleExpenseRatio * 100).toFixed(0)}% (월 {(result.aloneTargetMonthlyWon / 10000).toFixed(0)}만원)
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.85}
                step={0.05}
                value={singleExpenseRatio}
                onChange={(e) => setSingleExpenseRatio(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            {/* 85세 이후 월 간병비 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>85세 이후 월 집중 간병비</span>
                <span style={{ fontWeight: 700, color: "#fbbf24" }}>월 {careMonthlyManwon}만원</span>
              </div>
              <input
                type="range"
                min={50}
                max={250}
                step={10}
                value={careMonthlyManwon}
                onChange={(e) => setCareMonthlyManwon(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>
          </div>

          {/* 주택연금 연계 토글 */}
          <div style={{ marginTop: "4px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.8rem",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                background: hasReverseMortgage ? "rgba(251, 191, 36, 0.1)" : "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${hasReverseMortgage ? "rgba(251, 191, 36, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
              }}
            >
              <input
                type="checkbox"
                checked={hasReverseMortgage}
                onChange={(e) => setHasReverseMortgage(e.target.checked)}
              />
              <div>
                <span style={{ fontWeight: 700 }}>주택연금 배우자 100% 종신 승계 반영</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", marginLeft: "8px" }}>
                  (사망 시 배우자에게 월 {(rmResult.monthlyPayoutWon / 10000).toFixed(0)}만원 감액 없이 승계 지급)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 국민연금법 제56조 중복급여 조정 비교 패널 */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38bdf8", marginBottom: "8px" }}>
            ⚖️ 국민연금법 제56조 (중복급여의 조정) 비교 분석
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: result.chosenOption === "OPTION_A" ? "rgba(56, 189, 248, 0.12)" : "rgba(0,0,0,0.2)",
                border: `1px solid ${result.chosenOption === "OPTION_A" ? "rgba(56, 189, 248, 0.5)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>[대안 A] 본인 노령 + 유족연금 30%</span>
                {result.chosenOption === "OPTION_A" && (
                  <span style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 700 }}>★ 유리 (선택)</span>
                )}
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38bdf8", marginTop: "6px" }}>
                {(result.survivorOptionA_Won / 10000).toFixed(0)}만원/월
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", marginTop: "4px" }}>
                본인 연금 {( (result.survivor === "SELF" ? selfNpsWon : spouseNpsWon) / 10000).toFixed(0)}만 + 유족연금 30%({( (result.pureSurvivorPensionWon * 0.3) / 10000).toFixed(0)}만)
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: result.chosenOption === "OPTION_B" ? "rgba(56, 189, 248, 0.12)" : "rgba(0,0,0,0.2)",
                border: `1px solid ${result.chosenOption === "OPTION_B" ? "rgba(56, 189, 248, 0.5)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>[대안 B] 유족연금 100% 단독</span>
                {result.chosenOption === "OPTION_B" && (
                  <span style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 700 }}>★ 유리 (선택)</span>
                )}
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#94a3b8", marginTop: "6px" }}>
                {(result.survivorOptionB_Won / 10000).toFixed(0)}만원/월
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", marginTop: "4px" }}>
                사망자 기본연금의 {(result.survivorNpsRate * 100).toFixed(0)}% (본인 노령연금 포기)
              </div>
            </div>
          </div>
        </div>

        {/* 전문가 추천 가이드 */}
        <div
          style={{
            background: "rgba(56, 189, 248, 0.06)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "10px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38bdf8", marginBottom: "6px" }}>
            💡 CFP 은퇴설계 전문가 홀로 생존 생애 케어 조언
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", lineHeight: 1.6 }}>
            {result.recommendations.map((rec, idx) => (
              <li key={idx} style={{ color: "var(--text-secondary, #cbd5e1)", marginTop: "2px" }}>
                {rec}
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
