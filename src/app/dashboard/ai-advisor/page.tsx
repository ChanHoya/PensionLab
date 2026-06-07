"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { runPensionSimulation } from "@/services/pensionCalculator";
import ThemeToggle from "@/components/ThemeToggle";

// Custom helper to parse bold text **like this** and render standard JSX
const parseBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// Custom Markdown rendering parser
const renderMarkdown = (text: string) => {
  return text.split("\n").map((line, idx) => {
    const content = line.trim();
    if (!content) return <div key={idx} style={{ height: "12px" }} />;

    // Heading 3 (###)
    if (content.startsWith("###")) {
      return (
        <h4
          key={idx}
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginTop: "24px",
            marginBottom: "12px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🎯</span> {content.replace("###", "").trim()}
        </h4>
      );
    }

    // Heading 2 (##)
    if (content.startsWith("##")) {
      return (
        <h3
          key={idx}
          style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            color: "var(--primary-light)",
            marginTop: "32px",
            marginBottom: "16px",
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {content.replace("##", "").trim()}
        </h3>
      );
    }

    // Bullet List (-)
    if (content.startsWith("-") || content.startsWith("*")) {
      const listText = content.replace(/^[-*]\s*/, "");
      return (
        <li
          key={idx}
          style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            lineHeight: "1.7",
            marginLeft: "20px",
            marginBottom: "8px",
            listStyleType: "square",
          }}
        >
          {parseBoldText(listText)}
        </li>
      );
    }

    // Regular paragraph
    return (
      <p
        key={idx}
        style={{
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          lineHeight: "1.7",
          marginBottom: "12px",
          textIndent: content.startsWith("[") ? "0px" : "2px",
        }}
      >
        {parseBoldText(content)}
      </p>
    );
  });
};

export default function AIAdvisorPage() {
  const router = useRouter();
  const store = usePensionStore();
  const [isMounted, setIsMounted] = useState(false);

  // API Call States
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string>("");
  const [thinking, setThinking] = useState<string>("");
  const [showThinking, setShowThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

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
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>
          연금 분석 엔진을 구동하는 중...
        </p>
      </div>
    );
  }

  // Run calculation simulation
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
  } = simulation;

  const handleGetDiagnosis = async () => {
    setLoading(true);
    setErrorMsg("");
    setRecommendation("");
    setThinking("");

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nationalPension: store.nationalPension,
          basicPension: store.basicPension,
          retirementPensions: store.retirementPensions,
          personalPensions: store.personalPensions,
          pensionInsurances: store.pensionInsurances,
          simulationParams: store.simulationParams,
        }),
      });

      if (!res.ok) {
        throw new Error("서버로부터 데이터를 가져오지 못했습니다.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setRecommendation(data.recommendation);
      setThinking(data.thinking);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "진단을 받아오는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
            <Link href="/dashboard" style={styles.navItem}>
              대시보드
            </Link>
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>
              AI 포트폴리오 처방
            </span>
            <Link href="/simulator" style={styles.navItem}>
              시뮬레이터
            </Link>
            <Link href="/news" style={styles.navItem}>
              정책 뉴스
            </Link>
          </nav>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle />
            <Link
              href="/onboarding"
              className="premium-button-secondary"
              style={{ padding: "8px 16px" }}
              id="btn-re-onboard"
            >
              정보 재입력
            </Link>
          </div>
        </div>
      </header>

      <div style={styles.contentBody}>
        {/* Title and Intro */}
        <section style={styles.titleSection} className="animate-fade-in">
          <span style={styles.badge}>Gemini 2.0 Flash Reasoning Advisor</span>
          <h2 style={styles.pageTitle}>AI 은퇴 자산 진단 & 리밸런싱 처방</h2>
          <p style={styles.pageSubtitle}>
            구글의 최신 초거대 AI <strong>Gemini 2.0 Flash</strong>를 통해 회원님의 3층 연금 및 개인 자산을 입체적으로 분석하고 맞춤형 리밸런싱 전략을 도출합니다.
          </p>
        </section>

        {/* Current State Summary Card */}
        <section style={styles.summaryGrid} className="animate-fade-in">
          <div style={styles.summaryCard} className="premium-card">
            <h3 style={styles.cardTitle}>현재 은퇴 설계 프로필</h3>
            <div style={styles.profileDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>나이 현황</span>
                <span style={styles.detailValue}>
                  현재 {currentAge}세 ➔ 은퇴 희망 {store.simulationParams.retirementAge}세 (준비 기간: {Math.max(0, store.simulationParams.retirementAge - currentAge)}년)
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>은퇴 시점 연금 자산 규모</span>
                <span style={styles.detailValue}>
                  {totalAccumulatedAtRetirement >= 10000
                    ? `${(totalAccumulatedAtRetirement / 10000).toFixed(2)} 억원`
                    : `${totalAccumulatedAtRetirement.toLocaleString()} 만원`}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>예상 수령액 (은퇴나이 기준)</span>
                <span style={styles.detailValue}>
                  월 <span className="gradient-text">{monthlyAnnuityAtRetirement.toLocaleString()}</span> 만원 / 월 (목표: 월 {store.simulationParams.targetMonthlySpending}만원)
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>선택한 인출 전략</span>
                <span style={styles.detailValue}>
                  {store.simulationParams.decumulationStrategy === "DECREASING"
                    ? "활동기 집중형 (체감식)"
                    : "동일 금액형 (정액식)"}
                </span>
              </div>
            </div>

            <button
              id="btn-run-diagnosis"
              onClick={handleGetDiagnosis}
              disabled={loading}
              className="premium-button"
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "1.05rem",
                marginTop: "24px",
                background: "var(--gradient-brand)",
                boxShadow: "var(--shadow-brand)",
                fontWeight: 700,
              }}
            >
              {loading ? "🔄 Gemini가 포트폴리오를 진단하고 있습니다..." : "🔮 AI 포트폴리오 정밀 처방전 받기"}
            </button>
          </div>
        </section>

        {/* Error Alert */}
        {errorMsg && (
          <div style={styles.errorBanner} className="premium-card">
            <span style={{ marginRight: "8px" }}>⚠️</span> {errorMsg}
          </div>
        )}

        {/* Loading Screen */}
        {loading && (
          <div style={styles.loaderContainer} className="premium-card animate-fade-in">
            <div style={styles.spinnerWrapper}>
              <div style={styles.customSpinner} />
              <div style={styles.customSpinnerInner} />
            </div>
            <h4 style={{ marginTop: "24px", color: "var(--text-primary)", fontWeight: 700 }}>
              AI 추론 엔진 가동 중 (Thinking...)
            </h4>
            <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", maxWidth: "450px", lineHeight: 1.5 }}>
              Gemini 2.0 Flash 모델이 3층 연금 구조, 은퇴 크레바스 기간 분석, 리밸런싱 포트폴리오 및 연금별 인출 순서 세제 효율성을 입체적으로 추론하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        )}

        {/* Diagnostic Results (Only display when recommendation is available) */}
        {!loading && recommendation && (
          <section style={styles.resultContainer} className="animate-fade-in">
            {/* 1. Reasoning Accordion (MiniMax's Thinking Process) */}
            {thinking && (
              <div style={styles.accordionCard} className="premium-card">
                <button
                  id="btn-toggle-thinking"
                  onClick={() => setShowThinking(!showThinking)}
                  style={styles.accordionHeader}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.2rem" }}>🧠</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                      AI의 내부 분석 및 사고 흐름 (Thinking Process)
                    </span>
                  </div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    {showThinking ? "▲ 닫기" : "▼ 상세보기"}
                  </span>
                </button>
                {showThinking && (
                  <div style={styles.accordionContent}>
                    <pre style={styles.thinkingPre}>{thinking}</pre>
                  </div>
                )}
              </div>
            )}

            {/* 2. Main Recommendation Content (Prescription) */}
            <div style={styles.prescriptionCard} className="premium-card">
              <div style={styles.prescriptionHeader}>
                <span style={{ fontSize: "1.75rem" }}>📋</span>
                <div>
                  <h3 style={styles.prescriptionTitle}>AI 연금 리밸런싱 종합 처방전</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    본 진단은 입력된 자산을 기초로 한 Gemini 2.0 Flash AI의 모델 시뮬레이션 제안서입니다.
                  </p>
                </div>
              </div>

              <div style={styles.prescriptionBody}>
                {renderMarkdown(recommendation)}
              </div>

              <div style={styles.prescriptionFooter}>
                <span>🔒 본 진단 보고서는 브라우저 로컬 캐시에 저장되며, 외부 서버로 정보가 유출되지 않습니다.</span>
              </div>
            </div>
          </section>
        )}
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
    maxWidth: "840px",
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
  summaryGrid: {
    width: "100%",
  },
  summaryCard: {
    padding: "30px",
  },
  cardTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "20px",
    borderBottom: "1.5px solid var(--border)",
    paddingBottom: "10px",
  },
  profileDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px dashed var(--border)",
    paddingBottom: "10px",
    flexWrap: "wrap",
    gap: "10px",
  },
  detailLabel: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    fontWeight: 600,
  },
  detailValue: {
    fontSize: "0.95rem",
    color: "var(--text-primary)",
    fontWeight: 700,
  },
  errorBanner: {
    padding: "16px 20px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderLeft: "4px solid var(--danger)",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
  },
  loaderContainer: {
    padding: "50px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface)",
  },
  spinnerWrapper: {
    position: "relative",
    width: "60px",
    height: "60px",
  },
  customSpinner: {
    position: "absolute",
    width: "100%",
    height: "100%",
    border: "4px solid var(--border)",
    borderTop: "4px solid var(--primary-light)",
    borderRadius: "50%",
    animation: "spin 1s infinite linear",
  },
  customSpinnerInner: {
    position: "absolute",
    top: "12%",
    left: "12%",
    width: "76%",
    height: "76%",
    border: "2px solid transparent",
    borderBottom: "2px solid var(--violet-400)",
    borderRadius: "50%",
    animation: "spin 0.6s infinite linear reverse",
  },
  resultContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
  },
  accordionCard: {
    overflow: "hidden",
    border: "1px solid rgba(99, 102, 241, 0.2)",
  },
  accordionHeader: {
    width: "100%",
    padding: "18px 24px",
    background: "rgba(99, 102, 241, 0.05)",
    border: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    textAlign: "left",
    transition: "background var(--transition-fast)",
  },
  accordionContent: {
    padding: "24px",
    background: "rgba(13, 14, 28, 0.4)",
    borderTop: "1px solid var(--border)",
    maxHeight: "400px",
    overflowY: "auto",
  },
  thinkingPre: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    fontFamily: "var(--font-mono, 'Courier New', Courier, monospace)",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
  },
  prescriptionCard: {
    padding: "40px",
    background: "var(--surface)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
  },
  prescriptionHeader: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    borderBottom: "1.5px solid var(--border)",
    paddingBottom: "20px",
    marginBottom: "24px",
  },
  prescriptionTitle: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--text-primary)",
  },
  prescriptionBody: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: "1.7",
  },
  prescriptionFooter: {
    marginTop: "40px",
    borderTop: "1px solid var(--border)",
    paddingTop: "16px",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    textAlign: "center",
  },
};
