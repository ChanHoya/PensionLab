"use client";

import React, { useState } from "react";

export interface DividendPortfolio {
  id: string;
  name: string;
  tagline: string;
  targetAudience: string;
  expectedYield: number; // 연 분배율 (%)
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  assets: {
    name: string;
    weight: number; // %
    example: string;
    yieldRate: number; // %
    annual300M: number; // 만원
    annual500M: number;
    annual1000M: number;
  }[];
  features: string;
  caution: string;
  tip?: string;
  yield300M: { annual: number; monthly: number };
  yield500M: { annual: number; monthly: number };
  yield1000M: { annual: number; monthly: number };
}

export const DIVIDEND_PORTFOLIOS: DividendPortfolio[] = [
  {
    id: "GROWTH",
    name: "① 배당성장형",
    tagline: "지금보다 나중의 배당을 키우는 포트폴리오",
    targetAudience: "은퇴까지 10년 이상 남은 30~40대",
    expectedYield: 2.81,
    badgeColor: "#38bdf8",
    borderColor: "rgba(56, 189, 248, 0.4)",
    bgColor: "rgba(56, 189, 248, 0.08)",
    yield300M: { annual: 843, monthly: 70 },
    yield500M: { annual: 1405, monthly: 117 },
    yield1000M: { annual: 2810, monthly: 234 },
    features: "지금 받는 배당은 적지만(대략 연 2~3%) 배당금과 주가가 함께 자라는 구조입니다. 사과나무를 심는 단계라고 보면 됩니다.",
    caution: "배당금은 계좌 안에서 전액 재투자하는 게 기본입니다.",
    assets: [
      { name: "미국 배당성장주 (SCHD 동일 지수)", weight: 50, example: "미국배당다우존스 ETF", yieldRate: 3.5, annual300M: 525, annual500M: 875, annual1000M: 1750 },
      { name: "미국 대형주 지수", weight: 30, example: "S&P500 ETF", yieldRate: 1.2, annual300M: 108, annual500M: 180, annual1000M: 360 },
      { name: "채권", weight: 20, example: "미국채10년 ETF", yieldRate: 3.5, annual300M: 210, annual500M: 350, annual1000M: 700 },
    ],
  },
  {
    id: "HIGH_INCOME",
    name: "② 고배당 인컴형",
    tagline: "매달 현금이 들어오는 포트폴리오",
    targetAudience: "은퇴했거나 은퇴가 가까워 매달 생활비가 필요한 분",
    expectedYield: 5.90,
    badgeColor: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.4)",
    bgColor: "rgba(245, 158, 11, 0.08)",
    yield300M: { annual: 1770, monthly: 148 },
    yield500M: { annual: 2950, monthly: 246 },
    yield1000M: { annual: 5900, monthly: 492 },
    features: "월배당 상품을 묶어 연 5~7% 수준의 현금 흐름을 목표로 합니다.",
    caution: "커버드콜은 '주가가 많이 오를 때의 이익을 미리 팔고 그 대가로 매달 돈을 받는' 구조입니다. 상승장에서는 덜 오르고, 시간이 지나면서 원금이 깎일 수 있어요. 비중을 너무 키우지 않는 게 좋습니다.",
    assets: [
      { name: "미국 배당다우존스", weight: 40, example: "미국배당다우존스 ETF", yieldRate: 3.5, annual300M: 420, annual500M: 700, annual1000M: 1400 },
      { name: "커버드콜 ETF", weight: 30, example: "미국배당다우존스 커버드콜 계열", yieldRate: 10.0, annual300M: 900, annual500M: 1500, annual1000M: 3000 },
      { name: "리츠 (부동산)", weight: 15, example: "리츠·부동산인프라 ETF", yieldRate: 6.5, annual300M: 293, annual500M: 488, annual1000M: 975 },
      { name: "채권", weight: 15, example: "국채·회사채 ETF", yieldRate: 3.5, annual300M: 158, annual500M: 263, annual1000M: 525 },
    ],
  },
  {
    id: "BALANCED",
    name: "③ 안정 혼합형",
    tagline: "흔들림을 줄이는 포트폴리오",
    targetAudience: "변동성이 부담스러운 분, IRP 안전자산 30% 규정을 채워야 하는 분",
    expectedYield: 3.88,
    badgeColor: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.4)",
    bgColor: "rgba(16, 185, 129, 0.08)",
    yield300M: { annual: 1163, monthly: 97 },
    yield500M: { annual: 1938, monthly: 161 },
    yield1000M: { annual: 3875, monthly: 323 },
    features: "주식이 크게 떨어질 때 채권과 금이 완충 역할을 합니다. 기대 배당은 대략 연 3.5~4.5%입니다.",
    tip: "IRP는 위험자산을 70%까지만 담을 수 있습니다. 주식 비중 40% 이하인 '채권혼합형 ETF'는 안전자산으로 인정돼요.",
    caution: "시장의 급격한 상승기에는 상대적으로 수익률이 보수적일 수 있습니다.",
    assets: [
      { name: "배당주 ETF (미국·한국 혼합)", weight: 40, example: "미국배당다우존스, 국내 고배당", yieldRate: 4.25, annual300M: 510, annual500M: 850, annual1000M: 1700 },
      { name: "채권", weight: 40, example: "국채, 단기채, 채권혼합형 ETF", yieldRate: 3.5, annual300M: 420, annual500M: 700, annual1000M: 1400 },
      { name: "리츠", weight: 10, example: "리츠 ETF", yieldRate: 6.5, annual300M: 195, annual500M: 325, annual1000M: 650 },
      { name: "금 또는 현금성 자산", weight: 10, example: "금현물, MMF/CD금리형", yieldRate: 1.25, annual300M: 38, annual500M: 63, annual1000M: 125 },
    ],
  },
  {
    id: "GLOBAL_DIVIDEND",
    name: "④ 한·미 분산형",
    tagline: "한 나라에 몰지 않는 포트폴리오",
    targetAudience: "환율 위험을 나누고 싶은 분, 국내 밸류업·주주환원 흐름도 담고 싶은 분",
    expectedYield: 4.33,
    badgeColor: "#a855f7",
    borderColor: "rgba(168, 85, 247, 0.4)",
    bgColor: "rgba(168, 85, 247, 0.08)",
    yield300M: { annual: 1298, monthly: 108 },
    yield500M: { annual: 2163, monthly: 180 },
    yield1000M: { annual: 4325, monthly: 360 },
    features: "원화 자산과 달러 자산이 섞여 있어서 환율이 크게 움직여도 영향이 덜합니다. 배당수익률은 대략 연 4~5%입니다.",
    caution: "한국 고배당주는 금융업(은행·지주사) 비중이 커서 업종이 한쪽으로 쏠리기 쉽습니다.",
    assets: [
      { name: "미국 배당주", weight: 35, example: "미국배당다우존스 ETF", yieldRate: 3.5, annual300M: 368, annual500M: 613, annual1000M: 1225 },
      { name: "한국 고배당주", weight: 25, example: "고배당, 은행고배당 ETF", yieldRate: 5.0, annual300M: 375, annual500M: 625, annual1000M: 1250 },
      { name: "리츠", weight: 15, example: "국내·해외 리츠 ETF", yieldRate: 6.5, annual300M: 293, annual500M: 488, annual1000M: 975 },
      { name: "채권", weight: 25, example: "국채 ETF", yieldRate: 3.5, annual300M: 263, annual500M: 438, annual1000M: 875 },
    ],
  },
];

interface DividendStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInvestmentManwon?: number; // 사용자의 현재 커버드콜/배당 투자금 (만원 단위)
  currentDividendRate?: number;     // 현재 설정된 분배율 (%)
  onApplyRate?: (rate: number) => void;
}

export function DividendStrategyModal({
  isOpen,
  onClose,
  currentInvestmentManwon = 40000,
  currentDividendRate = 9.0,
  onApplyRate,
}: DividendStrategyModalProps) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("HIGH_INCOME");
  const [activeTab, setActiveTab] = useState<"PORTFOLIOS" | "TABLES" | "CHECKPOINTS">("PORTFOLIOS");

  if (!isOpen) return null;

  const currentInvestmentOk = currentInvestmentManwon / 10000; // 억 단위
  const selectedPortfolio = DIVIDEND_PORTFOLIOS.find((p) => p.id === selectedPortfolioId) || DIVIDEND_PORTFOLIOS[1];

  // 사용자의 현재 투자금 기준 예상 배당금 계산
  const calcCustomYield = (yieldRate: number) => {
    const annualWon = Math.round((currentInvestmentManwon * (yieldRate / 100)));
    const monthlyWon = Math.round(annualWon / 12);
    return { annual: annualWon, monthly: monthlyWon };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(3, 7, 18, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1050px",
          maxHeight: "92vh",
          backgroundColor: "#0b1329",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#e2e8f0",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.4rem" }}>💡</span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc" }}>
                연금 배당 투자 전략 포트폴리오 가이드
              </h2>
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  fontWeight: 600,
                }}
              >
                S4 하이브리드 연동
              </span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.45 }}>
              대표적인 연금 배당 투자 유형 4가지를 비교하고, 나의 은퇴 자산 규모에 맞는 예상 월 배당금과 최적 분배율을 확인하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              lineHeight: 1,
            }}
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Legal Disclaimer & Pension Account Notice */}
        <div
          style={{
            padding: "10px 24px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.76rem",
            color: "#fbbf24",
          }}
        >
          <span>⚠️</span>
          <div>
            <b>교육용 참고 자료:</b> 투자자문 자격이 없으므로 개인 맞춤 투자 추천이 아닙니다. 연금저축·IRP에서는 미국 직투 ETF(SCHD 등)를 직접 살 수 없으며,
            동일 지수를 추종하는 <b>국내 상장 ETF(TIGER, SOL, KODEX, ACE 등)</b>로 편입해야 합니다.
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px 24px 0 24px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            backgroundColor: "rgba(15, 23, 42, 0.5)",
          }}
        >
          {[
            { id: "PORTFOLIOS", label: "📊 대표 포트폴리오 4선 비교" },
            { id: "TABLES", label: "💰 자산별 분배율 & 투자금별 배당금 표" },
            { id: "CHECKPOINTS", label: "📌 연금계좌 운용 핵심 원칙 5선" },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                  fontWeight: isTabActive ? 700 : 500,
                  color: isTabActive ? "#38bdf8" : "#94a3b8",
                  backgroundColor: isTabActive ? "rgba(56, 189, 248, 0.12)" : "transparent",
                  border: "none",
                  borderBottom: `2px solid ${isTabActive ? "#38bdf8" : "transparent"}`,
                  cursor: "pointer",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {activeTab === "PORTFOLIOS" && (
            <>
              {/* 4 Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
                {DIVIDEND_PORTFOLIOS.map((p) => {
                  const isSelected = selectedPortfolioId === p.id;
                  const custom = calcCustomYield(p.expectedYield);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPortfolioId(p.id)}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor: isSelected ? p.bgColor : "rgba(15, 23, 42, 0.6)",
                        border: `1.5px solid ${isSelected ? p.badgeColor : "rgba(148, 163, 184, 0.15)"}`,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        position: "relative",
                      }}
                    >
                      {/* Top Row: Title + Yield Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>{p.name}</div>
                          <div style={{ fontSize: "0.75rem", color: p.badgeColor, marginTop: "2px", fontWeight: 600 }}>
                            {p.tagline}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            backgroundColor: p.bgColor,
                            border: `1px solid ${p.borderColor}`,
                            color: p.badgeColor,
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            textAlign: "right",
                          }}
                        >
                          연 {p.expectedYield}%
                        </div>
                      </div>

                      {/* Target Audience */}
                      <div
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "rgba(0, 0, 0, 0.25)",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          color: "#cbd5e1",
                        }}
                      >
                        <b style={{ color: "#94a3b8" }}>누구에게: </b> {p.targetAudience}
                      </div>

                      {/* Asset Allocations Mini Table */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "2px 0" }}>
                        {p.assets.map((a, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.74rem",
                              padding: "3px 0",
                              borderBottom: i < p.assets.length - 1 ? "1px dashed rgba(148, 163, 184, 0.1)" : "none",
                            }}
                          >
                            <span style={{ color: "#cbd5e1" }}>
                              {a.name} <span style={{ color: "#64748b", fontSize: "0.7rem" }}>({a.example})</span>
                            </span>
                            <span style={{ fontWeight: 700, color: p.badgeColor }}>{a.weight}%</span>
                          </div>
                        ))}
                      </div>

                      {/* Expected Payout for User's Asset */}
                      <div
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.35)",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(148, 163, 184, 0.1)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                            현재 설정액({currentInvestmentOk > 0 ? `${currentInvestmentOk.toFixed(1)}억` : "4.0억"}) 기준 예상
                          </div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#34d399", marginTop: "2px" }}>
                            월 {custom.monthly.toLocaleString()}만원
                            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#94a3b8", marginLeft: "4px" }}>
                              (연 {custom.annual.toLocaleString()}만)
                            </span>
                          </div>
                        </div>

                        {/* Apply Button */}
                        {onApplyRate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApplyRate(p.expectedYield);
                              onClose();
                            }}
                            className="premium-button-secondary"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              borderColor: p.borderColor,
                              color: p.badgeColor,
                              backgroundColor: p.bgColor,
                              cursor: "pointer",
                              borderRadius: "6px",
                            }}
                            title={`S4 시뮬레이터 연 분배율을 ${p.expectedYield}%로 즉시 설정합니다.`}
                          >
                            ✓ 이 분배율 적용
                          </button>
                        )}
                      </div>

                      {/* Caution / Features Snippet */}
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.4 }}>
                        <span style={{ color: "#f87171" }}>⚠️ </span> {p.caution}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail View of Selected Portfolio */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  border: `1px solid ${selectedPortfolio.borderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.1rem" }}>🔍</span>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: selectedPortfolio.badgeColor }}>
                      {selectedPortfolio.name} 심층 전략 가이드
                    </h3>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    가정 연 분배율: <b style={{ color: "#34d399" }}>{selectedPortfolio.expectedYield}%</b>
                  </span>
                </div>

                <div style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                  <b>특징: </b> {selectedPortfolio.features}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#fca5a5", lineHeight: 1.5 }}>
                  <b>주의사항: </b> {selectedPortfolio.caution}
                </div>
                {selectedPortfolio.tip && (
                  <div style={{ fontSize: "0.82rem", color: "#93c5fd", lineHeight: 1.5 }}>
                    <b>💡 꿀팁: </b> {selectedPortfolio.tip}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "TABLES" && (
            <>
              {/* Table 1: Payout By Investment Scale */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                    📊 한눈에 보기: 포트폴리오별 예상 배당금 (세전)
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    내 현재 설정 투자금: <b style={{ color: "#38bdf8" }}>{currentInvestmentOk > 0 ? `${currentInvestmentOk.toFixed(1)}억` : "4.0억"} ({currentInvestmentManwon.toLocaleString()}만원)</b>
                  </span>
                </div>

                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#cbd5e1" }}>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>포트폴리오</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>가정 수익률</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>3억 연간 (월)</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>5억 연간 (월)</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>10억 연간 (월)</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)", backgroundColor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
                          내 투자금({currentInvestmentOk > 0 ? `${currentInvestmentOk.toFixed(1)}억` : "4억"}) 연간 (월)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {DIVIDEND_PORTFOLIOS.map((p, idx) => {
                        const custom = calcCustomYield(p.expectedYield);
                        return (
                          <tr
                            key={p.id}
                            style={{
                              backgroundColor: idx % 2 === 0 ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.3)",
                              borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                            }}
                          >
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: p.badgeColor }}>{p.name}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.expectedYield}%</td>
                            <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>
                              {p.yield300M.annual.toLocaleString()}만 <span style={{ color: "#94a3b8" }}>(월 {p.yield300M.monthly}만)</span>
                            </td>
                            <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>
                              {p.yield500M.annual.toLocaleString()}만 <span style={{ color: "#94a3b8" }}>(월 {p.yield500M.monthly}만)</span>
                            </td>
                            <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>
                              {p.yield1000M.annual.toLocaleString()}만 <span style={{ color: "#94a3b8" }}>(월 {p.yield1000M.monthly}만)</span>
                            </td>
                            <td style={{ padding: "10px 12px", backgroundColor: "rgba(56, 189, 248, 0.06)", fontWeight: 700, color: "#34d399" }}>
                              {custom.annual.toLocaleString()}만 <span style={{ color: "#38bdf8", fontWeight: 600 }}>(월 {custom.monthly}만)</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Benchmark Yield by Asset Class */}
              <div style={{ marginTop: "12px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                  📋 계산에 쓴 자산별 연간 분배율 (세전, 최근 시장 기준 가정치)
                </h3>
                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#cbd5e1" }}>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>자산군</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>가정 분배율</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>비고 및 특징</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { asset: "미국배당다우존스", rate: "3.5%", desc: "SCHD와 동일 지수를 추종하는 국내 상장 ETF" },
                        { asset: "S&P500", rate: "1.2%", desc: "배당보다 주가 상승 위주 (성장형 엔진)" },
                        { asset: "커버드콜 (미국배당 계열)", rate: "10.0%", desc: "옵션 프리미엄을 수취하는 고배당 상품 (상품별 7~12% 편차)" },
                        { asset: "리츠 (부동산)", rate: "6.5%", desc: "국내외 우량 부동산 및 인프라 월/분기 배당" },
                        { asset: "한국 고배당주", rate: "5.0%", desc: "은행·금융지주, 통신 등 밸류업 및 높은 배당성향" },
                        { asset: "채권", rate: "3.5%", desc: "미국 국채, 국내 국고채 등 (선물형 ETF는 분배금 없음)" },
                        { asset: "금 / 현금성 (반반)", rate: "1.25%", desc: "금 0%, CD금리형/MMF 2.5%의 가중평균" },
                        { asset: "3번 포트폴리오의 배당주 (미국·한국 반반)", rate: "4.25%", desc: "미국배당(3.5%)과 한국고배당(5.0%)의 가중평균" },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.3)",
                            borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                          }}
                        >
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: "#f8fafc" }}>{item.asset}</td>
                          <td style={{ padding: "8px 12px", color: "#38bdf8", fontWeight: 700 }}>{item.rate}</td>
                          <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{item.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "CHECKPOINTS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                {
                  no: "1",
                  title: "연금계좌의 세제 혜택을 100% 활용하세요",
                  desc: "일반 계좌에서는 배당을 받을 때마다 15.4%의 배당소득세가 즉시 원천징수되고, 연 2,000만원 초과 시 금융소득 종합과세 및 건보료 부과 대상이 됩니다. 반면 연금저축·IRP에서는 배당에 대한 세금이 인출 시점까지 이연되며(과세이연), 55세 이후 연금으로 수령할 때 3.3~5.5%의 아주 낮은 세율이 적용됩니다.",
                  color: "#38bdf8",
                },
                {
                  no: "2",
                  title: "나이와 라이프사이클에 따라 비중을 점진적으로 이동하세요",
                  desc: "은퇴까지 시간이 많이 남은 30~40대에는 ①번 배당성장형으로 자산의 크기를 키우고, 은퇴가 다가올수록 ④번(한·미 분산)이나 ②번(고배당 인컴), ③번(안정 혼합) 쪽으로 서서히 무게중심을 옮겨가는 것이 정석적인 생애주기 자산배분입니다.",
                  color: "#10b981",
                },
                {
                  no: "3",
                  title: "1년에 한 번 정기 리밸런싱을 실천하세요",
                  desc: "시간이 지나면 많이 오른 자산의 비중이 커지고 덜 오른 자산의 비중이 작아집니다. 1년에 한 번 특정 일자를 정해 목표 비중으로 되돌리는 리밸런싱(비싼 자산 일부 매도, 싼 자산 추가 매수)을 진행하면 변동성을 낮추고 장기 복리 효과를 극대화할 수 있습니다.",
                  color: "#f59e0b",
                },
                {
                  no: "4",
                  title: "단순 분배율만 보지 말고 '총수익률(배당+원금)'을 확인하세요",
                  desc: "배당률이 연 10~12%로 높아 보여도, 주가가 지속적으로 하락하여 원금이 깎여 나간다면 실질 수익은 마이너스가 될 수 있습니다. 특히 커버드콜 상품은 주가 상승에 제약이 있으므로, 배당금과 원금의 주가 변동을 합친 '토탈 리턴(Total Return)'을 반드시 검토해야 합니다.",
                  color: "#f87171",
                },
                {
                  no: "5",
                  title: "연 1,500만원 사적연금 절세 한도와 건강보험료 기준을 점검하세요",
                  desc: "연금저축·IRP(세액공제 납입분 및 운용수익)에서 1년에 1,500만원을 초과하여 인출하면 3.3~5.5% 저율과세 대신 16.5% 분리과세 또는 종합과세를 선택해야 합니다. 또한 은퇴 후 피부양자 자격을 유지하려면 배당 등 금융소득을 연 1,000만원(부부 분산 시 2,000만원) 이하로 관리하는 전략이 중요합니다.",
                  color: "#a855f7",
                },
              ].map((cp) => (
                <div
                  key={cp.no}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.15)",
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: cp.color,
                      color: "#0f172a",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                  >
                    {cp.no}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>
                      {cp.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.55 }}>
                      {cp.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(15, 23, 42, 0.7)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            * 위 수익률은 최근 시장 환경 기준 예시이며, 실제 투자 시점의 증권사 상품 공시 분배율을 확인하시기 바랍니다.
          </div>
          <button
            onClick={onClose}
            className="premium-button"
            style={{
              padding: "8px 20px",
              fontSize: "0.82rem",
              fontWeight: 700,
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
