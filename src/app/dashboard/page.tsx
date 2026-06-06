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

export default function DashboardPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [isMounted, setIsMounted] = useState(false);

  // AI Chat States
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string; sources?: any[] }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // YouTube Modal States
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");

  // Toss Payments Checkout States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [payMethod, setPayMethod] = useState<"tosspay" | "card" | "transfer">("tosspay");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleMockPayment = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setShowCheckoutModal(false);
      const orderId = `order_${Date.now()}`;
      const paymentKey = `mock_pay_${Math.random().toString(36).substring(2, 11)}`;
      router.push(`/dashboard/report?orderId=${orderId}&paymentKey=${paymentKey}&amount=5000`);
    }, 1500);
  };

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
    { name: "퇴직연금 (DB)", value: Math.round(dbLump), color: "#4f46e5" },
    { name: "퇴직연금 (DC/IRP)", value: Math.round(dcLump), color: "#6366f1" },
    { name: "개인연금저축", value: Math.round(personalLump), color: "#818cf8" },
    { name: "연금보험", value: Math.round(insuranceLump), color: "#f97316" },
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
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRetirement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
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
                  <Area type="monotone" dataKey="basic" name="기초연금" stackId="1" stroke="#818cf8" fillOpacity={1} fill="url(#colorBasic)" />
                  <Area type="monotone" dataKey="retirement" name="퇴직연금" stackId="1" stroke="#6366f1" fillOpacity={1} fill="url(#colorRetirement)" />
                  <Area type="monotone" dataKey="personal" name="개인연금저축" stackId="1" stroke="#6366f1" fillOpacity={1} fill="url(#colorPersonal)" />
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

        {/* Row 3.5: Premium Report Banner */}
        <section style={styles.premiumBannerCard} className="premium-card animate-fade-in">
          <div style={styles.premiumBannerLeft}>
            <span style={styles.premiumBadge}>Premium Service</span>
            <h3 style={styles.premiumBannerTitle}>AI 은퇴 진단 및 정밀 처방 보고서</h3>
            <p style={styles.premiumBannerDesc}>
              현재 시뮬레이션 데이터와 AI 전문가 소견을 종합하여 인쇄 및 PDF 저장에 최적화된 프리미엄 은퇴 처방 보고서를 발행합니다. (1회 결제: 5,000원)
            </p>
          </div>
          <div style={styles.premiumBannerRight}>
            <button
              id="btn-trigger-checkout"
              className="premium-button"
              style={{ padding: "14px 28px", background: "var(--gradient-secondary)" }}
              onClick={() => setShowCheckoutModal(true)}
            >
              📊 처방 보고서 발급받기
            </button>
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
                          <div style={styles.sourcesLabel}>🔗 참고한 전문가 영상 출처 (클릭 시 재생):</div>
                          <div style={styles.sourcesList}>
                            {chat.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={`https://www.youtube.com/watch?v=${src.videoId}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveVideoId(src.videoId);
                                  setActiveVideoTitle(`[${src.channelName}] ${src.title}`);
                                }}
                                style={{
                                  ...styles.sourceLink,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                id={`link-video-${src.videoId}`}
                              >
                                🎥 [{src.channelName}] {src.title} ➔
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

      {/* YouTube Video Player Modal */}
      {activeVideoId && (
        <div style={styles.modalOverlay} onClick={() => setActiveVideoId(null)} className="animate-fade-in">
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="glass">
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>{activeVideoTitle}</h4>
              <button
                id="btn-close-video"
                onClick={() => setActiveVideoId(null)}
                style={styles.modalCloseButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                ✕
              </button>
            </div>
            <div style={styles.videoWrapper}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                title={activeVideoTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ borderRadius: "var(--radius-sm)", border: "none", position: "absolute", top: 0, left: 0 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toss Payments Mock Checkout Modal */}
      {showCheckoutModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCheckoutModal(false)} className="animate-fade-in">
          <div style={styles.checkoutModal} onClick={(e) => e.stopPropagation()}>
            {/* Toss Header */}
            <div style={styles.tossHeader}>
              <div style={styles.tossLogo}>toss payments</div>
              <button style={styles.tossClose} onClick={() => setShowCheckoutModal(false)}>✕</button>
            </div>
            
            {/* Checkout Body */}
            <div style={styles.tossBody}>
              <div style={styles.tossOrderSummary}>
                <span style={styles.tossOrderLabel}>결제할 상품</span>
                <span style={styles.tossOrderName}>PensionLab AI 은퇴 정밀 처방 보고서</span>
                <div style={styles.tossPriceRow}>
                  <span style={styles.tossPriceLabel}>결제 금액</span>
                  <span style={styles.tossPrice}>5,000 원</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div style={styles.tossSectionTitle}>결제 수단 선택</div>
              <div style={styles.tossMethods}>
                <button
                  type="button"
                  style={{
                    ...styles.tossMethodBtn,
                    borderColor: payMethod === "tosspay" ? "#0050ff" : "var(--border)",
                    backgroundColor: payMethod === "tosspay" ? "rgba(0, 80, 255, 0.05)" : "var(--surface)",
                    color: payMethod === "tosspay" ? "#0050ff" : "var(--text-primary)",
                  }}
                  onClick={() => setPayMethod("tosspay")}
                >
                  🔵 토스페이
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.tossMethodBtn,
                    borderColor: payMethod === "card" ? "#0050ff" : "var(--border)",
                    backgroundColor: payMethod === "card" ? "rgba(0, 80, 255, 0.05)" : "var(--surface)",
                    color: payMethod === "card" ? "#0050ff" : "var(--text-primary)",
                  }}
                  onClick={() => setPayMethod("card")}
                >
                  💳 신용카드
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.tossMethodBtn,
                    borderColor: payMethod === "transfer" ? "#0050ff" : "var(--border)",
                    backgroundColor: payMethod === "transfer" ? "rgba(0, 80, 255, 0.05)" : "var(--surface)",
                    color: payMethod === "transfer" ? "#0050ff" : "var(--text-primary)",
                  }}
                  onClick={() => setPayMethod("transfer")}
                >
                  🏦 계좌이체
                </button>
              </div>

              {payMethod === "tosspay" && (
                <div style={styles.tossInfoBox}>
                  토스페이 결제 시 Toss 앱에서 등록하신 카드로 간편하게 결제하실 수 있습니다.
                </div>
              )}
              {payMethod === "card" && (
                <div style={styles.tossInfoBox}>
                  국민, 현대, 삼성, 신한 등 국내 모든 신용/체크카드 결제를 지원합니다.
                </div>
              )}
              {payMethod === "transfer" && (
                <div style={styles.tossInfoBox}>
                  실시간 은행 계좌 이체를 통해 안전하게 결제하실 수 있습니다.
                </div>
              )}
            </div>

            {/* Checkout Footer */}
            <div style={styles.tossFooter}>
              {paymentProcessing ? (
                <button style={styles.tossPayBtn} disabled>
                  <span style={{ display: "inline-block", ...styles.miniSpinner, borderTopColor: "#ffffff", verticalAlign: "middle", marginRight: 8 }} /> 결제 승인 중...
                </button>
              ) : (
                <button
                  id="btn-toss-pay"
                  style={styles.tossPayBtn}
                  onClick={handleMockPayment}
                >
                  5,000원 안전 결제하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
    background: "radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, rgba(255,255,255,0) 75%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    bottom: "-20%",
    right: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, rgba(255,255,255,0) 75%)",
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
    background: "var(--surface)",
    borderColor: "var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  aiBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--primary-700)",
    backgroundColor: "var(--primary-100)",
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
    borderColor: "var(--primary-light)",
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
    color: "var(--primary-700)",
    backgroundColor: "var(--primary-100)",
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  premiumBannerTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "var(--primary-dark)",
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
    backgroundColor: "var(--primary-50)",
    border: "1px solid var(--primary-100)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 18px",
    fontSize: "0.85rem",
    color: "var(--primary-700)",
    lineHeight: 1.4,
    boxShadow: "var(--shadow-sm)",
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
    backgroundColor: "var(--primary-50)",
    borderLeft: "4px solid var(--primary)",
    borderRadius: "4px",
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
};
