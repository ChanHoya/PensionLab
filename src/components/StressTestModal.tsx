"use client";

import React, { useState } from "react";
import { runRetirementStressTest, StressTestSuite, StressScenarioResult } from "@/services/stressTestEngine";

interface StressTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAge?: number;
  retirementAge?: number;
  expectedLifeExpectancy?: number;
  targetMonthlySpendingWon?: number;
  monthlyNationalPensionWon?: number;
  totalLiquidAssetsWon?: number;
  baseInflationRate?: number;
  baseNpsStartAge?: number;
  onApplyScenario?: (scenario: StressScenarioResult) => void;
}

export default function StressTestModal({
  isOpen,
  onClose,
  currentAge = 55,
  retirementAge = 60,
  expectedLifeExpectancy = 90,
  targetMonthlySpendingWon = 3500000,
  monthlyNationalPensionWon = 1300000,
  totalLiquidAssetsWon = 250000000,
  baseInflationRate = 2.5,
  baseNpsStartAge = 65,
  onApplyScenario,
}: StressTestModalProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<StressScenarioResult["id"]>("TRIPLE_COMBO");

  if (!isOpen) return null;

  const suite: StressTestSuite = runRetirementStressTest({
    currentAge,
    retirementAge,
    expectedLifeExpectancy,
    targetMonthlySpendingWon,
    monthlyNationalPensionWon,
    totalLiquidAssetsWon,
    baseInflationRate,
    baseNpsStartAge,
  });

  const scenarioList = [
    suite.basePlan,
    suite.inflationShock,
    suite.npsDelayShock,
    suite.marketCrashShock,
    suite.tripleShock,
  ];

  const currentScenario = scenarioList.find((s) => s.id === selectedScenarioId) || suite.tripleShock;

  const getGradeBadge = (grade: "A" | "B" | "C" | "D") => {
    switch (grade) {
      case "A":
        return { label: "A등급 (매우 견고)", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
      case "B":
        return { label: "B등급 (양호)", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" };
      case "C":
        return { label: "C등급 (주의 필요)", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
      case "D":
        return { label: "D등급 (조기 고갈 위험)", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
    }
  };

  const badgeInfo = getGradeBadge(currentScenario.survivalGrade);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stress-test-modal-title"
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
          maxWidth: "920px",
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
        {/* 상단 헤더 */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>⚡</span>
            <div>
              <h2
                id="stress-test-modal-title"
                style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--modal-title, #0f172a)" }}
              >
                3중 복합 위기 스트레스 테스트 매트릭스 2.0
              </h2>
              <p style={{ fontSize: "12px", color: "var(--color-muted, #64748b)", margin: "2px 0 0" }}>
                고물가 4.5% + 연금 개시 68세 순연 + 시장 -30% 폭락 최악의 시나리오 내구성 검증
              </p>
            </div>
          </div>
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

        {/* 5대 시나리오 탭 */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "6px",
            padding: "10px 24px",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            backgroundColor: "var(--modal-surface, #f8fafc)",
          }}
        >
          {scenarioList.map((s) => {
            const isSelected = s.id === selectedScenarioId;
            const isTriple = s.id === "TRIPLE_COMBO";
            return (
              <button
                key={s.id}
                onClick={() => setSelectedScenarioId(s.id)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: isSelected ? `2px solid ${isTriple ? "#ef4444" : "#2563eb"}` : "1px solid var(--modal-border, #e2e8f0)",
                  backgroundColor: isSelected
                    ? isTriple
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(37, 99, 235, 0.1)"
                    : "var(--modal-surface-card, #ffffff)",
                  color: isSelected ? (isTriple ? "#dc2626" : "#1d4ed8") : "var(--modal-text, #334155)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: isSelected ? "700" : "500",
                  transition: "all 0.2s",
                }}
              >
                <span>{s.badge}</span>
                {s.title}
              </button>
            );
          })}
        </div>

        {/* 본문 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 선택 시나리오 핵심 진단 KPI */}
          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              backgroundColor: "var(--modal-surface, #f8fafc)",
              border: "1px solid var(--modal-border, #e2e8f0)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#dc2626",
                    marginBottom: "4px",
                  }}
                >
                  {currentScenario.badge}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>{currentScenario.title}</h3>
                <p style={{ fontSize: "12px", color: "var(--color-muted, #64748b)", margin: "4px 0 0" }}>
                  {currentScenario.description}
                </p>
              </div>

              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: badgeInfo.bg,
                  color: badgeInfo.color,
                  fontWeight: "800",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🛡️ {badgeInfo.label}
              </div>
            </div>

            {/* 3대 충격 수치 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "var(--modal-surface-card, #ffffff)",
                  border: "1px solid var(--modal-border, #e2e8f0)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>예상 자산 고갈 나이</span>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    marginTop: "2px",
                    color: currentScenario.depletionAge >= expectedLifeExpectancy ? "#059669" : "#dc2626",
                  }}
                >
                  {currentScenario.depletionAge >= expectedLifeExpectancy
                    ? `만 ${expectedLifeExpectancy}세+ (종신 안전)`
                    : `만 ${currentScenario.depletionAge}세`}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                  은퇴 후 약 {currentScenario.runwayYears}년간 유지
                </div>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "var(--modal-surface-card, #ffffff)",
                  border: "1px solid var(--modal-border, #e2e8f0)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>생애 총 부족 결손액</span>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    marginTop: "2px",
                    color: currentScenario.lifetimeShortfallWon === 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {currentScenario.lifetimeShortfallWon === 0
                    ? "0원 (부족 없음)"
                    : `${Math.round(currentScenario.lifetimeShortfallWon / 10000).toLocaleString()}만 원`}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                  고갈 이후 생애 말기까지 누적 부족분
                </div>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "var(--modal-surface-card, #ffffff)",
                  border: "1px solid var(--modal-border, #e2e8f0)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--color-muted, #64748b)" }}>충격 변수 요약</span>
                <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px" }}>
                  인플레 {currentScenario.inflationRate}% / 국민연금 {currentScenario.npsStartAge}세
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted, #64748b)", marginTop: "2px" }}>
                  자산손실 {currentScenario.assetLossRate}% / 배당삭감 {currentScenario.dividendLossRate}%
                </div>
              </div>
            </div>
          </div>

          {/* 5대 시나리오 한눈에 비교 매트릭스 테이블 */}
          <div
            style={{
              border: "1px solid var(--modal-border, #e2e8f0)",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "var(--modal-surface-card, #ffffff)",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: "var(--modal-surface, #f1f5f9)",
                borderBottom: "1px solid var(--modal-border, #e2e8f0)",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              📊 5대 위기 시나리오별 내구성 비교표
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--modal-surface-sub, #f8fafc)", borderBottom: "1px solid var(--modal-border, #e2e8f0)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>시나리오</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>물가상승률</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>국민연금 개시</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>고갈 예상나이</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>생애 총 부족액</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>내구성</th>
                </tr>
              </thead>
              <tbody>
                {scenarioList.map((s) => {
                  const isCurrent = s.id === selectedScenarioId;
                  const gInfo = getGradeBadge(s.survivalGrade);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedScenarioId(s.id)}
                      style={{
                        borderBottom: "1px solid var(--modal-border, #f1f5f9)",
                        backgroundColor: isCurrent ? "rgba(37, 99, 235, 0.05)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: isCurrent ? "700" : "500" }}>
                        <span style={{ marginRight: "6px" }}>{s.badge}</span>
                        {s.title}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>{s.inflationRate}%</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>만 {s.npsStartAge}세</td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontWeight: "700",
                          color: s.depletionAge >= expectedLifeExpectancy ? "#059669" : "#dc2626",
                        }}
                      >
                        만 {s.depletionAge}세
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        {s.lifetimeShortfallWon === 0
                          ? "0원"
                          : `${Math.round(s.lifetimeShortfallWon / 10000).toLocaleString()}만원`}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            backgroundColor: gInfo.bg,
                            color: gInfo.color,
                          }}
                        >
                          {s.survivalGrade}등급
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 비상 방어 처방전 */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#dc2626", fontWeight: "700" }}>
              🚨 {currentScenario.title} 대비 3대 긴급 방어 처방전
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {currentScenario.defenseStrategies.map((def, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: "var(--modal-text, #334155)",
                  }}
                >
                  <span style={{ color: "#dc2626", fontWeight: "700" }}>•</span>
                  <span>{def}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(239, 68, 68, 0.15)",
                fontSize: "12px",
                color: "var(--color-muted, #64748b)",
                lineHeight: "1.5",
              }}
            >
              💡 <strong>전문가 총평</strong>: {suite.overallAssessment.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
