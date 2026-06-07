"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { runPensionSimulation } from "@/services/pensionCalculator";
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

export default function SimulatorSandboxPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedUserId = localStorage.getItem("pensionlab_user_id");
    if (!savedUserId && store.nationalPension.contributionMonths === 0) {
      router.push("/onboarding");
    }
  }, [router, store.nationalPension.contributionMonths]);

  if (!isMounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>시뮬레이터 샌드박스를 준비하는 중...</p>
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
    totalAccumulatedAtRetirement,
    monthlyAnnuityAtRetirement,
    cashFlows,
  } = simulation;

  const hasNational = cashFlows.some((cf) => (cf.national || 0) > 0);
  const hasBasic = cashFlows.some((cf) => (cf.basic || 0) > 0);
  const hasRetirement = cashFlows.some((cf) => (cf.retirement || 0) > 0);
  const hasPersonal = cashFlows.some((cf) => (cf.personal || 0) > 0);
  const hasInsurance = cashFlows.some((cf) => (cf.insurance || 0) > 0);

  return (
    <main style={styles.container}>
      {/* Background decoration */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/dashboard" style={styles.logo}>
            Pension<span className="gradient-text">Lab</span>
          </Link>
          <nav style={styles.navLinks}>
            <Link href="/dashboard" style={styles.navItem}>대시보드</Link>
            <Link href="/dashboard/ai-advisor" style={styles.navItem}>AI 포트폴리오 처방</Link>
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>시뮬레이터</span>
            <Link href="/news" style={styles.navItem}>정책 뉴스</Link>
          </nav>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle />
            <Link href="/onboarding" className="premium-button-secondary" style={{ padding: "8px 16px" }} id="btn-re-onboard">
              정보 재입력
            </Link>
          </div>
        </div>
      </header>

      <div style={styles.contentBody}>
        {/* Title Section */}
        <section style={styles.titleSection} className="animate-fade-in">
          <span style={styles.badge}>Live Simulator Sandbox</span>
          <h2 style={styles.pageTitle}>실시간 연금 변수 시뮬레이터</h2>
          <p style={styles.pageSubtitle}>
            은퇴 나이, 개시 나이, 물가상승률 등의 거시 변수를 실시간으로 튜닝하며 은퇴 시점의 현금 흐름 변화를 직관적으로 분석합니다.
          </p>
        </section>

        {/* Simulator Grid */}
        <div style={styles.dashboardGrid} className="animate-fade-in">
          
          {/* Left Panel: Sliders & Adjustments */}
          <div style={styles.leftPanel} className="premium-card">
            <div style={styles.chartTitleContainer}>
              <div>
                <h3 style={styles.panelTitle}>시뮬레이션 변수 세부 조정</h3>
                <p style={styles.panelSubtitle}>슬라이더를 드래그하여 시나리오를 변경해 보세요.</p>
              </div>
            </div>
            
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
                <label style={styles.sliderLabel}>은퇴 희망 나이</label>
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
                <label style={styles.sliderLabel}>국민연금 개시 나이</label>
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
                <label style={styles.sliderLabel}>기대 수명</label>
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
                <label style={styles.sliderLabel}>예상 물가상승률</label>
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
                    ? "활동기 집중형"
                    : "동일 금액형"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => store.setSimulationParams({ decumulationStrategy: "DECREASING" })}
                  style={{
                    flex: 1,
                    padding: "10px",
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
                  }}
                >
                  🔥 활동기 집중형
                </button>
                <button
                  type="button"
                  onClick={() => store.setSimulationParams({ decumulationStrategy: "FLAT" })}
                  style={{
                    flex: 1,
                    padding: "10px",
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
                  }}
                >
                  ⚖️ 동일 금액형
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Projections Chart */}
          <div style={styles.rightPanel} className="premium-card">
            <div style={styles.chartTitleContainer}>
              <div>
                <h3 style={styles.panelTitle}>예상 생애 연금 시뮬레이션 흐름</h3>
                <p style={styles.panelSubtitle}>조정된 변수에 맞춰 물가상승이 적용된 실질 가치 현금 흐름을 표시합니다.</p>
              </div>
              <div style={styles.kpiBox}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>예상 월 연금액</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-light)" }}>
                  {monthlyAnnuityAtRetirement.toLocaleString()} 만원/월
                </span>
              </div>
            </div>

            <div style={{ height: "330px", width: "100%", position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cashFlows.filter((cf) => cf.age >= store.simulationParams.retirementAge - 2)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
            </div>

            <div style={styles.legendRow}>
              {hasNational && <div style={styles.legendItem}><div style={{ ...styles.colorBox, backgroundColor: "#3b82f6" }} /><span>국민연금</span></div>}
              {hasBasic && <div style={styles.legendItem}><div style={{ ...styles.colorBox, backgroundColor: "#93c5fd" }} /><span>기초연금</span></div>}
              {hasRetirement && <div style={styles.legendItem}><div style={{ ...styles.colorBox, backgroundColor: "#facc15" }} /><span>퇴직연금</span></div>}
              {hasPersonal && <div style={styles.legendItem}><div style={{ ...styles.colorBox, backgroundColor: "#f97316" }} /><span>개인연금저축</span></div>}
              {hasInsurance && <div style={styles.legendItem}><div style={{ ...styles.colorBox, backgroundColor: "#f87171" }} /><span>연금보험</span></div>}
            </div>
          </div>

        </div>
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
    animation: "pulse-subtle 1.5s infinite linear",
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
  titleSection: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  badge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#a5b4fc",
    backgroundColor: "rgba(99,102,241,0.15)",
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  pageTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    maxWidth: "600px",
    lineHeight: 1.5,
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr",
    gap: "30px",
    width: "100%",
    alignItems: "start",
  },
  leftPanel: {
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightPanel: {
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    minHeight: "500px",
    gap: "20px",
  },
  panelTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  panelSubtitle: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginTop: "4px",
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
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  sliderValue: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  sliderRange: {
    width: "100%",
    height: "6px",
    borderRadius: "3px",
    background: "var(--border)",
    outline: "none",
    cursor: "pointer",
  },
  chartTitleContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  kpiBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    backgroundColor: "rgba(99,102,241,0.06)",
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(99,102,241,0.12)",
  },
  legendRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "10px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
  },
  colorBox: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
};
