"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { runPensionSimulation, CashFlowItem } from "@/services/pensionCalculator";

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

export default function DashboardPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [isMounted, setIsMounted] = useState(false);

  // AI Chat States
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string; sources?: any[] }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || aiLoading) return;

    const userMsg = question.trim();
    setQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다." },
      ]);
    } finally {
      setAiLoading(false);
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

  // Pie Chart Data: 은퇴 자산 구성 비율
  const dbLump = store.retirementPensions
    .filter(r => r.pensionType === "DB")
    .reduce((sum, r) => sum + (r.avgSalary || 0) * ((r.yearsOfService || 0) + yearsToRetire), 0);
  const dcLump = store.retirementPensions
    .filter(r => r.pensionType !== "DB")
    .reduce((sum, r) => sum + (r.totalAccumulated || 0), 0);
  
  const personalLump = store.personalPensions.reduce((sum, p) => sum + p.totalAccumulated, 0);
  const insuranceLump = store.pensionInsurances.reduce((sum, i) => sum + i.totalAccumulated, 0);

  const pieData = [
    { name: "퇴직연금 (DB)", value: Math.round(dbLump), color: "#1e3a5f" },
    { name: "퇴직연금 (DC/IRP)", value: Math.round(dcLump), color: "#2c5282" },
    { name: "개인연금저축", value: Math.round(personalLump), color: "#00b894" },
    { name: "연금보험", value: Math.round(insuranceLump), color: "#f39c12" },
  ].filter(item => item.value > 0);

  // Fallback if no assets configured yet
  const hasAssets = pieData.length > 0;
  const fallbackPieData = [
    { name: "연금자산 미등록 (수동입력 필요)", value: 1, color: "#cbd5e1" }
  ];

  return (
    <main style={styles.container}>
      {/* Background decoration */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.logo}>
            Pension<span style={{ color: "var(--secondary)" }}>Lab</span>
          </Link>
          <nav style={styles.navLinks}>
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>대시보드</span>
            <Link href="/simulator" style={styles.navItem}>시뮬레이터</Link>
            <Link href="/news" style={styles.navItem}>정책 뉴스</Link>
          </nav>
          <div style={{ display: "flex", gap: "12px" }}>
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
        {/* Row 1: KPI Summary */}
        <section style={styles.kpiRow} className="animate-fade-in">
          {/* Card 1 */}
          <div style={styles.kpiCard} className="premium-card">
            <span style={styles.kpiLabel}>은퇴 후 예상 월 연금액</span>
            <h3 style={styles.kpiValue}>
              <span className="gradient-text">{monthlyAnnuityAtRetirement.toLocaleString()}</span> 만원/월
            </h3>
            <p style={styles.kpiSub}>은퇴 나이인 {store.simulationParams.retirementAge}세 수령 기준</p>
          </div>

          {/* Card 2 */}
          <div style={styles.kpiCard} className="premium-card">
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
          <div style={styles.kpiCard} className="premium-card">
            <span style={styles.kpiLabel}>2026 국민연금 개혁 영향</span>
            <h3 style={{ ...styles.kpiValue, color: "var(--danger)" }}>
              + {nationalPensionPremiumIncreaseTotal.toLocaleString()} 만원
            </h3>
            <p style={styles.kpiSub}>개혁안 인상(9%➔13%)에 따른 미래 추가 보험료</p>
          </div>

          {/* Card 4 */}
          <div style={styles.kpiCard} className="premium-card">
            <span style={styles.kpiLabel}>시뮬레이션 프로필</span>
            <h3 style={styles.kpiValue}>
              {currentAge} 세
            </h3>
            <p style={styles.kpiSub}>은퇴까지 남은 기간: <strong>{yearsToRetire}년</strong></p>
          </div>
        </section>

        {/* Row 2: Charts (Side-by-Side) */}
        <section style={styles.chartsGrid}>
          {/* Chart 1: Donut Chart */}
          <div style={styles.chartCard} className="premium-card">
            <h3 style={styles.chartTitle}>은퇴 자산 구성 비율</h3>
            <p style={styles.chartSubtitle}>사적 연금 적립 자산의 분산도</p>
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={hasAssets ? pieData : fallbackPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(hasAssets ? pieData : fallbackPieData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toLocaleString()} 만원` : ""} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Payout Projections */}
          <div className="premium-card" style={{ flexGrow: 2, ...styles.chartCard }}>
            <h3 style={styles.chartTitle}>생애 연금 월 수령액 시뮬레이션</h3>
            <p style={styles.chartSubtitle}>나이별 3층 연금 수급 흐름도 (실질 가치 기준)</p>
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={cashFlows.filter((cf) => cf.age >= store.simulationParams.retirementAge - 2)}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorNational" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBasic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--info)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRetirement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2c5282" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2c5282" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInsurance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="age" tickLine={false} tickFormatter={(age) => `${age}세`} />
                  <YAxis tickLine={false} tickFormatter={(val) => `${val}만`} />
                  <Tooltip formatter={(value) => value !== undefined ? `${value} 만원` : ""} labelFormatter={(label) => `${label}세 기준`} />
                  <Legend />
                  <Area type="monotone" dataKey="national" name="국민연금" stackId="1" stroke="var(--primary)" fillOpacity={1} fill="url(#colorNational)" />
                  <Area type="monotone" dataKey="basic" name="기초연금" stackId="1" stroke="var(--info)" fillOpacity={1} fill="url(#colorBasic)" />
                  <Area type="monotone" dataKey="retirement" name="퇴직연금" stackId="1" stroke="#2c5282" fillOpacity={1} fill="url(#colorRetirement)" />
                  <Area type="monotone" dataKey="personal" name="개인연금저축" stackId="1" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorPersonal)" />
                  <Area type="monotone" dataKey="insurance" name="연금보험" stackId="1" stroke="var(--accent)" fillOpacity={1} fill="url(#colorInsurance)" />
                </AreaChart>
              </ResponsiveContainer>
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
          </div>
        </section>

        {/* Row 4: AI RAG Q&A Chat */}
        <section style={styles.aiCard} className="premium-card">
          <span style={styles.aiBadge}>AI 실시간 연금 상담실</span>
          <h3 style={styles.aiTitle}>유튜브 연금 전문가 기반 RAG Q&A</h3>
          <p style={styles.aiDesc}>
            연금박사, 박곰희TV 등 신뢰할 수 있는 전문가들의 동영상 자막 데이터를 벡터 데이터베이스(pgvector)에서 분석하여 정확하고 명쾌한 조언을 해드립니다.
          </p>

          {/* Chat Window */}
          <div style={styles.chatWindow}>
            {chatHistory.length === 0 ? (
              <div style={styles.chatPlaceholder}>
                💬 질문을 입력하시면 은퇴 설계 RAG 상담을 시작합니다.<br />
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 8, display: "inline-block" }}>
                  (추천 질문: &quot;국민연금 13% 개편안이 나에게 미치는 영향은?&quot;, &quot;퇴직연금 DB형과 DC형 중 무엇이 유리해?&quot;)
                </span>
              </div>
            ) : (
              <div style={styles.chatMessages}>
                {chatHistory.map((chat, idx) => (
                  <div key={idx} style={chat.role === "user" ? styles.userMessageRow : styles.assistantMessageRow}>
                    <div style={chat.role === "user" ? styles.userMessageBubble : styles.assistantMessageBubble}>
                      <div style={{ whiteSpace: "pre-line" }}>{chat.content}</div>
                      
                      {chat.sources && chat.sources.length > 0 && (
                        <div style={styles.sourcesBox}>
                          <div style={styles.sourcesLabel}>🔗 참고한 전문가 영상 출처:</div>
                          <div style={styles.sourcesList}>
                            {chat.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={`https://www.youtube.com/watch?v=${src.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.sourceLink}
                              >
                                [{src.channelName}] {src.title} ➔
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={styles.assistantMessageRow}>
                    <div style={{ ...styles.assistantMessageBubble, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={styles.miniSpinner} />
                      <span>전문가 조언을 분석 중입니다...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleAskAI} style={styles.chatForm}>
              <input
                id="input-ai-question"
                type="text"
                className="premium-input"
                placeholder="연금 개혁, 퇴직연금, 개인연금저축에 대해 질문해 보세요..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={aiLoading}
                style={{ flexGrow: 1 }}
              />
              <button
                id="btn-ai-send"
                type="submit"
                disabled={aiLoading || !question.trim()}
                className="premium-button"
                style={{
                  padding: "10px 20px",
                  opacity: aiLoading || !question.trim() ? 0.6 : 1,
                  cursor: aiLoading || !question.trim() ? "not-allowed" : "pointer"
                }}
              >
                질문하기
              </button>
            </form>
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
    position: "absolute",
    top: "-20%",
    left: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(0, 184, 148, 0.04) 0%, rgba(255,255,255,0) 75%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    bottom: "-20%",
    right: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle, rgba(30, 58, 95, 0.05) 0%, rgba(255,255,255,0) 75%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    width: "100%",
    padding: "20px 40px",
    zIndex: 10,
    borderBottom: "1px solid var(--border)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
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
    color: "var(--primary)",
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
    color: "var(--primary-dark)",
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
    minHeight: "380px",
    display: "flex",
    flexDirection: "column",
  },
  chartTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--primary-dark)",
  },
  chartSubtitle: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginBottom: "20px",
  },
  chartWrapper: {
    width: "100%",
    height: "260px",
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
    background: "linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(0, 184, 148, 0.03) 100%)",
    borderColor: "rgba(0, 184, 148, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  aiBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--secondary-dark)",
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    padding: "4px 8px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
  },
  aiTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "var(--primary-dark)",
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
    backgroundColor: "var(--surface)",
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
};
