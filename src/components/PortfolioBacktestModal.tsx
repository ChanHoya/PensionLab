"use client";

import React, { useState, useMemo } from "react";
import {
  runPortfolioBacktest,
  PRESET_ALLOCATIONS,
  MarketScenario,
  BacktestDividendPolicy,
  AssetAllocation,
} from "@/services/portfolioBacktest";
import { NumberPopIn, SlidingTabs } from "@/components/motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCapital?: number; // 초기 자본 (만원 단위, 기본값 40,000만원 = 4억)
}

const SCENARIO_TABS: { id: MarketScenario; label: string }[] = [
  { id: "REAL_10Y", label: "🌟 실전 10년 (2015~2024)" },
  { id: "CRISIS_STRESS", label: "📉 위기 스트레스 (하락장)" },
  { id: "SIDEWAYS_INCOME", label: "📈 횡보 인컴 (박스권)" },
];

export default function PortfolioBacktestModal({ isOpen, onClose, defaultCapital = 40000 }: Props) {
  const [capital, setCapital] = useState<number>(defaultCapital);
  const [scenario, setScenario] = useState<MarketScenario>("REAL_10Y");
  const [dividendPolicy, setDividendPolicy] = useState<BacktestDividendPolicy>("REINVEST");
  const [selectedPreset, setSelectedPreset] = useState<string>("DIVIDEND_GROWTH");
  const [allocation, setAllocation] = useState<AssetAllocation>(PRESET_ALLOCATIONS.DIVIDEND_GROWTH.alloc);

  // 프리셋 선택 시 비중 동기화
  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    if (PRESET_ALLOCATIONS[key]) {
      setAllocation({ ...PRESET_ALLOCATIONS[key].alloc });
    }
  };

  // 커스텀 비중 조절 시 프리셋 해제
  const handleAllocChange = (key: keyof AssetAllocation, val: number) => {
    setSelectedPreset("CUSTOM");
    setAllocation((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, val)),
    }));
  };

  // 백테스트 연산 결과
  const result = useMemo(() => {
    return runPortfolioBacktest({
      initialCapital: capital,
      allocation,
      scenario,
      dividendPolicy,
      years: 10,
    });
  }, [capital, allocation, scenario, dividendPolicy]);

  if (!isOpen) return null;

  const totalAlloc = Object.values(allocation).reduce((a, b) => a + b, 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="t-modal-spring"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-backtest-title"
        style={{
          width: "100%",
          maxWidth: "1080px",
          maxHeight: "92vh",
          backgroundColor: "var(--modal-bg, #ffffff)",
          color: "var(--text-primary, #0f1127)",
          borderRadius: "16px",
          border: "1px solid var(--modal-border, #e2e8f0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--modal-surface, #ffffff)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }} aria-hidden="true">📊</span>
            <div>
              <h2
                id="portfolio-backtest-title"
                style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}
              >
                은퇴 자산 포트폴리오 시장 시나리오 백테스팅
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                과거 10개년 실전 시장 및 역사적 위기 시나리오를 바탕으로 배당 재투자 복리 효과와 최대 낙폭(MDD)을 시뮬레이션합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
              borderRadius: "8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* 모달 본문 (스크롤) */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            background: "var(--modal-bg, #ffffff)",
          }}
        >
          {/* 상단 1: 시나리오 탭 & 배당 정책 토글 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ width: "360px", maxWidth: "100%" }}>
              <SlidingTabs
                tabs={SCENARIO_TABS}
                activeTabId={scenario}
                onChange={(id) => setScenario(id as MarketScenario)}
              />
            </div>

            {/* 배당금 정책 토글 버튼 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px",
                background: "var(--modal-surface-sub, #f1f5f9)",
                borderRadius: "10px",
                border: "1px solid var(--modal-border-subtle, #e2e8f0)",
              }}
            >
              <button
                type="button"
                onClick={() => setDividendPolicy("REINVEST")}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: dividendPolicy === "REINVEST" ? "var(--primary-600, #4f46e5)" : "transparent",
                  color: dividendPolicy === "REINVEST" ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                🔄 배당 전액 재투자 (스노우볼)
              </button>
              <button
                type="button"
                onClick={() => setDividendPolicy("PAYOUT")}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: dividendPolicy === "PAYOUT" ? "var(--primary-600, #4f46e5)" : "transparent",
                  color: dividendPolicy === "PAYOUT" ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                💵 배당 전액 현금 인출 (소비형)
              </button>
            </div>
          </div>

          {/* 상단 2: 프리셋 선택 & 자산 비중 조절 */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "var(--modal-surface-card, #f8fafc)",
              border: "1px solid var(--modal-border-subtle, #e2e8f0)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>포트폴리오 프리셋:</span>
                {Object.entries(PRESET_ALLOCATIONS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPreset(key)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: selectedPreset === key ? 700 : 500,
                      border: selectedPreset === key ? "1px solid var(--primary-500)" : "1px solid var(--modal-border, #cbd5e1)",
                      background: selectedPreset === key ? "rgba(99, 102, 241, 0.12)" : "var(--modal-surface, #ffffff)",
                      color: selectedPreset === key ? "var(--primary-600)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 초기 투자금액 설정 */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>초기 운용 자본:</label>
                <input
                  type="number"
                  step={1000}
                  value={capital}
                  onChange={(e) => setCapital(Math.max(1000, Number(e.target.value) || 0))}
                  style={{
                    width: "110px",
                    padding: "5px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--modal-border, #cbd5e1)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textAlign: "right",
                    background: "var(--modal-surface, #ffffff)",
                    color: "var(--text-primary)",
                  }}
                />
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>만원 ({(capital / 10000).toFixed(1)}억원)</span>
              </div>
            </div>

            {/* 자산군별 비중 슬라이더 5종 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "12px",
                paddingTop: "6px",
              }}
            >
              {[
                { key: "dividendGrowth", label: "미국 배당성장(SCHD)", color: "#3b82f6" },
                { key: "coveredCall", label: "고배당 커버드콜", color: "#f59e0b" },
                { key: "sp500", label: "S&P 500 지수", color: "#10b981" },
                { key: "bonds", label: "중장기 국채", color: "#6366f1" },
                { key: "reits", label: "리츠/인프라", color: "#ec4899" },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
                    <strong style={{ color }}>{allocation[key as keyof AssetAllocation]}%</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={allocation[key as keyof AssetAllocation]}
                    onChange={(e) => handleAllocChange(key as keyof AssetAllocation, Number(e.target.value))}
                    style={{ accentColor: color, cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>

            {totalAlloc !== 100 && (
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#f59e0b", textAlign: "right" }}>
                * 비중 합계: {totalAlloc}% (백테스팅 시 100% 비율로 자동 정규화되어 연산됩니다)
              </p>
            )}
          </div>

          {/* KPI 핵심 성과 지표 카드 4종 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "var(--modal-surface-card, #f8fafc)",
                border: "1px solid var(--modal-border-subtle, #e2e8f0)",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>10년 후 최종 자산</span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--primary-600, #4f46e5)", marginTop: "4px" }}>
                <NumberPopIn value={result.finalAsset} />
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginLeft: "4px" }}>만원</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                원금 대비 {result.totalReturnRate >= 0 ? `+${result.totalReturnRate}%` : `${result.totalReturnRate}%`}
              </span>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "var(--modal-surface-card, #f8fafc)",
                border: "1px solid var(--modal-border-subtle, #e2e8f0)",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>10년간 총 수령 배당금</span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
                <NumberPopIn value={result.totalDividends} />
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginLeft: "4px" }}>만원</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                연평균 약 {Math.round(result.totalDividends / 10).toLocaleString()}만원 발생
              </span>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "var(--modal-surface-card, #f8fafc)",
                border: "1px solid var(--modal-border-subtle, #e2e8f0)",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>연평균 복리 성장률 (CAGR)</span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: result.cagr >= 0 ? "#10b981" : "#ef4444", marginTop: "4px" }}>
                {result.cagr >= 0 ? `+${result.cagr}%` : `${result.cagr}%`}
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>실효 배당 및 자본이득 합산</span>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "var(--modal-surface-card, #f8fafc)",
                border: "1px solid var(--modal-border-subtle, #e2e8f0)",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>최대 낙폭 (Max Drawdown)</span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>
                -{result.mdd}%
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>전고점 대비 최대 하락 리스크</span>
            </div>
          </div>

          {/* 재투자 스노우볼 비교 콜아웃 배너 */}
          {result.reinvestDelta && (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>💡</span>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  배당금을 쓰지 않고 100% 재투자(스노우볼) 시 인출 대비 자산이{" "}
                  <strong style={{ color: "var(--primary-600)" }}>
                    +{result.reinvestDelta.assetDelta.toLocaleString()}만원({result.reinvestDelta.assetGrowthRatio}배)
                  </strong>{" "}
                  더 불어납니다.
                </span>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>복리 증식 극대화</span>
            </div>
          )}

          {/* 인터랙티브 시뮬레이션 차트 */}
          <div
            style={{
              padding: "20px 16px 12px",
              borderRadius: "12px",
              background: "var(--modal-surface-card, #f8fafc)",
              border: "1px solid var(--modal-border-subtle, #e2e8f0)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "0 8px" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                연도별 자산 평가액 및 연간 배당금 추이
              </h4>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>단위: 만원</span>
            </div>

            <div style={{ height: 320, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={result.yearly} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--modal-border-subtle, #e2e8f0)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                  <YAxis
                    yAxisId="asset"
                    orientation="left"
                    tickFormatter={(v) => `${Math.round(v / 10000)}억`}
                    tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                  />
                  <YAxis
                    yAxisId="div"
                    orientation="right"
                    tickFormatter={(v) => `${v}만`}
                    tick={{ fontSize: 11, fill: "#f59e0b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #ffffff)",
                      borderColor: "var(--tooltip-border, #cbd5e1)",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      color: "var(--tooltip-text, #0f1127)",
                    }}
                    formatter={(val: any, name: any) => [
                      `${Number(val).toLocaleString()}만원`,
                      name === "endAsset" ? "기말 자산" : "연간 배당금",
                    ]}
                  />
                  <Legend
                    formatter={(val) => (val === "endAsset" ? "기말 자산 (좌축)" : "연간 배당금 (우축)")}
                    wrapperStyle={{ fontSize: "0.8rem", paddingTop: "8px" }}
                  />
                  <Area
                    yAxisId="asset"
                    type="monotone"
                    dataKey="endAsset"
                    fill="rgba(99, 102, 241, 0.15)"
                    stroke="var(--primary-600, #4f46e5)"
                    strokeWidth={2.5}
                  />
                  <Bar
                    yAxisId="div"
                    dataKey="annualDividend"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 연도별 상세 데이터 테이블 */}
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid var(--modal-border-subtle, #e2e8f0)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ background: "var(--modal-table-th, #f8fafc)", borderBottom: "1px solid var(--modal-border, #e2e8f0)" }}>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)" }}>연차</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>자본수익률</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>배당수익률</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>기초 자산</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>당해 배당금</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>기말 자산</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>누적 배당금</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)" }}>낙폭(MDD)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearly.map((row) => (
                    <tr
                      key={row.year}
                      style={{
                        borderBottom: "1px solid var(--modal-border-subtle, #f1f5f9)",
                        background: "var(--modal-bg, #ffffff)",
                      }}
                    >
                      <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 600 }}>{row.year}년</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: row.portfolioReturn >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                        {row.portfolioReturn >= 0 ? `+${row.portfolioReturn}%` : `${row.portfolioReturn}%`}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "#f59e0b", fontWeight: 600 }}>
                        +{row.dividendYield}%
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--text-secondary)" }}>
                        {row.startAsset.toLocaleString()}만
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "#f59e0b", fontWeight: 700 }}>
                        {row.annualDividend.toLocaleString()}만
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--text-primary)", fontWeight: 700 }}>
                        {row.endAsset.toLocaleString()}만
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--text-muted)" }}>
                        {row.cumDividend.toLocaleString()}만
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "center", color: row.drawdown > 0 ? "#ef4444" : "var(--text-muted)", fontWeight: 600 }}>
                        {row.drawdown > 0 ? `-${row.drawdown}%` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--modal-border, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--modal-surface, #ffffff)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            * 본 시뮬레이션은 과거 지수 및 시나리오 통계를 기반으로 한 모의 검증으로, 미래의 확정 수익을 보장하지 않습니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              background: "var(--primary-600, #4f46e5)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              border: "none",
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
