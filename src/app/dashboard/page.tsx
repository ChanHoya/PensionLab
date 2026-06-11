"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { runPensionSimulation, CashFlowItem } from "@/services/pensionCalculator";
import ThemeToggle from "@/components/ThemeToggle";

// Dynamic import of Recharts to prevent SSR hydration errors
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Custom Tooltip component for Recharts AreaChart in Dark Theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const activePayload = payload.filter((entry: any) => (entry.value || 0) > 0);
    if (activePayload.length === 0) return null;

    return (
      <div style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
        boxShadow: "var(--shadow-premium)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}>
        <p style={{
          margin: "0 0 8px 0",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "6px"
        }}>{label}세</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {activePayload.map((entry: any, index: number) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: entry.color }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{entry.name}</span>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {entry.value.toLocaleString()} 만원
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [isMounted, setIsMounted] = useState(false);





  const handleExportData = () => {
    const data = {
      nationalPension: store.nationalPension,
      basicPension: store.basicPension,
      retirementPensions: store.retirementPensions,
      personalPensions: store.personalPensions,
      pensionInsurances: store.pensionInsurances,
      simulationParams: store.simulationParams,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `pensionlab_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (
            parsedData.nationalPension &&
            parsedData.basicPension &&
            parsedData.simulationParams
          ) {
            store.importStoreData(parsedData);
            alert("성공적으로 은퇴 설계 데이터를 복원했습니다!");
          } else {
            alert("올바르지 않은 백업 파일 형식입니다.");
          }
        } catch (err) {
          console.error(err);
          alert("파일 읽기 도중 오류가 발생했습니다.");
        }
      };
    }
  };



  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedUserId = localStorage.getItem("pensionlab_user_id");
    if (!savedUserId && store.nationalPension.contributionMonths === 0) {
      // If no data and no saved user, redirect to onboarding
      router.push("/onboarding");
    }
  }, [router, store.nationalPension.contributionMonths]);

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>연금 분석 엔진을 구동하는 중...</p>
      </div>
    );
  }

  // Run the simulation based on store states
  const simulation = runPensionSimulation(
    store.nationalPension,
    store.basicPension,
    store.retirementPensions,
    store.personalPensions,
    store.pensionInsurances,
    store.simulationParams
  );

  const {
    currentAge,
    yearsToRetire,
    totalAccumulatedAtRetirement,
    monthlyAnnuityAtRetirement,
    nationalPensionPremiumIncreaseTotal,
    cashFlows,
  } = simulation;

  // 0원인 연금 항목 필터링 판단
  const hasNational = cashFlows.some((cf) => (cf.national || 0) > 0);
  const hasBasic = cashFlows.some((cf) => (cf.basic || 0) > 0);
  const hasRetirement = cashFlows.some((cf) => (cf.retirement || 0) > 0);
  const hasPersonal = cashFlows.some((cf) => (cf.personal || 0) > 0);
  const hasInsurance = cashFlows.some((cf) => (cf.insurance || 0) > 0);

  // 3층 구조 수령액 비중 계산 (65세 또는 은퇴나이 중 늦은 시점 기준)
  const targetAge = Math.max(65, store.simulationParams.retirementAge);
  const targetCF = cashFlows.find((cf) => cf.age === targetAge) || 
                   cashFlows.find((cf) => cf.age === store.simulationParams.retirementAge) || 
                   { national: 0, basic: 0, retirement: 0, personal: 0, insurance: 0, total: 1 };
  
  const v1 = (targetCF.national || 0) + (targetCF.basic || 0); // 1층
  const v2 = (targetCF.retirement || 0); // 2층
  const v3 = (targetCF.personal || 0) + (targetCF.insurance || 0); // 3층
  const totalVal = v1 + v2 + v3 || 1;
  const pct1 = Math.round((v1 / totalVal) * 100);
  const pct2 = Math.round((v2 / totalVal) * 100);
  const pct3 = Math.round((v3 / totalVal) * 100);

  return (
    <main style={styles.container}>
      {/* Background decoration */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.logo}>
            Pension<span className="gradient-text">Lab</span>
          </Link>
          <nav style={styles.navLinks}>
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>자산관리</span>
            <Link href="/dashboard/ai-advisor" style={styles.navItem}>AI포트폴리오 진단</Link>
            <Link href="/dashboard/withdrawal" style={styles.navItem}>인출전략 시뮬레이터</Link>
            <Link href="/news" style={styles.navItem}>관련 뉴스</Link>
            <Link href="/youtube" style={styles.navItem}>추천영상</Link>
          </nav>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle />
            <Link href="/onboarding" className="premium-button-secondary" style={{ padding: "8px 16px" }} id="btn-re-onboard">
              정보 재입력
            </Link>
            <button
              onClick={() => {
                store.resetStore();
                localStorage.removeItem("pensionlab_user_id");
                router.push("/onboarding");
              }}
              className="premium-button"
              style={{ padding: "8px 16px", background: "var(--danger)" }}
              id="btn-reset-data"
            >
              초기화
            </button>
          </div>
        </div>
      </header>

      <div style={styles.contentBody}>
        {/* Local Security & Caching Banner */}
        <div style={styles.topSecurityBanner} className="premium-card animate-fade-in">
          <span>🔒 <strong>개인정보 안심 보장</strong>: 회원님의 소중한 은퇴 설계 정보는 서버에 전송/저장되지 않으며, 오직 웹 브라우저(LocalStorage)에만 안전하게 보관되므로 유출 걱정 없이 안심하고 이용해 주세요.</span>
        </div>

        {/* Row 1: KPI Summary */}
        <section style={styles.kpiRow} className="animate-fade-in">
          {/* Card 1 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #6366f1" }} className="premium-card">
            <span style={styles.kpiLabel}>은퇴 후 예상 월 연금액</span>
            <h3 style={styles.kpiValue}>
              <span className="gradient-text">{monthlyAnnuityAtRetirement.toLocaleString()}</span> 만원/월
            </h3>
            <p style={styles.kpiSub}>은퇴 나이인 {store.simulationParams.retirementAge}세 수령 기준</p>
          </div>

          {/* Card 2 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #8b5cf6" }} className="premium-card">
            <span style={styles.kpiLabel}>은퇴 시 자산 규모</span>
            <h3 style={styles.kpiValue}>
              {totalAccumulatedAtRetirement >= 10000 
                ? `${(totalAccumulatedAtRetirement / 10000).toFixed(2)} 억원`
                : `${totalAccumulatedAtRetirement.toLocaleString()} 만원`
              }
            </h3>
            <p style={styles.kpiSub}>퇴직+개인연금+연금보험 적립금 합산</p>
          </div>

          {/* Card 3 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #ef4444" }} className="premium-card">
            <span style={styles.kpiLabel}>2026 국민연금 개혁 영향</span>
            <h3 style={{ ...styles.kpiValue, color: "var(--danger)" }}>
              + {nationalPensionPremiumIncreaseTotal.toLocaleString()} 만원
            </h3>
            <p style={styles.kpiSub}>개혁안 인상(9%➔13%)에 따른 미래 추가 보험료</p>
          </div>

          {/* Card 4 */}
          <div style={{ ...styles.kpiCard, borderLeft: "3px solid #f97316" }} className="premium-card">
            <span style={styles.kpiLabel}>시뮬레이션 프로필</span>
            <h3 style={styles.kpiValue}>
              {currentAge} 세
            </h3>
            <p style={styles.kpiSub}>은퇴까지 남은 기간: <strong>{yearsToRetire}년</strong></p>
          </div>
        </section>

        {/* Row 2: Charts (Side-by-Side) */}
        <section style={styles.chartsGrid}>
          {/* Chart 1: 3-Tier Pension House Diagram */}
          <div style={styles.chartCard} className="premium-card">
            <h3 style={styles.chartTitle}>3층 연금 구조 비중</h3>
            <p style={styles.chartSubtitle}>은퇴 수령액 기준 ({targetAge}세 시점 월 수령액)</p>
            <div style={styles.houseChartContainer}>
              {/* 좌측: 집 형태의 다이나믹 차트 */}
              <div style={styles.houseDiagramWrapper}>
                
                {/* 3층 지붕 (개인/보험) */}
                <div style={{
                  ...styles.roofLevel,
                  height: `${Math.max(30, (pct3 / 100) * 240)}px`,
                  opacity: v3 > 0 ? 1 : 0.4
                }}>
                  <span style={styles.houseLabel}>3층 ({pct3}%)</span>
                </div>

                {/* 2층 기둥 (퇴직연금) */}
                <div style={{
                  ...styles.pillarLevel,
                  height: `${Math.max(30, (pct2 / 100) * 240)}px`,
                  opacity: v2 > 0 ? 1 : 0.4
                }}>
                  <span style={styles.houseLabel}>2층 ({pct2}%)</span>
                </div>

                {/* 1층 토대 (국민/기초) */}
                <div style={{
                  ...styles.baseLevel,
                  height: `${Math.max(30, (pct1 / 100) * 240)}px`,
                  opacity: v1 > 0 ? 1 : 0.4
                }}>
                  <span style={styles.houseLabel}>1층 ({pct1}%)</span>
                </div>

              </div>

              {/* 우측: 범례 및 설명 */}
              <div style={styles.houseLegend}>
                {v1 > 0 && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#3b82f6" }} />
                    <div style={styles.legendInfo}>
                      <span style={styles.legendTitle}>1층 국민/기초 (토대)</span>
                      <span style={styles.legendValue}>
                        {v1.toLocaleString()} 만원/월
                      </span>
                    </div>
                  </div>
                )}
                {v2 > 0 && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#facc15" }} />
                    <div style={styles.legendInfo}>
                      <span style={styles.legendTitle}>2층 퇴직연금 (기둥)</span>
                      <span style={styles.legendValue}>
                        {v2.toLocaleString()} 만원/월
                      </span>
                    </div>
                  </div>
                )}
                {v3 > 0 && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#f97316" }} />
                    <div style={styles.legendInfo}>
                      <span style={styles.legendTitle}>3층 개인연금 (지붕)</span>
                      <span style={styles.legendValue}>
                        {v3.toLocaleString()} 만원/월
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Chart 2: Payout Projections */}
          <div style={styles.chartCard} className="premium-card">
            <h3 style={styles.chartTitle}>생애 연금 월 수령액 시뮬레이션</h3>
            <p style={styles.chartSubtitle}>나이별 3층 연금 수급 흐름도 (실질 가치 기준)</p>
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={330}>
                <AreaChart
                  data={cashFlows.filter((cf) => cf.age >= store.simulationParams.retirementAge - 2)}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorNational" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBasic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRetirement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInsurance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99,102,241,0.12)" />
                  <XAxis dataKey="age" tickLine={false} tickFormatter={(age) => `${age}세`} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                  <YAxis tickLine={false} tickFormatter={(val) => `${val}만`} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  {hasNational && <Area type="monotone" dataKey="national" name="국민연금" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNational)" />}
                  {hasBasic && <Area type="monotone" dataKey="basic" name="기초연금" stackId="1" stroke="#93c5fd" fillOpacity={1} fill="url(#colorBasic)" />}
                  {hasRetirement && <Area type="monotone" dataKey="retirement" name="퇴직연금" stackId="1" stroke="#facc15" fillOpacity={1} fill="url(#colorRetirement)" />}
                  {hasPersonal && <Area type="monotone" dataKey="personal" name="개인연금저축" stackId="1" stroke="#f97316" fillOpacity={1} fill="url(#colorPersonal)" />}
                  {hasInsurance && <Area type="monotone" dataKey="insurance" name="연금보험" stackId="1" stroke="#f87171" fillOpacity={1} fill="url(#colorInsurance)" />}
                </AreaChart>
              </ResponsiveContainer>

              {/* 우측 차트 1층 -> 2층 -> 3층 상품 순서 정렬 범례 */}
              <div style={{ ...styles.houseLegend, marginTop: "24px" }}>
                {hasNational && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#3b82f6" }} />
                    <span style={styles.legendTitle}>국민연금</span>
                  </div>
                )}
                {hasBasic && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#93c5fd" }} />
                    <span style={styles.legendTitle}>기초연금</span>
                  </div>
                )}
                {hasRetirement && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#facc15" }} />
                    <span style={styles.legendTitle}>퇴직연금</span>
                  </div>
                )}
                {hasPersonal && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#f97316" }} />
                    <span style={styles.legendTitle}>개인연금저축</span>
                  </div>
                )}
                {hasInsurance && (
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColorBox, backgroundColor: "#f87171" }} />
                    <span style={styles.legendTitle}>연금보험</span>
                  </div>
                )}
              </div>

              {/* 전략 정보 가이드 배너 */}
              <div style={{
                marginTop: "16px",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(99, 102, 241, 0.05)",
                border: "1px dashed rgba(99, 102, 241, 0.2)",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                lineHeight: "1.4",
                textAlign: "center"
              }}>
                {store.simulationParams.decumulationStrategy === "DECREASING" ? (
                  <span>💡 <strong>활동기 집중형 (체감식)</strong>: 소비 활동이 왕성한 은퇴 초반에 수령 비중을 늘리고(120%), 80세 이후 단계적으로 감액(80% ➔ 40%)하는 현실적 은퇴소비 형태(Spending Smile)를 반영했습니다.</span>
                ) : (
                  <span>💡 <strong>동일 금액형 (정액식)</strong>: 은퇴 기간 전반에 걸쳐 평생 일정한 금액을 인출하는 고전적인 설계 방식입니다. (인출 조절이 불가능한 공적연금 제외)</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Row 3: Parameter Sliders */}
        <section style={styles.slidersCard} className="premium-card">
          <h3 style={styles.chartTitle}>실시간 시뮬레이션 매개변수 조정</h3>
          <p style={styles.chartSubtitle}>조건을 조정하여 연금 그래프의 변화를 실시간으로 확인해 보세요.</p>
          
          <div style={styles.slidersGrid}>
            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>현재 나이</label>
                <span style={styles.sliderValue}>{store.simulationParams.currentAge} 세</span>
              </div>
              <input
                type="range"
                min="20"
                max="70"
                value={store.simulationParams.currentAge}
                onChange={(e) => store.setSimulationParams({ currentAge: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>은퇴 나이</label>
                <span style={styles.sliderValue}>{store.simulationParams.retirementAge} 세</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                value={store.simulationParams.retirementAge}
                onChange={(e) => store.setSimulationParams({ retirementAge: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>국민연금 개시 연령</label>
                <span style={styles.sliderValue}>{store.simulationParams.nationalPensionStartAge} 세</span>
              </div>
              <input
                type="range"
                min="60"
                max="70"
                value={store.simulationParams.nationalPensionStartAge}
                onChange={(e) => store.setSimulationParams({ nationalPensionStartAge: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>예상 기대 수명</label>
                <span style={styles.sliderValue}>{store.simulationParams.expectedLifeExpectancy} 세</span>
              </div>
              <input
                type="range"
                min="75"
                max="100"
                value={store.simulationParams.expectedLifeExpectancy}
                onChange={(e) => store.setSimulationParams({ expectedLifeExpectancy: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>물가상승률</label>
                <span style={styles.sliderValue}>{store.simulationParams.inflationRate} %</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={store.simulationParams.inflationRate}
                onChange={(e) => store.setSimulationParams({ inflationRate: Number(e.target.value) })}
                style={styles.sliderRange}
              />
            </div>

            <div style={styles.sliderGroup}>
              <div style={styles.sliderLabelRow}>
                <label style={styles.sliderLabel}>은퇴 연금 인출 전략</label>
                <span style={styles.sliderValue}>
                  {store.simulationParams.decumulationStrategy === "DECREASING"
                    ? "활동기 집중형 (체감식)"
                    : "동일 금액형 (정액식)"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px", height: "36px" }}>
                <button
                  type="button"
                  onClick={() => store.setSimulationParams({ decumulationStrategy: "DECREASING" })}
                  style={{
                    flex: 1,
                    padding: "0 12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    border: store.simulationParams.decumulationStrategy === "DECREASING"
                      ? "1px solid #6366f1"
                      : "1px solid var(--border)",
                    backgroundColor: store.simulationParams.decumulationStrategy === "DECREASING"
                      ? "rgba(99, 102, 241, 0.15)"
                      : "transparent",
                    color: store.simulationParams.decumulationStrategy === "DECREASING"
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  🔥 활동기 집중형 (추천)
                </button>
                <button
                  type="button"
                  onClick={() => store.setSimulationParams({ decumulationStrategy: "FLAT" })}
                  style={{
                    flex: 1,
                    padding: "0 12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    border: store.simulationParams.decumulationStrategy === "FLAT"
                      ? "1px solid #6366f1"
                      : "1px solid var(--border)",
                    backgroundColor: store.simulationParams.decumulationStrategy === "FLAT"
                      ? "rgba(99, 102, 241, 0.15)"
                      : "transparent",
                    color: store.simulationParams.decumulationStrategy === "FLAT"
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  ⚖️ 동일 금액형 (정액)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Row 3.2: Local Data Portability Card */}
        <section style={styles.dataCard} className="premium-card animate-fade-in">
          <div style={styles.dataHeader}>
            <div style={styles.dataTitleIcon}>💾</div>
            <div>
              <h3 style={styles.chartTitle}>로컬 데이터 관리 및 이전</h3>
              <p style={styles.chartSubtitle}>기기 간 은퇴 설계 데이터 내보내기 및 가져오기</p>
            </div>
          </div>
          
          <div style={styles.dataAlert}>
            🔒 <strong>개인정보 안심 정책</strong>: 본 서비스는 회원님의 은퇴 설계 데이터를 서버 데이터베이스에 수집하지 않으며, 오직 현재 기기의 브라우저(LocalStorage)에만 안전하게 보관합니다. 다른 PC나 모바일 기기에서 이어서 사용하시려면 아래 내보내기/가져오기 기능을 사용해 주세요.
          </div>

          <div style={styles.dataActions}>
            <button
              id="btn-export-data"
              onClick={handleExportData}
              className="premium-button"
              style={{ background: "var(--gradient-primary)", padding: "10px 20px" }}
            >
              📤 내 설계 데이터 백업 (JSON 다운로드)
            </button>
            
            <div style={{ display: "inline-block", position: "relative" }}>
              <button
                id="btn-import-data"
                onClick={() => document.getElementById("input-file-import")?.click()}
                className="premium-button-secondary"
                style={{ padding: "10px 20px" }}
              >
                📥 백업 데이터 복원 (JSON 업로드)
              </button>
              <input
                type="file"
                id="input-file-import"
                accept=".json"
                onChange={handleImportData}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </section>




      </div>



    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "var(--background)",
    position: "relative",
    overflow: "hidden",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--background)",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid var(--border)",
    borderTop: "5px solid var(--primary)",
    borderRadius: "50%",
    animation: "pulse-subtle 1.5s infinite linear", // reuse pulse animation
  },
  bgGlow1: {
    position: "fixed",
    top: "-20%",
    left: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    bottom: "-20%",
    right: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    width: "100%",
    padding: "16px 40px",
    zIndex: 10,
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--glass-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    textDecoration: "none",
  },
  navLinks: {
    display: "flex",
    gap: "32px",
  },
  navItem: {
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color var(--transition-fast)",
  },
  contentBody: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px 80px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "30px",
    zIndex: 1,
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },
  kpiCard: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "120px",
  },
  kpiLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  kpiValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: "12px 0 6px 0",
  },
  kpiSub: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
  },
  chartsGrid: {
    display: "flex",
    gap: "30px",
    width: "100%",
  },
  chartCard: {
    padding: "30px",
    flex: 1,
    minHeight: "460px",
    display: "flex",
    flexDirection: "column",
  },
  chartTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  chartSubtitle: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginBottom: "20px",
  },
  chartWrapper: {
    width: "100%",
    height: "380px",
    marginTop: "auto",
  },
  slidersCard: {
    padding: "30px",
  },
  slidersGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px 40px",
    marginTop: "16px",
  },
  sliderGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  sliderValue: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--primary)",
  },
  sliderRange: {
    width: "100%",
    cursor: "pointer",
    accentColor: "var(--primary)",
  },
  aiCard: {
    padding: "30px 40px",
    background: "var(--surface)",
    borderColor: "var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  aiBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#a5b4fc",
    backgroundColor: "rgba(99,102,241,0.15)",
    padding: "4px 8px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
  },
  aiTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginTop: "4px",
  },
  aiDesc: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  chatWindow: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--surface)",
    overflow: "hidden",
    marginTop: "16px",
    boxShadow: "var(--shadow-sm)",
  },
  chatPlaceholder: {
    padding: "40px 20px",
    textAlign: "center",
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
  },
  chatMessages: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "20px",
    maxHeight: "350px",
    overflowY: "auto",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--background)",
  },
  userMessageRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  assistantMessageRow: {
    display: "flex",
    justifyContent: "flex-start",
  },
  userMessageBubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: "16px 16px 4px 16px",
    backgroundColor: "var(--primary)",
    color: "#ffffff",
    fontSize: "0.95rem",
    lineHeight: 1.5,
    boxShadow: "var(--shadow-sm)",
  },
  assistantMessageBubble: {
    maxWidth: "85%",
    padding: "16px 20px",
    borderRadius: "16px 16px 16px 4px",
    backgroundColor: "var(--surface-2)",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-sm)",
  },
  miniSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid var(--border)",
    borderTop: "2px solid var(--primary)",
    borderRadius: "50%",
    animation: "pulse-subtle 1s infinite linear",
  },
  chatForm: {
    display: "flex",
    gap: "12px",
    padding: "16px 20px",
    backgroundColor: "var(--surface)",
  },
  sourcesBox: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px dashed var(--border)",
  },
  sourcesLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "6px",
  },
  sourcesList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sourceLink: {
    fontSize: "0.8rem",
    color: "var(--primary-light)",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color var(--transition-fast)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-premium)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  modalTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: "16px",
    margin: 0,
  },
  modalCloseButton: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "var(--radius-sm)",
    transition: "all var(--transition-fast)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  videoWrapper: {
    position: "relative",
    paddingBottom: "56.25%", /* 16:9 Aspect Ratio */
    height: 0,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  premiumBannerCard: {
    padding: "30px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--surface)",
    borderColor: "rgba(99,102,241,0.3)",
    flexWrap: "wrap",
    gap: "24px",
  },
  premiumBannerLeft: {
    flex: "1 1 500px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  premiumBannerRight: {
    flex: "0 0 auto",
  },
  premiumBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#a5b4fc",
    backgroundColor: "rgba(99,102,241,0.15)",
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  premiumBannerTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  premiumBannerDesc: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  checkoutModal: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-premium)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tossHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
  },
  tossLogo: {
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "1.1rem",
    fontWeight: 900,
    color: "#0050ff",
    letterSpacing: "-0.5px",
  },
  tossClose: {
    background: "none",
    border: "none",
    fontSize: "1.1rem",
    color: "var(--text-muted)",
    cursor: "pointer",
  },
  tossBody: {
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  tossOrderSummary: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--background)",
    padding: "16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  tossOrderLabel: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    fontWeight: 600,
  },
  tossOrderName: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginTop: "4px",
    marginBottom: "12px",
  },
  tossPriceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px dashed var(--border)",
    paddingTop: "10px",
  },
  tossPriceLabel: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
  },
  tossPrice: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "var(--text-primary)",
  },
  tossSectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
  },
  tossMethods: {
    display: "flex",
    gap: "10px",
  },
  tossMethodBtn: {
    flex: 1,
    padding: "12px 8px",
    fontSize: "0.85rem",
    fontWeight: 700,
    borderRadius: "var(--radius-sm)",
    border: "1.5px solid var(--border)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    textAlign: "center",
  },
  tossInfoBox: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
    backgroundColor: "rgba(0, 80, 255, 0.03)",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(0, 80, 255, 0.05)",
  },
  tossFooter: {
    padding: "16px 20px 24px 20px",
    borderTop: "1px solid var(--border)",
  },
  tossPayBtn: {
    width: "100%",
    padding: "14px",
    fontSize: "0.95rem",
    fontWeight: 700,
    backgroundColor: "#0050ff",
    color: "#ffffff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    boxShadow: "0 4px 12px rgba(0, 80, 255, 0.2)",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  topSecurityBanner: {
    backgroundColor: "rgba(99, 102, 241, 0.06)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.5)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 18px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  },
  dataCard: {
    padding: "30px 40px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  dataHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  dataTitleIcon: {
    fontSize: "1.75rem",
  },
  dataAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.06)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.5)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  dataActions: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  houseChartContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "0 8px 8px 8px",
    width: "100%",
    height: "380px",
    marginTop: "auto",
  },
  houseDiagramWrapper: {
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "320px",
    position: "relative",
  },
  roofLevel: {
    width: "70%",
    backgroundColor: "#f97316",
    borderRadius: "4px 4px 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    marginBottom: "2px",
    borderLeft: "4px solid #ea580c",
    borderRight: "4px solid #ea580c",
  },
  pillarLevel: {
    width: "82%",
    backgroundColor: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    marginBottom: "2px",
    borderRadius: "0",
    borderLeft: "8px solid #eab308",
    borderRight: "8px solid #eab308",
  },
  baseLevel: {
    width: "95%",
    backgroundColor: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    borderRadius: "0 0 4px 4px",
    borderBottom: "4px solid #1d4ed8",
  },
  houseLabel: {
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "#0f172a",
    zIndex: 2,
    textShadow: "0 1px 2px rgba(255, 255, 255, 0.4)",
    whiteSpace: "nowrap",
  },
  houseLegend: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "16px 24px",
    marginTop: "20px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  legendColorBox: {
    width: "10px",
    height: "10px",
    borderRadius: "3px",
    flexShrink: 0,
  },
  legendInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  legendTitle: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  legendValue: {
    fontSize: "0.8rem",
    color: "var(--text-primary)",
    fontWeight: 700,
  },
};
