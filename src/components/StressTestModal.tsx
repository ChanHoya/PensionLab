// 3중 복합 위기 스트레스 테스트 매트릭스 2.0 시뮬레이션을 렌더링하는 모달 컴포넌트
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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
        return { label: "D등급 (위험/대책시급)", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
    }
  };

  const badgeInfo = getGradeBadge(currentScenario.survivalGrade);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stress-test-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
          maxWidth: "960px",
          maxHeight: "92vh",
          backgroundColor: "var(--surface)",
          color: "var(--text-primary)",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
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
                style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}
              >
                3중 복합 위기 스트레스 테스트 매트릭스 2.0
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0" }}>
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
              border: "1px solid var(--border)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
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
            borderBottom: "1px solid var(--border)",
            backgroundColor: "rgba(0, 0, 0, 0.15)",
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
                  border: isSelected ? `2px solid ${isTriple ? "#ef4444" : "#6366f1"}` : "1px solid var(--border)",
                  backgroundColor: isSelected
                    ? isTriple
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(99, 102, 241, 0.15)"
                    : "rgba(255, 255, 255, 0.03)",
                  color: isSelected ? (isTriple ? "#f87171" : "#818cf8") : "var(--text-secondary)",
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
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border)",
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
                    color: "#f87171",
                    marginBottom: "4px",
                  }}
                >
                  {currentScenario.badge}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>{currentScenario.title}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
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
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>예상 자산 고갈 나이</span>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    marginTop: "2px",
                    color: currentScenario.depletionAge >= expectedLifeExpectancy ? "#10b981" : "#ef4444",
                  }}
                >
                  {currentScenario.depletionAge >= expectedLifeExpectancy
                    ? `만 ${expectedLifeExpectancy}세+ (종신 안전)`
                    : `만 ${currentScenario.depletionAge}세`}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  은퇴 후 약 {currentScenario.runwayYears}년간 유지
                </div>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>생애 총 부족 결손액</span>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    marginTop: "2px",
                    color: currentScenario.lifetimeShortfallWon === 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {currentScenario.lifetimeShortfallWon === 0
                    ? "0원 (부족 없음)"
                    : `${Math.round(currentScenario.lifetimeShortfallWon / 10000).toLocaleString()}만 원`}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  고갈 이후 생애 말기까지 누적 부족분
                </div>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>충격 변수 요약</span>
                <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px", color: "var(--text-primary)" }}>
                  인플레 {currentScenario.inflationRate}% / 국민연금 {currentScenario.npsStartAge}세
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  자산손실 {currentScenario.assetLossRate}% / 배당삭감 {currentScenario.dividendLossRate}%
                </div>
              </div>
            </div>
          </div>

          {/* 5대 시나리오 한눈에 비교 매트릭스 테이블 */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                borderBottom: "1px solid var(--border)",
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text-primary)",
              }}
            >
              📊 5대 위기 시나리오별 내구성 비교표
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-muted)", fontWeight: "600" }}>시나리오</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>물가상승률</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>국민연금 개시</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>고갈 예상나이</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>생애 총 부족액</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>내구성</th>
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
                        borderBottom: "1px solid var(--border)",
                        backgroundColor: isCurrent ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: isCurrent ? "700" : "500", color: "var(--text-primary)" }}>
                        <span style={{ marginRight: "6px" }}>{s.badge}</span>
                        {s.title}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-secondary)" }}>{s.inflationRate}%</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-secondary)" }}>만 {s.npsStartAge}세</td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontWeight: "700",
                          color: s.depletionAge >= expectedLifeExpectancy ? "#10b981" : "#ef4444",
                        }}
                      >
                        만 {s.depletionAge}세
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-primary)" }}>
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
              backgroundColor: "rgba(239, 68, 68, 0.06)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#f87171", fontWeight: "700" }}>
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
                    color: "var(--text-secondary)",
                  }}
                >
                  <span style={{ color: "#ef4444", fontWeight: "700" }}>•</span>
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
                color: "var(--text-muted)",
                lineHeight: "1.5",
              }}
            >
              💡 <strong style={{ color: "var(--text-primary)" }}>전문가 총평</strong>: {suite.overallAssessment.recommendation}
            </div>
          </div>
        </div>

        {/* 풋터 */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="premium-button"
            style={{ padding: "8px 20px", fontSize: "0.85rem", fontWeight: 700 }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
