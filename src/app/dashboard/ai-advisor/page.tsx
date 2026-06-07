"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import { runPensionSimulation } from "@/services/pensionCalculator";
import ThemeToggle from "@/components/ThemeToggle";
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

// Custom Markdown rendering parser with reasoning cleanup & visual formulas
const renderMarkdown = (text: string) => {
  if (!text) return null;

  // 1. <think>...</think> block extraction & removal from body rendering
  let cleanText = text;
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  cleanText = cleanText.replace(thinkRegex, "").trim();

  return cleanText.split("\n").map((line, idx) => {
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

    // Bullet List (-) or (*)
    if (content.startsWith("-") || content.startsWith("*")) {
      const listText = content.replace(/^[-*]\s*/, "");
      
      // Detection pattern for equations/conversions
      const isCalculation = 
        listText.includes("->") || 
        listText.includes("=>") || 
        listText.includes("=") || 
        listText.includes("≈") || 
        listText.includes("approx") ||
        (listText.includes(":") && (listText.includes("만 원") || listText.includes("원") || listText.includes("억") || listText.includes("%")));

      if (isCalculation) {
        let label = listText;
        let value = "";

        if (listText.includes("->")) {
          const splitIdx = listText.indexOf("->");
          label = listText.substring(0, splitIdx).trim();
          value = listText.substring(splitIdx + 2).trim();
        } else if (listText.includes("=>")) {
          const splitIdx = listText.indexOf("=>");
          label = listText.substring(0, splitIdx).trim();
          value = listText.substring(splitIdx + 2).trim();
        } else if (listText.includes(":")) {
          const splitIdx = listText.indexOf(":");
          label = listText.substring(0, splitIdx).trim();
          value = listText.substring(splitIdx + 1).trim();
        }

        // Polish LaTeX maths and asterisks
        const cleanLabel = label.replace(/\$/g, "").replace(/\*\*/g, "").replace(/\*/g, "").trim();
        const cleanValue = value
          .replace(/\\times/g, " × ")
          .replace(/\\approx/g, " ≈ ")
          .replace(/\$/g, "")
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .trim();

        if (cleanValue) {
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "14px 18px",
                backgroundColor: "rgba(99, 102, 241, 0.04)",
                border: "1px solid rgba(99, 102, 241, 0.12)",
                borderLeft: "4px solid var(--primary)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "10px",
                marginTop: "4px",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                {cleanLabel}
              </span>
              <span style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700, fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                📊 <span className="gradient-text">{cleanValue}</span>
              </span>
            </div>
          );
        }
      }

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
  const [pdfDownloading, setPdfDownloading] = useState(false);

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
    yearsToRetire,
    totalAccumulatedAtRetirement,
    monthlyAnnuityAtRetirement,
    nationalPensionPremiumIncreaseTotal,
    cashFlows,
  } = simulation;

  const hasNational = cashFlows.some((cf) => (cf.national || 0) > 0);
  const hasBasic = cashFlows.some((cf) => (cf.basic || 0) > 0);
  const hasRetirement = cashFlows.some((cf) => (cf.retirement || 0) > 0);
  const hasPersonal = cashFlows.some((cf) => (cf.personal || 0) > 0);
  const hasInsurance = cashFlows.some((cf) => (cf.insurance || 0) > 0);

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
    { name: "퇴직연금 (DB)", value: Math.round(dbLump), color: "#6366f1" },
    { name: "퇴직연금 (DC/IRP)", value: Math.round(dcLump), color: "#818cf8" },
    { name: "개인연금저축", value: Math.round(personalLump), color: "#34d399" },
    { name: "연금보험", value: Math.round(insuranceLump), color: "#fb923c" },
  ].filter(item => item.value > 0);

  const hasAssets = pieData.length > 0;

  // Living cost assessment (assume standard middle class retirement cost: 2.5 million KRW / month)
  const targetAnnuity = 250; // 250만원
  const deficit = targetAnnuity - monthlyAnnuityAtRetirement;
  
  let grade = "준비 필요";
  let gradeColor = "var(--warning)";
  let gradeText = "은퇴 후 기본적인 생활비(250만원) 마련에 추가 보완책이 필요합니다.";
  
  if (monthlyAnnuityAtRetirement >= targetAnnuity) {
    grade = "안정";
    gradeColor = "var(--success)";
    gradeText = "목표 연금액(월 250만원)을 달성하여 노후 준비 수준이 훌륭합니다.";
  } else if (monthlyAnnuityAtRetirement < 120) {
    grade = "보완 시급";
    gradeColor = "var(--danger)";
    gradeText = "월 연금 수령액이 기초 생활비에 미치지 못하므로 즉각적인 납입액 확대가 시급합니다.";
  }

  const handleDownloadPDF = async () => {
    setPdfDownloading(true);
    try {
      const loadLib = () => {
        return new Promise<any>((resolve, reject) => {
          if ((window as any).html2canvas && (window as any).jspdf) {
            resolve({
              html2canvas: (window as any).html2canvas,
              jsPDF: (window as any).jspdf.jsPDF,
            });
            return;
          }
          const s1 = document.createElement("script");
          s1.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s1.onload = () => {
            const s2 = document.createElement("script");
            s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            s2.onload = () => {
              resolve({
                html2canvas: (window as any).html2canvas,
                jsPDF: (window as any).jspdf.jsPDF,
              });
            };
            s2.onerror = reject;
            document.body.appendChild(s2);
          };
          s1.onerror = reject;
          document.body.appendChild(s1);
        });
      };

      const { html2canvas, jsPDF } = await loadLib();
      const element = document.getElementById("ai-prescription-pdf-root");
      if (!element) throw new Error("캡처할 영역을 찾을 수 없습니다.");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0e1c",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      const pdf = new jsPDF("p", "mm", "a4");
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`PensionLab_AI_Prescription_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setPdfDownloading(false);
    }
  };

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

      let recommendationText = data.recommendation || "";
      let thinkingText = data.thinking || "";

      // 만약 recommendation 본문 텍스트 내에 <think>가 노출되어 있을 경우 추출 및 분리
      const thinkMatch = recommendationText.match(/<think>([\s\S]*?)<\/think>/i);
      if (thinkMatch) {
        thinkingText = thinkMatch[1].trim();
        recommendationText = recommendationText.replace(/<think>[\s\S]*?<\/think>/i, "").trim();
      }

      setRecommendation(recommendationText);
      setThinking(thinkingText);
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
              자산관리
            </Link>
            <Link href="/youtube" style={styles.navItem}>
              추천 영상
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
          <span style={styles.badge}>Gemini 3.5 Flash Reasoning Advisor</span>
          <h2 style={styles.pageTitle}>AI 은퇴 자산 진단 & 리밸런싱 처방</h2>
          <p style={styles.pageSubtitle}>
            구글의 최신 초거대 AI <strong>Gemini 3.5 Flash</strong>를 통해 회원님의 3층 연금 및 개인 자산을 입체적으로 분석하고 맞춤형 리밸런싱 전략을 도출합니다.
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
              Gemini 3.5 Flash 모델이 3층 연금 구조, 은퇴 크레바스 기간 분석, 리밸런싱 포트폴리오 및 연금별 인출 순서 세제 효율성을 입체적으로 추론하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        )}

        {/* Diagnostic Results (Only display when recommendation is available) */}
        {!loading && recommendation && (
          <section style={styles.resultContainer} className="animate-fade-in">
            {/* PDF Download Action Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px", width: "100%" }} className="no-print">
              <button
                id="btn-download-pdf-prescription"
                onClick={handleDownloadPDF}
                disabled={pdfDownloading}
                className="premium-button"
                style={{
                  background: "var(--gradient-primary)",
                  padding: "12px 24px",
                  boxShadow: "var(--shadow-brand)",
                  fontWeight: 700,
                }}
              >
                {pdfDownloading ? "🔄 PDF 보고서 생성 중..." : "📥 AI 정밀 처방 보고서 PDF 다운로드"}
              </button>
            </div>

            {/* Capturable PDF Area */}
            <div id="ai-prescription-pdf-root" style={styles.pdfRootContainer}>
              {/* 1. Visual Analysis Dashboard Card */}
              <div style={styles.dashboardCard} className="premium-card">
                <div style={styles.dashboardHeader}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={styles.reportSub}>AI PRESCRIBED RETIREMENT REPORT</span>
                    <div style={styles.logoText}>Pension<span className="gradient-text">Lab</span></div>
                  </div>
                  <h3 style={styles.dashboardTitle}>은퇴 자산 종합 진단 & 시각화 분석</h3>
                </div>

                <div style={styles.divider} />

                {/* Grade Display */}
                <div style={styles.gradeSection}>
                  <div style={styles.gradeTitle}>종합 노후 대비 등급</div>
                  <div style={{ ...styles.gradeBadge, backgroundColor: gradeColor }}>{grade}</div>
                  <p style={styles.gradeDesc}>{gradeText}</p>
                </div>

                {/* Info Summary Table */}
                <div style={styles.summaryTable}>
                  <div style={styles.tableRowHeader}>
                    <div style={styles.tableCell}>분석 항목</div>
                    <div style={styles.tableCell}>진단 및 시뮬레이션 결과</div>
                  </div>
                  <div style={styles.tableRow}>
                    <div style={styles.tableCellLabel}>은퇴 후 예상 월 수령액</div>
                    <div style={styles.tableCellVal}>
                      <strong>{monthlyAnnuityAtRetirement.toLocaleString()}</strong> 만원 / 월
                    </div>
                  </div>
                  <div style={styles.tableRow}>
                    <div style={styles.tableCellLabel}>목표 대비 과부족액 (기준 250만)</div>
                    <div style={{ ...styles.tableCellVal, color: deficit > 0 ? "var(--danger)" : "var(--success)" }}>
                      {deficit > 0 ? `${deficit.toLocaleString()} 만원 부족` : "은퇴 자금 충족"}
                    </div>
                  </div>
                  <div style={{ ...styles.tableRow, borderBottom: "none" }}>
                    <div style={styles.tableCellLabel}>은퇴 시 적립 자산 규모</div>
                    <div style={styles.tableCellVal}>
                      {totalAccumulatedAtRetirement >= 10000 
                        ? `${(totalAccumulatedAtRetirement / 10000).toFixed(2)} 억원`
                        : `${totalAccumulatedAtRetirement.toLocaleString()} 만원`
                      }
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div style={styles.chartsGrid}>
                  <div style={styles.chartCol}>
                    <h4 style={styles.chartBlockTitle}>사적연금 은퇴 시점 적립 비율</h4>
                    <div style={{ height: 200, width: "100%" }}>
                      {hasAssets ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                              isAnimationActive={false}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={24} iconSize={8} style={{ fontSize: "0.75rem" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={styles.emptyChart}>사적연금 적립 데이터 없음</div>
                      )}
                    </div>
                  </div>

                  <div style={styles.chartCol}>
                    <h4 style={styles.chartBlockTitle}>연령별 예상 월 연금 수령액 (3층 구조)</h4>
                    <div style={{ height: 210, width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <ResponsiveContainer width="100%" height={170}>
                        <AreaChart
                          data={cashFlows.filter((cf) => cf.age >= store.simulationParams.retirementAge - 1)}
                          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(99, 102, 241, 0.12)" />
                          <XAxis dataKey="age" tickLine={false} style={{ fontSize: "0.75rem", fill: "var(--text-secondary)" }} />
                          <YAxis tickLine={false} style={{ fontSize: "0.75rem", fill: "var(--text-secondary)" }} />
                          {hasNational && <Area type="monotone" dataKey="national" name="국민" stackId="1" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} isAnimationActive={false} />}
                          {hasBasic && <Area type="monotone" dataKey="basic" name="기초" stackId="1" stroke="var(--info)" fill="var(--info)" fillOpacity={0.4} isAnimationActive={false} />}
                          {hasRetirement && <Area type="monotone" dataKey="retirement" name="퇴직" stackId="1" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} isAnimationActive={false} />}
                          {hasPersonal && <Area type="monotone" dataKey="personal" name="개인" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.4} isAnimationActive={false} />}
                          {hasInsurance && <Area type="monotone" dataKey="insurance" name="보험" stackId="1" stroke="#fb923c" fill="#fb923c" fillOpacity={0.4} isAnimationActive={false} />}
                        </AreaChart>
                      </ResponsiveContainer>
                      <div style={styles.chartLegend}>
                        {hasNational && <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: "var(--primary)" }} />국민</span>}
                        {hasBasic && <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: "var(--info)" }} />기초</span>}
                        {hasRetirement && <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: "#818cf8" }} />퇴직</span>}
                        {hasPersonal && <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: "#34d399" }} />개인</span>}
                        {hasInsurance && <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: "#fb923c" }} />보험</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2026 국민연금 개혁 영향 분석 상자 */}
                <div style={styles.reformImpactBox}>
                  <p style={{ lineHeight: 1.6, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                    2026년부터 실행되는 연금 개혁안에 따라 국민연금 보험료율이 기존 <strong>9.0%</strong>에서 <strong>13.0%</strong>로 인상됩니다.
                  </p>
                  <div style={styles.impactCardRow}>
                    <div style={styles.impactCard}>
                      <span style={styles.impactLabel}>인상 가중 보험료율</span>
                      <span style={styles.impactVal}>+ 4.0%p</span>
                    </div>
                    <div style={styles.impactCard}>
                      <span style={styles.impactLabel}>은퇴 시까지 추가 보험료</span>
                      <span style={{ ...styles.impactVal, color: "var(--danger)" }}>
                        {nationalPensionPremiumIncreaseTotal.toLocaleString()} 만원
                      </span>
                    </div>
                  </div>
                  <p style={styles.impactSubText}>
                    ※ 회원님의 소득과 나이를 고려한 동적 누적 인상 시뮬레이션 결과입니다. 
                    세대별 차등 속도가 적용되어 회원님의 나이에 따른 연차별 인상율을 가중 반영하여 설계되었습니다.
                  </p>
                </div>
              </div>

              {/* 2. Reasoning Accordion (MiniMax's Thinking Process) - Hidden on PDF capture to keep it clean */}
              {thinking && (
                <div style={styles.accordionCard} className="premium-card no-print">
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

              {/* 3. Main Recommendation Content (Prescription) */}
              <div style={styles.prescriptionCard} className="premium-card">
                <div style={styles.prescriptionHeader}>
                  <span style={{ fontSize: "1.75rem" }}>📋</span>
                  <div>
                    <h3 style={styles.prescriptionTitle}>AI 연금 리밸런싱 종합 처방전</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      본 진단은 입력된 자산을 기초로 한 Gemini 3.5 Flash AI의 모델 시뮬레이션 제안서입니다.
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
  pdfRootContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  dashboardCard: {
    padding: "36px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  dashboardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  reportSub: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--primary-300)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  logoText: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  dashboardTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    marginTop: "4px",
  },
  divider: {
    height: "1px",
    backgroundColor: "var(--border)",
    width: "100%",
  },
  gradeSection: {
    backgroundColor: "rgba(255, 255, 255, 0.015)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  gradeTitle: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  gradeBadge: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "#ffffff",
    padding: "8px 24px",
    borderRadius: "100px",
    marginTop: "12px",
    marginBottom: "12px",
    display: "inline-block",
  },
  gradeDesc: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    maxWidth: "520px",
  },
  summaryTable: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
  },
  tableRowHeader: {
    display: "flex",
    backgroundColor: "rgba(99, 102, 241, 0.06)",
    borderBottom: "1px solid var(--border)",
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: "0.85rem",
    color: "var(--text-primary)",
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid var(--border)",
    padding: "14px 18px",
    fontSize: "0.9rem",
    backgroundColor: "var(--surface)",
  },
  tableCell: {
    flex: 1,
  },
  tableCellLabel: {
    flex: 1,
    color: "var(--text-secondary)",
    fontWeight: 600,
  },
  tableCellVal: {
    flex: 1,
    textAlign: "right",
    color: "var(--text-primary)",
    fontWeight: 700,
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  chartCol: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  chartBlockTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "18px",
    textAlign: "center",
  },
  emptyChart: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
  },
  chartLegend: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    fontSize: "0.75rem",
    marginTop: "8px",
    color: "var(--text-secondary)",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  reformImpactBox: {
    backgroundColor: "rgba(239, 68, 68, 0.02)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  impactCardRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  impactCard: {
    flex: 1,
    minWidth: "160px",
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  impactLabel: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  impactVal: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  impactSubText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    lineHeight: "1.4",
  },
};
