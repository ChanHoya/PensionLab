"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import {
  QuickDiagnosisInput,
  calculateQuickDiagnosis,
  generateStoreFromQuickDiagnosis,
} from "@/services/quickDiagnosis";
import { NumberPopIn } from "@/components/motion";

interface QuickDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickDiagnosisModal({ isOpen, onClose }: QuickDiagnosisModalProps) {
  const router = useRouter();
  const store = usePensionStore();

  const [currentAge, setCurrentAge] = useState<number>(store.simulationParams.currentAge || 45);
  const [retireAge, setRetireAge] = useState<number>(store.simulationParams.retirementAge || 60);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(400);
  const [hasSpouse, setHasSpouse] = useState<boolean>(store.simulationParams.hasSpouse ?? true);

  // 실시간 진단 결과 산출
  const input: QuickDiagnosisInput = useMemo(
    () => ({
      currentAge,
      retireAge,
      monthlyIncome,
      hasSpouse,
      spouseAge: currentAge - 2,
    }),
    [currentAge, retireAge, monthlyIncome, hasSpouse]
  );

  const result = useMemo(() => calculateQuickDiagnosis(input), [input]);

  if (!isOpen) return null;

  const handleApplyToDashboard = () => {
    const fullState = generateStoreFromQuickDiagnosis(input);
    // Zustand 스토어 업데이트
    store.setNationalPension(fullState.nationalPension);
    store.setRetirementPensions(fullState.retirementPensions);
    store.setPersonalPensions(fullState.personalPensions);
    if (fullState.spouseNationalPension) {
      store.setNationalPension(fullState.spouseNationalPension, "SPOUSE");
    }
    store.setSimulationParams(fullState.simulationParams);

    onClose();
    router.push("/dashboard");
  };

  const handleGoToDetailedOnboarding = () => {
    const fullState = generateStoreFromQuickDiagnosis(input);
    store.setSimulationParams(fullState.simulationParams);
    onClose();
    router.push("/onboarding");
  };

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981", border: "rgba(16, 185, 129, 0.4)" },
    B: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.4)" },
    C: { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.4)" },
    D: { bg: "rgba(249, 115, 22, 0.15)", text: "#fb923c", border: "rgba(249, 115, 22, 0.4)" },
    E: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.4)" },
  };

  const gColor = gradeColors[result.readinessGrade] || gradeColors.C;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="t-modal-spring"
        style={{
          width: "100%",
          maxWidth: "840px",
          maxHeight: "92vh",
          overflowY: "auto",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.6rem" }}>⚡</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                  초심자를 위한 30초 퀵 간편 진단
                </h2>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    color: "#818cf8",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}
                >
                  Easy Mode
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                복잡한 서류 없이 4개 질문으로 대한민국 평균 통계 기반 은퇴 현금흐름을 즉시 예측합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 모달 바디: 2열 그리드 (입력부 vs 실시간 결과부) */}
        <div
          style={{
            padding: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {/* 좌측: 간편 입력 패널 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent, #6366f1)" }}>
              STEP 1 · 기본 정보 30초 설정
            </div>

            {/* 현재 나이 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>현재 나이</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent, #6366f1)" }}>
                  만 {currentAge}세
                </span>
              </div>
              <input
                type="range"
                min={25}
                max={65}
                value={currentAge}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentAge(val);
                  if (val >= retireAge) setRetireAge(val + 1);
                }}
                style={{ width: "100%", accentColor: "var(--accent, #6366f1)" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                <span>25세</span>
                <span>45세</span>
                <span>65세</span>
              </div>
            </div>

            {/* 희망 은퇴 나이 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>희망 은퇴 나이</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981" }}>
                  만 {retireAge}세 (은퇴까지 {Math.max(0, retireAge - currentAge)}년)
                </span>
              </div>
              <input
                type="range"
                min={Math.max(50, currentAge + 1)}
                max={75}
                value={retireAge}
                onChange={(e) => setRetireAge(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#10b981" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                <span>50세</span>
                <span>60세(법정)</span>
                <span>75세</span>
              </div>
            </div>

            {/* 현재 월 세전 소득 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>현재 월 세전 소득 (가구 합산)</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>
                  월 {monthlyIncome.toLocaleString()}만원
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {[250, 350, 450, 600, 800].map((inc) => (
                  <button
                    key={inc}
                    onClick={() => setMonthlyIncome(inc)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: monthlyIncome === inc ? "#f59e0b" : "var(--border)",
                      backgroundColor: monthlyIncome === inc ? "rgba(245, 158, 11, 0.15)" : "transparent",
                      color: monthlyIncome === inc ? "#f59e0b" : "var(--text-secondary)",
                    }}
                  >
                    {inc}만원
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={150}
                max={1200}
                step={20}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f59e0b" }}
              />
            </div>

            {/* 가구 형태 */}
            <div>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                가구 형태
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setHasSpouse(true)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: hasSpouse ? "var(--accent, #6366f1)" : "var(--border)",
                    backgroundColor: hasSpouse ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: hasSpouse ? "var(--accent, #6366f1)" : "var(--text-secondary)",
                  }}
                >
                  👫 부부 가구 (2인)
                </button>
                <button
                  type="button"
                  onClick={() => setHasSpouse(false)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: !hasSpouse ? "var(--accent, #6366f1)" : "var(--border)",
                    backgroundColor: !hasSpouse ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: !hasSpouse ? "var(--accent, #6366f1)" : "var(--text-secondary)",
                  }}
                >
                  👤 1인 가구 (단독)
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 실시간 퀵 진단 결과 카드 */}
          <div
            style={{
              backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* 등급 및 헤드라인 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                실시간 은퇴 준비 판정
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  backgroundColor: gColor.bg,
                  color: gColor.text,
                  border: `1px solid ${gColor.border}`,
                }}
              >
                {result.readinessGrade}등급 · 준비율 {result.sufficiencyRatio}%
              </span>
            </div>

            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.4,
              }}
            >
              {result.summaryHeadline}
            </div>

            {/* 메인 KPI 지표 카드 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                padding: "12px",
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  예상 은퇴 월 총 연금
                </span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#34d399" }}>
                  <NumberPopIn value={result.expectedMonthlyPension} formatter={(n) => `월 ${Number(n).toLocaleString()}만원`} />
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  목표 생활비 대비
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: result.monthlyShortfall > 0 ? "#f87171" : "#60a5fa",
                  }}
                >
                  {result.monthlyShortfall > 0 ? (
                    <NumberPopIn value={result.monthlyShortfall} formatter={(n) => `-${Number(n).toLocaleString()}만원/월`} />
                  ) : (
                    "충족 완료 ✨"
                  )}
                </span>
              </div>
            </div>

            {/* 3층 연금 내역 미니 스택 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>3층 연금 월 예상 구성</span>
                <span style={{ color: "var(--text-muted)" }}>목표: 월 {result.targetMonthlySpending}만원</span>
              </div>
              <div
                style={{
                  height: "12px",
                  borderRadius: "6px",
                  display: "flex",
                  overflow: "hidden",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (result.breakdown.nationalMonthly / result.targetMonthlySpending) * 100)}%`,
                    backgroundColor: "#3b82f6",
                  }}
                  title={`국민연금: 월 ${result.breakdown.nationalMonthly}만원`}
                />
                <div
                  style={{
                    width: `${Math.min(100, (result.breakdown.retirementMonthly / result.targetMonthlySpending) * 100)}%`,
                    backgroundColor: "#10b981",
                  }}
                  title={`퇴직연금: 월 ${result.breakdown.retirementMonthly}만원`}
                />
                <div
                  style={{
                    width: `${Math.min(100, (result.breakdown.personalMonthly / result.targetMonthlySpending) * 100)}%`,
                    backgroundColor: "#a855f7",
                  }}
                  title={`개인연금: 월 ${result.breakdown.personalMonthly}만원`}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.7rem", flexWrap: "wrap" }}>
                <span style={{ color: "#60a5fa" }}>● 국민 월 {result.breakdown.nationalMonthly}만</span>
                <span style={{ color: "#34d399" }}>● 퇴직 월 {result.breakdown.retirementMonthly}만</span>
                <span style={{ color: "#c084fc" }}>● 개인 월 {result.breakdown.personalMonthly}만</span>
              </div>
            </div>

            {/* 핵심 팁 */}
            <div
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                lineHeight: 1.45,
              }}
            >
              <span style={{ fontWeight: 700, color: "#818cf8", display: "block", marginBottom: "4px" }}>
                🎯 골든 액션 팁
              </span>
              {result.goldenTips[0]}
            </div>
          </div>
        </div>

        {/* 모달 풋터 액션 바 */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <button
            type="button"
            onClick={handleGoToDetailedOnboarding}
            className="premium-button-secondary"
            style={{
              padding: "10px 16px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📝 꼼꼼하게 직접 입력하기 (정밀 모드)
          </button>

          <button
            type="button"
            onClick={handleApplyToDashboard}
            className="premium-button"
            style={{
              padding: "10px 20px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🚀 이 결과로 대시보드 바로 체험하기</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
