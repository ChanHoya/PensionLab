"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePensionStore } from "@/store/usePensionStore";
import ThemeToggle from "@/components/ThemeToggle";
import DiagnosisReport from "@/components/DiagnosisReport";
import { buildHouseholdReport, type HouseholdReport, type ReportInput } from "@/services/householdReport";
import { fallbackNarrative, type ReportNarrative } from "@/services/reportNarrative";
import { downloadElementAsPdf } from "@/utils/exportPdf";

const emptySubscribe = () => () => {};

export default function AiAdvisorPage() {
  const router = useRouter();
  const store = usePensionStore();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [aiNarrative, setAiNarrative] = useState<ReportNarrative | null>(null);
  const [source, setSource] = useState<"base" | "ai" | "fallback">("base");
  const [model, setModel] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    const savedUserId = typeof window !== "undefined" ? localStorage.getItem("pensionlab_user_id") : null;
    if (!savedUserId && store.nationalPension.contributionMonths === 0) {
      router.push("/onboarding");
    }
  }, [router, store.nationalPension.contributionMonths]);

  // 부부 가구 입력 데이터 구성
  const input: ReportInput = useMemo(
    () => ({
      simulationParams: store.simulationParams,
      basicPension: store.basicPension,
      self: {
        nationalPension: store.nationalPension,
        additionalPayment: store.additionalPayment,
        returnRepayment: store.returnRepayment,
        retirementPensions: store.retirementPensions,
        personalPensions: store.personalPensions,
        pensionInsurances: store.pensionInsurances,
      },
      spouse: store.spouse,
    }),
    [
      store.simulationParams,
      store.basicPension,
      store.nationalPension,
      store.additionalPayment,
      store.returnRepayment,
      store.retirementPensions,
      store.personalPensions,
      store.pensionInsurances,
      store.spouse,
    ]
  );

  // 대시보드와 동일한 계산 엔진으로 가구 리포트 생성
  const report: HouseholdReport | null = useMemo(() => {
    if (!isMounted) return null;
    try {
      return buildHouseholdReport(input);
    } catch (err) {
      console.error("buildHouseholdReport error:", err);
      return null;
    }
  }, [isMounted, input]);

  // 기본 계산 기반 서술 (AI 요청 전 즉시 표시)
  const baseNarrative: ReportNarrative | null = useMemo(() => {
    return report ? fallbackNarrative(report) : null;
  }, [report]);

  const narrative = aiNarrative ?? baseNarrative;

  // AI 종합 진단 요청
  const handleGetDiagnosis = async () => {
    if (!report) return;
    setLoading(true);
    setErrorMsg("");
    setNotice(null);

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "AI 진단 요청에 실패했습니다.");
      }

      if (data.narrative) {
        setAiNarrative(data.narrative);
        setSource(data.source ?? "ai");
        if (data.model) setModel(data.model);
        if (data.notice) setNotice(data.notice);
      }
    } catch (err: unknown) {
      console.error("AI Advisor API error:", err);
      const msg = err instanceof Error ? err.message : "AI 진단 결과를 가져오는 중 오류가 발생했습니다.";
      setErrorMsg(msg);
      setSource("fallback");
    } finally {
      setLoading(false);
    }
  };

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    setPdfDownloading(true);
    try {
      const element = document.getElementById("ai-prescription-pdf-root");
      if (!element) throw new Error("리포트 요소를 찾을 수 없습니다.");
      const prefix = report?.hasSpouse ? "부부가구" : "개인";
      await downloadElementAsPdf(element, `${prefix}_연금종합진단_보고서_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 다운로드 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setPdfDownloading(false);
    }
  };

  if (!isMounted) {
    return (
      <main style={styles.container}>
        <div style={styles.loaderContainer}>
          <div style={styles.spinnerWrapper}>
            <div style={styles.customSpinner} />
          </div>
          <p style={{ marginTop: 16, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            연금 데이터를 불러오는 중입니다...
          </p>
        </div>
      </main>
    );
  }

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
            <span style={{ ...styles.navItem, color: "var(--primary)", fontWeight: "700" }}>
              AI포트폴리오 진단
            </span>
            <Link href="/news" style={styles.navItem}>
              관련 뉴스
            </Link>
            <Link href="/youtube" style={styles.navItem}>
              추천영상
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
        {/* Title and Action Section */}
        <section style={styles.titleSection} className="animate-fade-in no-print">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span style={styles.badge}>{report?.hasSpouse ? "부부 가구 AI 연금 종합 진단" : "AI 연금 종합 진단"}</span>
              <h2 style={styles.pageTitle}>연금자산 AI 종합 진단 & 리밸런싱 처방</h2>
              <p style={styles.pageSubtitle}>
                {report?.hasSpouse
                  ? "부부 가구 관점에서 3층 연금 구조, 가구 현금흐름, 소득 공백기, 세제 최적화 인출전략을 종합 평가한 전문 컨설팅 리포트입니다."
                  : "3층 연금 구조, 가구 현금흐름, 소득 공백기, 세제 최적화 인출전략을 종합 평가한 전문 컨설팅 리포트입니다."}
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  진단 엔진: 계산 엔진(즉시) + Google Gemini 3.8 Flash(정밀 진단)
                </span>
                {report && (report.nps.selfAdded > 0 || report.nps.selfRestored > 0 || report.nps.spouseAdded > 0 || report.nps.spouseRestored > 0) && (
                  <span style={styles.npsTag}>
                    🔁 국민연금 추납·반납 반영됨
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                id="btn-run-diagnosis"
                onClick={handleGetDiagnosis}
                disabled={loading || !report}
                className="premium-button"
                style={{
                  padding: "12px 22px",
                  fontSize: "0.95rem",
                  background: "var(--gradient-brand)",
                  boxShadow: "var(--shadow-brand)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {loading ? "🔄 AI 종합 진단 분석 중..." : source === "ai" ? "🔮 AI 맞춤 진단 다시 받기" : "🔮 AI 맞춤 정밀 진단 받기"}
              </button>

              <button
                id="btn-download-pdf-prescription"
                onClick={handleDownloadPDF}
                disabled={pdfDownloading || !report}
                className="premium-button-secondary"
                style={{
                  padding: "12px 18px",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {pdfDownloading ? "🔄 PDF 생성 중..." : "📥 PDF 리포트 다운로드"}
              </button>
            </div>
          </div>

          {/* Notice Alert */}
          {notice && (
            <div style={styles.noticeBanner}>
              <span style={{ marginRight: 8 }}>ℹ️</span> {notice}
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div style={styles.errorBanner}>
              <span style={{ marginRight: 8 }}>⚠️</span> {errorMsg}
            </div>
          )}
        </section>

        {/* Diagnostic Report Root (Capturable by html2canvas for PDF) */}
        {report && narrative ? (
          <div id="ai-prescription-pdf-root" style={styles.reportContainer} className="animate-fade-in">
            <DiagnosisReport report={report} narrative={narrative} source={source} model={model} />
          </div>
        ) : (
          <div style={styles.emptyCard} className="premium-card">
            <h3>진단할 연금 데이터가 없습니다</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: 8, marginBottom: 16 }}>
              먼저 온보딩에서 국민연금, 퇴직연금, 개인연금 정보를 입력해 주세요.
            </p>
            <Link href="/onboarding" className="premium-button">
              정보 입력하러 가기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: "var(--background)",
    position: "relative",
    overflowX: "hidden",
  },
  bgGlow1: {
    position: "absolute",
    top: "-10%",
    left: "5%",
    width: "50vw",
    height: "50vw",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
    borderRadius: "50%",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    top: "30%",
    right: "-5%",
    width: "45vw",
    height: "45vw",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, rgba(0, 0, 0, 0) 70%)",
    borderRadius: "50%",
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
    position: "sticky",
    top: 0,
    zIndex: 40,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  headerContent: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    gap: "28px",
  },
  navItem: {
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 500,
    transition: "color var(--transition-fast)",
  },
  contentBody: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "32px 20px 80px",
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  titleSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingBottom: "8px",
  },
  badge: {
    display: "inline-block",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--text-accent)",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    width: "fit-content",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  pageTitle: {
    fontSize: "1.85rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    maxWidth: "750px",
    lineHeight: 1.55,
  },
  npsTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "var(--text-accent)",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  noticeBanner: {
    marginTop: 12,
    padding: "12px 16px",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderLeft: "4px solid #38bdf8",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    borderRadius: "var(--radius-sm)",
  },
  errorBanner: {
    marginTop: 12,
    padding: "12px 16px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderLeft: "4px solid var(--danger)",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    borderRadius: "var(--radius-sm)",
  },
  reportContainer: {
    width: "100%",
  },
  emptyCard: {
    padding: "60px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  loaderContainer: {
    padding: "80px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  spinnerWrapper: {
    position: "relative",
    width: "48px",
    height: "48px",
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
};
